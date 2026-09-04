import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../translations/i18n';
import { NotificationStorage, NotificationPreferences } from '../utils/notificationStorage';
import { PrayerTimeDisplay } from './PrayerTimesAdapter';
import { getDailyIndex } from '../utils/localizationUtils';
import hadithData from '../data/hadith.json';
import quranData from '../data/quran_tm_full.json';
import { getTurkmenPrayerName } from '../constants/prayerNames';
import { cancelScheduledJumaReminders, scheduleWeeklyJumaReminder } from './notifications/jumaReminder';
import { resolveCanonicalPrayerCity } from './prayer/cityResolver';
import { PrayerNotificationStorage } from './notifications/prayerNotificationStorage';
import {
    cancelTrackedPrayerNotifications,
    scheduleCanonicalPrayerNotifications,
} from './notifications/prayerNotificationScheduler';
import type {
    PrayerName,
    PrayerNotificationSettings,
    PrayerRebuildReport,
} from './notifications/prayerNotificationTypes';
import { AZAN_CHANNEL_ID, AZAN_SOUND_FILE, SCHEDULE_DAYS_AHEAD } from './notifications/prayerNotificationTypes';
import { ExactAlarmService } from './ExactAlarmService';
import {
    MARK_PRAYED_ACTION,
    MARK_PRAYED_BUTTON_TITLE,
    PRAYER_ACTION_CATEGORY,
} from '../constants/notificationActions';

type PermissionStatus = 'granted' | 'denied';
type RebuildResult = 'success' | 'partial_failure' | 'permission_denied' | 'disabled' | 'error';

export interface NotificationRebuildReport {
    city: string;
    placeKey: string;
    permissionStatus: PermissionStatus;
    juma: 'scheduled' | 'cancelled' | 'skipped';
    dailyContent: 'scheduled' | 'cancelled' | 'skipped';
    prayer: PrayerRebuildReport | null;
    result: RebuildResult;
    errors: string[];
}

/**
 * Senior Notification Engine
 * Handles offline-first scheduling for prayer alerts and daily content.
 */
export class NotificationService {
    private static readonly DAILY_CONTENT_ID = 'daily-spiritual-content';
    static readonly BRAND_GOLD = '#C9A84C';

