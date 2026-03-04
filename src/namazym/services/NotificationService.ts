import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../translations/i18n';
import { NotificationStorage, NotificationPreferences } from '../utils/notificationStorage';
import { ContentLoaderService } from './ContentLoaderService';
import { PrayerTimeDisplay } from './PrayerTimesAdapter';
import { getDailyIndex } from '../utils/localizationUtils';
import hadithData from '../data/hadith.json';
import quranData from '../data/quran_tm_full.json';

/**
 * Senior Notification Engine
 * Handles offline-first scheduling for prayer alerts and daily content.
 */
export class NotificationService {

    /**
     * Initialize notification behavior and channels.
     */
    static async init() {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        if (Platform.OS === 'android') {
            // Standard notification channel
            await Notifications.setNotificationChannelAsync('default_content', {
                name: 'Standard Notifications',
                importance: Notifications.AndroidImportance.DEFAULT,
                sound: 'default',
            });

            // specialized Azan channel for prayer alerts
            await Notifications.setNotificationChannelAsync('azan_channel', {
                name: 'Azan Alerts',
                importance: Notifications.AndroidImportance.HIGH,
                sound: 'azan_short.wav',
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#C9A84C',
            });
        }
    }

    private static readonly DAILY_CONTENT_ID = 'daily-spiritual-content';
    static readonly BRAND_GOLD = '#C9A84C';

    /**
     * Request permissions gracefully.
     */
    static async requestPermissions(): Promise<boolean> {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        return finalStatus === 'granted';
    }

    /**
     * Main scheduling entry point. 
     * Reschedules everything based on current city data and preferences.
     */
    static async rescheduleAll(prayerData: PrayerTimeDisplay, cityLabel: string = '') {
        try {
            // 1. Cancel all previous to prevent spam
            await Notifications.cancelAllScheduledNotificationsAsync();

            const prefs = await NotificationStorage.getPreferences();
            if (!prefs.is_enabled) return;

            // 2. Schedule Prayer Alerts (15-min warning)
            if (prefs.pre_prayer_alert.enabled) {
                await this.schedulePrayerAlerts(prayerData, prefs, cityLabel);
            }

            // 3. Schedule Daily Content (09:00 AM)
            if (prefs.daily_content.enabled) {
                await this.scheduleDailyContent(prefs);
            }

            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            console.log(`[NotificationEngine] Scheduled ${scheduled.length} notifications.`);
        } catch (error) {
            console.error('[NotificationEngine] Reschedule error:', error);
        }
    }

    /**
     * Schedules 15-minute warnings for active prayers.
     */
    private static async schedulePrayerAlerts(data: PrayerTimeDisplay, prefs: NotificationPreferences, city: string) {
        const offset = prefs.pre_prayer_alert.offset_minutes;
        const activePrayers = prefs.pre_prayer_alert.active_prayers;
        const now = new Date();

        // Schedule for today and tomorrow to ensure continuity
        for (let i = 0; i < 2; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);

            for (const [key, timeStr] of Object.entries(data.timings)) {
                const prayerKey = key.toLowerCase() as keyof typeof activePrayers;
                if (!activePrayers[prayerKey]) continue;

                const [hours, minutes] = (timeStr as string).split(':').map(Number);
                const scheduleDate = new Date(date);
                scheduleDate.setHours(hours, minutes, 0, 0);
                scheduleDate.setMinutes(scheduleDate.getMinutes() - offset);

                if (scheduleDate > now) {
                    const localizedPrayerName = i18n.t(`prayer.${prayerKey}`);
                    const soundType = prefs.pre_prayer_alert.sound_type;

                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `🕌 ${localizedPrayerName}`,
                            body: i18n.t('notification.prayer_reminder_blueprint', { prayer: localizedPrayerName, defaultValue: `15 minutes left until ${localizedPrayerName}.` }),
                            data: { type: 'prayer', prayer: prayerKey },
                            color: this.BRAND_GOLD,
                            sound: soundType === 'silent' ? false : (soundType === 'azan_short' ? 'azan_short.wav' : true),
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DATE,
                            date: scheduleDate,
                            channelId: soundType === 'azan_short' ? 'azan_channel' : 'default_content',
                        } as any,
                    });
                }
            }
        }
    }

    /**
     * Schedules a daily notification at 09:00 AM with spiritual content.
     */
    private static async scheduleDailyContent(prefs: NotificationPreferences) {
        const [hour, minute] = prefs.daily_content.time.split(':').map(Number);
        const now = new Date();

        // Deterministic choice between Ayah and Hadith for the day
        const dayIdx = getDailyIndex(now, 1000);
        const isHadithDay = dayIdx % 2 === 0;

        let title = '';
        let body = '';
        let routeData = {};

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
            const key = keys[vIdx]; // e.g. "2:40"
            const [surahId, ayahId] = key.split(':').map(Number);
            const verseText = (quranData as any)[key];
            title = i18n.t('notification.daily_content_ayah_title');
            body = verseText.substring(0, 100).replace(/\n/g, ' ') + '...';
            routeData = { type: 'ayah', surahId, ayahId };
        }

        await Notifications.scheduleNotificationAsync({
            identifier: this.DAILY_CONTENT_ID, // Ensure clean execution (overwrites old)
            content: {
                title,
                body,
                data: routeData,
                color: this.BRAND_GOLD,
                sound: true,
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
     * Clear everything (e.g. on logout or master toggle off)
     */
    static async clearAll() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }
}
