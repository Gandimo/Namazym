import * as Notifications from 'expo-notifications';
import { PRAYER_ACTION_CATEGORY } from '../../constants/notificationActions';
import { getTurkmenPrayerName } from '../../constants/prayerNames';
import { ExactAlarmService } from '../ExactAlarmService';
import { PrayerEngine } from '../prayer/engine';
import type { SupportedCity } from '../prayer/types';
import { PrayerNotificationStorage } from './prayerNotificationStorage';
import type { PrayerName, PrayerNotificationSettings, PrayerRebuildReport } from './prayerNotificationTypes';
import { AZAN_CHANNEL_ID, AZAN_SOUND_FILE, SCHEDULE_DAYS_AHEAD } from './prayerNotificationTypes';

type SoundType = 'azan_short' | 'standard' | 'silent';

const PRAYER_ORDER: Array<{ key: PrayerName; datasetKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; labelKey: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' }> = [
    { key: 'fajr', datasetKey: 'fajr', labelKey: 'Fajr' },
    { key: 'dhuhr', datasetKey: 'dhuhr', labelKey: 'Dhuhr' },
    { key: 'asr', datasetKey: 'asr', labelKey: 'Asr' },
    { key: 'maghrib', datasetKey: 'maghrib', labelKey: 'Maghrib' },
    { key: 'isha', datasetKey: 'isha', labelKey: 'Isha' },
];

function buildPerPrayerCounters(): PrayerRebuildReport['perPrayer'] {
    return {
        fajr: { today: 0, tomorrow: 0, skipped: 0 },
        dhuhr: { today: 0, tomorrow: 0, skipped: 0 },
        asr: { today: 0, tomorrow: 0, skipped: 0 },
        maghrib: { today: 0, tomorrow: 0, skipped: 0 },
        isha: { today: 0, tomorrow: 0, skipped: 0 },
    };
}

function toDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseTimeForDate(date: Date, hhmm: string): Date {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const scheduleDate = new Date(date);
    scheduleDate.setHours(hours, minutes, 0, 0);
    return scheduleDate;
}

export async function cancelTrackedPrayerNotifications(): Promise<number> {
    const trackedIds = await PrayerNotificationStorage.getScheduledIds();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const discoveredIds = scheduled
        .filter((request) => request.content.data?.type === 'prayer')
        .map((request) => request.identifier);
    const idsToCancel = Array.from(new Set([...trackedIds, ...discoveredIds]));

    if (idsToCancel.length === 0) {
        return 0;
    }

    await Promise.allSettled(
        idsToCancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    );
    await PrayerNotificationStorage.clearScheduledIds();
    return idsToCancel.length;
}