    private static toDateISO(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private static summarizeScheduledNotification(
        request: Awaited<ReturnType<typeof Notifications.getAllScheduledNotificationsAsync>>[number],
    ) {
        const trigger = request.trigger as any;
        return {
            identifier: request.identifier,
            type: request.content.data?.type,
            trigger: {
                type: trigger?.type,
                channelId: trigger?.channelId,
                weekday: trigger?.weekday,
                hour: trigger?.hour,
                minute: trigger?.minute,
                repeats: trigger?.repeats,
                date: trigger?.date,
            },
        };
    }

    private static buildPrayerSettings(prefs: NotificationPreferences): PrayerNotificationSettings {
        const stored = prefs.prayer_notifications;
        return {
            enabled: prefs.pre_prayer_alert.enabled && stored.enabled,
            leadMinutes: stored.lead_minutes,
            prayers: {
                fajr: stored.prayers.fajr,
                dhuhr: stored.prayers.dhuhr,
                asr: stored.prayers.asr,
                maghrib: stored.prayers.maghrib,
                isha: stored.prayers.isha,
            },
        };
    }

    private static buildEmptyPrayerReport(placeKey: string): PrayerRebuildReport {
        return {
            city: 'unknown',
            placeKey,
            today: this.toDateISO(new Date()),
            scheduledToday: 0,
            scheduledTomorrow: 0,
            cancelledPrevious: 0,
            skippedPast: 0,
            permissionStatus: 'granted',
            result: 'disabled',
            errors: [],
            perPrayer: {
                fajr: { today: 0, tomorrow: 0, skipped: 0 },
                dhuhr: { today: 0, tomorrow: 0, skipped: 0 },
                asr: { today: 0, tomorrow: 0, skipped: 0 },
                maghrib: { today: 0, tomorrow: 0, skipped: 0 },
                isha: { today: 0, tomorrow: 0, skipped: 0 },
            },
        };
    }

    private static async cancelDailyContentNotifications(): Promise<void> {
        try {
            await Notifications.cancelScheduledNotificationAsync(this.DAILY_CONTENT_ID);
        } catch {
            // no-op: identifier may not exist
        }

        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const legacyDaily = scheduled.filter((request) => {
            const type = request.content.data?.type;
            const trigger = request.trigger as any;
            return trigger?.type === 'daily' && (type === 'ayah' || type === 'hadith');
        });
        await Promise.all(
            legacyDaily.map((request) =>
                Notifications.cancelScheduledNotificationAsync(request.identifier),
            ),
        );
    }

    private static async scheduleFallbackPrayerNotifications(
        data: PrayerTimeDisplay,
        settings: PrayerNotificationSettings,
        soundType: NotificationPreferences['pre_prayer_alert']['sound_type'],
        placeKey: string,
    ): Promise<PrayerRebuildReport> {
        const now = new Date();
        const today = new Date();
        const report = this.buildEmptyPrayerReport(placeKey);
        report.result = 'success';

        report.cancelledPrevious = await cancelTrackedPrayerNotifications();
        if (!settings.enabled) {
            report.result = 'disabled';
            return report;
        }

        const channelId = soundType === 'azan_short' ? AZAN_CHANNEL_ID : 'default_content';
        const sound: string | boolean = soundType === 'silent'
            ? false
            : (soundType === 'azan_short' ? AZAN_SOUND_FILE : true);
        // Reminder uses the standard system sound, distinct from the Azan.
        const reminderSound: string | boolean = soundType === 'silent' ? false : true;

        const mappedTimings: Array<{ key: PrayerName; label: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'; time: string }> = [
            { key: 'fajr', label: 'Fajr', time: data.timings.Fajr },
            { key: 'dhuhr', label: 'Dhuhr', time: data.timings.Dhuhr },
            { key: 'asr', label: 'Asr', time: data.timings.Asr },
            { key: 'maghrib', label: 'Maghrib', time: data.timings.Maghrib },
            { key: 'isha', label: 'Isha', time: data.timings.Isha },
        ];

        const scheduledIds: string[] = [];
        for (const timing of mappedTimings) {
            if (!settings.prayers[timing.key]) continue;
            const [hours, minutes] = timing.time.split(':').map(Number);
            if (Number.isNaN(hours) || Number.isNaN(minutes)) {
                report.errors.push(`Invalid time for ${timing.key}: ${timing.time}`);
                continue;
            }

            const localizedName = getTurkmenPrayerName(timing.label);
            const azanDate = new Date(today);
            azanDate.setHours(hours, minutes, 0, 0);

            // 1) Azan alert exactly at the prayer time.
            if (azanDate > now) {
                const azanId = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `🕌 ${localizedName}`,
                        body: `${localizedName} namazynyň wagty boldy.`,
                        data: {
                            type: 'prayer',
                            kind: 'azan',
                            prayer: timing.key,
                            city: placeKey || 'dynamic',
                            date: this.toDateISO(today),
                            leadMinutes: 0,
                        },
                        sound,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: azanDate,
                        channelId,
                    } as any,
                });
                scheduledIds.push(azanId);
                report.scheduledToday += 1;
                report.perPrayer[timing.key].today += 1;
            } else {
                report.skippedPast += 1;
                report.perPrayer[timing.key].skipped += 1;
            }

            // 2) Optional heads-up reminder before the prayer (gentle sound).
            if (settings.leadMinutes > 0) {
                const reminderDate = new Date(azanDate);
                reminderDate.setMinutes(reminderDate.getMinutes() - settings.leadMinutes);
                if (reminderDate > now) {
                    const reminderId = await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `🕌 ${localizedName}`,
                            body: `${localizedName} namazyna ${settings.leadMinutes} minut galdy.`,
                            data: {
                                type: 'prayer',
                                kind: 'reminder',
                                prayer: timing.key,
                                city: placeKey || 'dynamic',
                                date: this.toDateISO(today),
                                leadMinutes: settings.leadMinutes,
                            },
                            sound: reminderSound,
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DATE,
                            date: reminderDate,
                            channelId: 'default_content',
                        } as any,
                    });
                    scheduledIds.push(reminderId);
                }
            }
        }

        if (scheduledIds.length > 0) {
            await PrayerNotificationStorage.saveScheduledIds(scheduledIds);
        } else {
            await PrayerNotificationStorage.clearScheduledIds();
        }
        await PrayerNotificationStorage.clearScheduleMeta();

        if (report.errors.length > 0 && report.scheduledToday > 0) {
            report.result = 'partial_failure';
        } else if (report.errors.length > 0) {
            report.result = 'error';
        }

        return report;
    }

    /**
     * Initialize notification behavior and channels.
     */
    static async init() {
        // Set synchronously and first: this is what shows alerts while the app is
        // open, so nothing awaited may come before it.
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        // One tap on the azan alert keeps the streak alive without opening the app.
        // Registered before anything is scheduled, but after the handler above, so
        // a stall here can never stop alerts from being displayed.
        await Notifications.setNotificationCategoryAsync(PRAYER_ACTION_CATEGORY, [
            {
                identifier: MARK_PRAYED_ACTION,
                buttonTitle: MARK_PRAYED_BUTTON_TITLE,
                options: { opensAppToForeground: false },
            },
        ]).catch(() => {
            // A missing category only costs the button; alerts still fire.
        });

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default_content', {
                name: 'Standard Notifications',
                importance: Notifications.AndroidImportance.DEFAULT,
                sound: 'default',
            });

            // Remove legacy channels so their old (quieter) sound no longer lingers
            // in the system settings. Android freezes a channel's sound at creation,
            // which is why AZAN_CHANNEL_ID is versioned (now azan_alerts_v3).
            await Notifications.deleteNotificationChannelAsync('azan_channel').catch(() => {});
            await Notifications.deleteNotificationChannelAsync('azan_alerts_v2').catch(() => {});

            await Notifications.setNotificationChannelAsync(AZAN_CHANNEL_ID, {
                name: 'Azan Alerts',
                // MAX so the Azan alert is delivered as a high-priority heads-up
                // notification and plays at full notification volume.
                importance: Notifications.AndroidImportance.MAX,
                sound: AZAN_SOUND_FILE,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#C9A84C',
                bypassDnd: false,
            });
        }
    }

    /**
     * Request permissions gracefully.
     */
    static async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        console.log(`[NotificationEngine] Existing permission status: ${existingStatus}`);
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            console.log(`[NotificationEngine] Requested permission status: ${status}`);
        }
        console.log(`[NotificationEngine] Permission granted: ${finalStatus === 'granted'}`);
        return finalStatus === 'granted';
    }

    /**
     * Main scheduling entry point.
     * Rebuilds prayer + Juma + daily content schedules using targeted cancellation.
     *
     * Serialized: concurrent rebuilds interleave their cancel/schedule passes —
     * the later cleanup sweep only sees notifications the earlier run has already
     * registered, so whatever the earlier run schedules afterwards survives as an
     * orphaned DUPLICATE (double azan at the same minute). Cold start hits this
     * (init + refreshIfDateChanged fire ~100ms apart), so every rebuild goes
     * through one promise chain and runs alone.
     */
    private static rebuildChain: Promise<unknown> = Promise.resolve();

    private static enqueueRebuildTask<T>(task: () => Promise<T>): Promise<T> {
        const run = this.rebuildChain.then(task);
        this.rebuildChain = run.catch(() => undefined);
        return run;
    }

    static rescheduleAll(
        prayerData?: PrayerTimeDisplay | null,
        cityLabel = '',
        placeKey?: string,
    ): Promise<NotificationRebuildReport> {
        return this.enqueueRebuildTask(() => this.rescheduleAllNow(prayerData, cityLabel, placeKey));
    }

    private static rebuildPassCounter = 0;

    private static async rescheduleAllNow(
        prayerData?: PrayerTimeDisplay | null,
        cityLabel = '',
        placeKey?: string,
    ): Promise<NotificationRebuildReport> {
        // warn seviyesinde: release build'te de logcat'e düşer (babel yalnız
        // log/info'yu siler) — sahada kurulum geçişlerini sayılabilir kılar.
        NotificationService.rebuildPassCounter += 1;
        console.warn(`[NotificationEngine] rebuild pass #${NotificationService.rebuildPassCounter} start (place=${placeKey ?? '-'})`);
        const report: NotificationRebuildReport = {
            city: cityLabel || 'unknown',
            placeKey: placeKey ?? '',
            permissionStatus: 'denied',
            juma: 'skipped',
            dailyContent: 'skipped',
            prayer: null,
            result: 'error',
            errors: [],
        };

        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                report.permissionStatus = 'denied';
                report.result = 'permission_denied';
                return report;
            }
            report.permissionStatus = 'granted';

            // Idempotent reconciliation: wipe EVERY scheduled notification, then
            // rebuild the complete set below (prayers + Juma + daily content are
            // all rescheduled by this method). Targeted-cancellation left
            // orphaned duplicates behind when two rebuilds ever interleaved
            // (double azan at the same minute) — a full wipe also cleans sets
            // leaked by older app versions after the store update.
            await Notifications.cancelAllScheduledNotificationsAsync();

            const prefs = await NotificationStorage.getPreferences();
            console.log(`[NotificationEngine] Master notifications enabled: ${prefs.is_enabled}`);
            console.log(`[NotificationEngine] Prayer reminders enabled: ${prefs.pre_prayer_alert.enabled && prefs.prayer_notifications.enabled}`);
            console.log(`[NotificationEngine] Juma reminder enabled: ${prefs.juma_reminder.enabled}`);
            if (!prefs.is_enabled) {
                // Master switch off — the wipe above already cleared everything;
                // the targeted cancels below just clear the tracking storage.
                await cancelTrackedPrayerNotifications();
                await this.cancelDailyContentNotifications();
                await cancelScheduledJumaReminders();
                report.juma = 'cancelled';
                report.dailyContent = 'cancelled';
                report.prayer = this.buildEmptyPrayerReport(placeKey ?? '');
                report.result = 'disabled';
                return report;
            }

            if (prefs.juma_reminder.enabled) {
                await scheduleWeeklyJumaReminder(prefs.juma_reminder.hour, prefs.juma_reminder.minute);
                report.juma = 'scheduled';
            } else {
                await cancelScheduledJumaReminders();
                report.juma = 'cancelled';
            }

            const prayerSettings = this.buildPrayerSettings(prefs);
            const canonicalCity = placeKey ? resolveCanonicalPrayerCity(placeKey) : null;

            if (canonicalCity) {
                report.prayer = await scheduleCanonicalPrayerNotifications({
                    city: canonicalCity,
                    placeKey: placeKey ?? canonicalCity,
                    settings: prayerSettings,
                    soundType: prefs.pre_prayer_alert.sound_type,
                });
                report.city = canonicalCity;
                console.log('[NotificationEngine] Canonical prayer rebuild report:', report.prayer);
            } else if (prayerData) {
                report.prayer = await this.scheduleFallbackPrayerNotifications(
                    prayerData,
                    prayerSettings,
                    prefs.pre_prayer_alert.sound_type,
                    placeKey ?? 'dynamic',
                );
                console.log('[NotificationEngine] Fallback prayer rebuild report:', report.prayer);
            } else {
                const cancelled = await cancelTrackedPrayerNotifications();
                const prayerReport = this.buildEmptyPrayerReport(placeKey ?? 'unknown');
                prayerReport.cancelledPrevious = cancelled;
                prayerReport.result = prayerSettings.enabled ? 'unsupported_city' : 'disabled';
                if (prayerSettings.enabled) {
                    prayerReport.errors.push('Prayer scheduling skipped: unsupported city or missing place key.');
                }
                report.prayer = prayerReport;
            }

            if (prefs.daily_content.enabled) {
                await this.scheduleDailyContent(prefs);
                report.dailyContent = 'scheduled';
            } else {
                await this.cancelDailyContentNotifications();
                report.dailyContent = 'cancelled';
            }

            // Nihai tekilleştirme: eşzamanlı iki kurulum geçişi yaşansa bile
            // (ör. Activity yeniden kurulumu ile ikinci JS runtime) her mantıksal
            // bildirim tek kayıtla kalır. Anahtar seçimi deterministiktir; en son
            // biten geçişin süpürmesi birleşimi görüp fazlalıkları iptal eder.
            try {
                const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
                const seenByLogicalKey = new Set<string>();
                for (const request of allScheduled) {
                    const data = request.content.data as Record<string, unknown> | undefined;
                    const type = data?.type;
                    let logicalKey: string | null = null;
                    if (type === 'prayer') {
                        logicalKey = `prayer|${data?.date}|${data?.prayer}|${data?.kind}`;
                    } else if (type === 'hadith' || type === 'ayah') {
                        logicalKey = 'daily_content';
                    } else if (type === 'juma_reminder') {
                        logicalKey = 'juma_reminder';
                    }
                    if (!logicalKey) continue;
                    if (seenByLogicalKey.has(logicalKey)) {
                        await Notifications.cancelScheduledNotificationAsync(request.identifier);
                    } else {
                        seenByLogicalKey.add(logicalKey);
                    }
                }
            } catch {
                // best-effort — süpürme hatası kurulumu bozmaz
            }

            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            console.warn(`[NotificationEngine] rebuild pass #${NotificationService.rebuildPassCounter} done — ${scheduled.length} scheduled`);
            console.log(
                '[NotificationEngine] Scheduled notifications snapshot:',
                scheduled.map((request) => this.summarizeScheduledNotification(request)),
            );

            if (report.prayer?.result === 'partial_failure') {
                report.result = 'partial_failure';
            } else if (
                report.prayer?.result === 'error' ||
                report.prayer?.result === 'missing_dataset' ||
                report.prayer?.result === 'unsupported_city'
            ) {
                report.result = 'error';
            } else {
                report.result = 'success';
            }

            if (report.prayer?.errors?.length) {
                report.errors.push(...report.prayer.errors);
            }

            return report;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            report.errors.push(message);
            report.result = 'error';
            console.error('[NotificationEngine] Reschedule error:', error);
            return report;
        }
    }

    /**
     * Ensures canonical prayer schedules stay current when day changes
     * while app remains open.
     */
    static refreshIfDateChanged(
        prayerData?: PrayerTimeDisplay | null,
        cityLabel = '',
        placeKey?: string,
    ): Promise<boolean> {
        // Runs inside the rebuild chain so the meta check always observes the
        // finished state of any rebuild that was already in flight.
        return this.enqueueRebuildTask(() => this.refreshIfDateChangedNow(prayerData, cityLabel, placeKey));
    }

    private static async refreshIfDateChangedNow(
        prayerData?: PrayerTimeDisplay | null,
        cityLabel = '',
        placeKey?: string,
    ): Promise<boolean> {
        if (!placeKey) return false;

        const canonicalCity = resolveCanonicalPrayerCity(placeKey);
        if (!canonicalCity) return false;

        const meta = await PrayerNotificationStorage.getScheduleMeta();
        const now = new Date();
        const todayISO = this.toDateISO(now);
        const alarmStatus = await ExactAlarmService.getStatus();

        const scheduledDates = Array.isArray(meta?.scheduledForDates) ? meta.scheduledForDates : [];
        const shouldRebuild =
            !meta ||
            meta.placeKey !== placeKey ||
            scheduledDates[0] !== todayISO ||
            // Horizon grew (app update) or the day rolled — top the window back up.
            scheduledDates.length < SCHEDULE_DAYS_AHEAD ||
            // Exact-alarm access changed (user visited "Alarms & reminders"):
            // reschedule so pending alarms switch to the exact code path.
            meta.exactAlarmGranted !== alarmStatus.canScheduleExactAlarms;

        if (!shouldRebuild) return false;

        // Already inside the rebuild chain — call the unqueued variant directly
        // (going through rescheduleAll() here would enqueue behind ourselves
        // and deadlock).
        await this.rescheduleAllNow(prayerData, cityLabel, placeKey);
        return true;
    }

    /**
     * Schedules a daily notification at 09:00 AM with spiritual content.
     */
    private static async scheduleDailyContent(prefs: NotificationPreferences) {
        await this.cancelDailyContentNotifications();

        const [hour, minute] = prefs.daily_content.time.split(':').map(Number);
        const now = new Date();

        const dayIdx = getDailyIndex(now, 1000);
        const isHadithDay = dayIdx % 2 === 0;

        let title = '';
        let body = '';
        let routeData: Record<string, unknown> = {};

        if (isHadithDay) {
            const hadiths = (hadithData as any).hadiths;
            const hIdx = getDailyIndex(now, hadiths.length);
            const hadith = hadiths[hIdx];
            title = i18n.t('notification.daily_content_hadith_title');
            body = hadith.text_turkmen.substring(0, 100).replace(/\n/g, ' ') + '...';
            routeData = { type: 'hadith', hadithId: hadith.id };
        } else {
            const keys = Object.keys(quranData);
            const vIdx = getDailyIndex(now, keys.length);
            const key = keys[vIdx];
            const [surahId, ayahId] = key.split(':').map(Number);
            const verseText = (quranData as any)[key];
            title = i18n.t('notification.daily_content_ayah_title');
            body = verseText.substring(0, 100).replace(/\n/g, ' ') + '...';
            routeData = { type: 'ayah', surahId, ayahId };
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: routeData,
                color: this.BRAND_GOLD,
                sound: prefs.daily_content.sound_type === 'silent' ? false : true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
                channelId: 'default_content',
            } as any,
        });
    }

    /**
     * Explicit full clear (dev/debug scenarios).
     */
    static async clearAll() {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await PrayerNotificationStorage.clearScheduledIds();
        await PrayerNotificationStorage.clearScheduleMeta();
    }
}