export async function scheduleCanonicalPrayerNotifications(input: {
    city: SupportedCity;
    placeKey: string;
    settings: PrayerNotificationSettings;
    soundType: SoundType;
    now?: Date;
}): Promise<PrayerRebuildReport> {
    const now = input.now ?? new Date();
    const todayDate = new Date(now);
    const todayISO = toDateISO(todayDate);

    const report: PrayerRebuildReport = {
        city: input.city,
        placeKey: input.placeKey,
        today: todayISO,
        scheduledToday: 0,
        scheduledTomorrow: 0,
        cancelledPrevious: 0,
        skippedPast: 0,
        permissionStatus: 'granted',
        result: 'success',
        errors: [],
        perPrayer: buildPerPrayerCounters(),
    };

    report.cancelledPrevious = await cancelTrackedPrayerNotifications();

    if (!input.settings.enabled) {
        report.result = 'disabled';
        await PrayerNotificationStorage.clearScheduleMeta();
        return report;
    }

    const scheduledIds: string[] = [];
    const channelId = input.soundType === 'azan_short' ? AZAN_CHANNEL_ID : 'default_content';
    const sound: string | boolean = input.soundType === 'silent'
        ? false
        : (input.soundType === 'azan_short' ? AZAN_SOUND_FILE : true);
    // The pre-prayer reminder uses the standard system sound so it is clearly
    // distinct from the Azan that plays at the prayer time itself.
    const reminderSound: string | boolean = input.soundType === 'silent' ? false : true;

    // Today + the following days; every day after today lands in the
    // "tomorrow" report bucket (kept for report shape compatibility).
    const targets = Array.from({ length: SCHEDULE_DAYS_AHEAD }, (_, offset) => {
        const dateObj = new Date(todayDate);
        dateObj.setDate(dateObj.getDate() + offset);
        return {
            dateObj,
            dateISO: toDateISO(dateObj),
            bucket: offset === 0 ? ('today' as const) : ('tomorrow' as const),
        };
    });

    for (const target of targets) {
        let times: Awaited<ReturnType<typeof PrayerEngine.getPrayerTimes>>;
        try {
            times = PrayerEngine.getPrayerTimes(input.city, target.dateISO);
        } catch (error) {
            report.errors.push(
                `[${target.dateISO}] ${(error as Error)?.message || String(error)}`,
            );
            continue;
        }

        for (const prayer of PRAYER_ORDER) {
            if (!input.settings.prayers[prayer.key]) continue;

            const prayerTime = times[prayer.datasetKey];
            const localizedName = getTurkmenPrayerName(prayer.labelKey);
            const azanTime = parseTimeForDate(target.dateObj, prayerTime);

            // 1) Azan alert exactly at the prayer time.
            if (azanTime > now) {
                const azanId = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `🕌 ${localizedName}`,
                        body: `${localizedName} namazynyň wagty boldy.`,
                        data: {
                            type: 'prayer',
                            kind: 'azan',
                            prayer: prayer.key,
                            // Canonical key so the action handler can mark the
                            // tracker without repeating a case-mapping table.
                            trackerKey: prayer.labelKey,
                            city: input.city,
                            date: target.dateISO,
                            leadMinutes: 0,
                        },
                        sound,
                        categoryIdentifier: PRAYER_ACTION_CATEGORY,
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: azanTime,
                        channelId,
                    } as any,
                });

                scheduledIds.push(azanId);
                if (target.bucket === 'today') {
                    report.scheduledToday += 1;
                    report.perPrayer[prayer.key].today += 1;
                } else {
                    report.scheduledTomorrow += 1;
                    report.perPrayer[prayer.key].tomorrow += 1;
                }
            } else {
                report.skippedPast += 1;
                report.perPrayer[prayer.key].skipped += 1;
            }

            // 2) Optional heads-up reminder before the prayer (gentle sound).
            if (input.settings.leadMinutes > 0) {
                const reminderTime = new Date(azanTime);
                reminderTime.setMinutes(reminderTime.getMinutes() - input.settings.leadMinutes);
                if (reminderTime > now) {
                    const reminderId = await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `🕌 ${localizedName}`,
                            body: `${localizedName} namazyna ${input.settings.leadMinutes} minut galdy.`,
                            data: {
                                type: 'prayer',
                                kind: 'reminder',
                                prayer: prayer.key,
                                city: input.city,
                                date: target.dateISO,
                                leadMinutes: input.settings.leadMinutes,
                            },
                            sound: reminderSound,
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DATE,
                            date: reminderTime,
                            channelId: 'default_content',
                        } as any,
                    });
                    scheduledIds.push(reminderId);
                }
            }
        }
    }

    // Mutlak tekilleştirme: hangi yarış ya da yeniden kurulum yaşanmış olursa
    // olsun, her mantıksal bildirim — (tarih | namaz | tür) — sonunda TEK
    // kayıtla kalır. En-iyi-çaba: başarısızlığı kurulumu bozmaz.
    try {
        const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
        const seenByLogicalKey = new Set<string>();
        for (const request of allScheduled) {
            const data = request.content.data as Record<string, unknown> | undefined;
            if (!data || data.type !== 'prayer') continue;
            const logicalKey = `${data.date}|${data.prayer}|${data.kind}`;
            if (seenByLogicalKey.has(logicalKey)) {
                await Notifications.cancelScheduledNotificationAsync(request.identifier);
            } else {
                seenByLogicalKey.add(logicalKey);
            }
        }
    } catch {
        // ignore — dedup sweep is best-effort
    }

    if (scheduledIds.length > 0) {
        const alarmStatus = await ExactAlarmService.getStatus();
        await PrayerNotificationStorage.saveScheduledIds(scheduledIds);
        await PrayerNotificationStorage.saveScheduleMeta({
            city: input.city,
            placeKey: input.placeKey,
            scheduledForDates: targets.map((target) => target.dateISO),
            rebuiltAt: new Date().toISOString(),
            leadMinutes: input.settings.leadMinutes,
            exactAlarmGranted: alarmStatus.canScheduleExactAlarms,
        });
    } else {
        await PrayerNotificationStorage.clearScheduledIds();
        await PrayerNotificationStorage.clearScheduleMeta();
    }

    if (report.errors.length > 0 && (report.scheduledToday + report.scheduledTomorrow) > 0) {
        report.result = 'partial_failure';
    } else if (report.errors.length > 0) {
        report.result = 'missing_dataset';
    }

    return report;
}
