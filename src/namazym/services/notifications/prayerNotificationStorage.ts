import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PrayerScheduleMeta } from './prayerNotificationTypes';

const PRAYER_NOTIFICATION_IDS_KEY = '@namazym_prayer_notification_ids_v1';
const PRAYER_NOTIFICATION_META_KEY = '@namazym_prayer_notification_meta_v1';

export const PrayerNotificationStorage = {
    async getScheduledIds(): Promise<string[]> {
        try {
            const raw = await AsyncStorage.getItem(PRAYER_NOTIFICATION_IDS_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter((item): item is string => typeof item === 'string');
        } catch (error) {
            console.error('[PrayerNotificationStorage] getScheduledIds error:', error);
            return [];
        }
    },

    async saveScheduledIds(ids: string[]): Promise<void> {
        try {
            const unique = Array.from(new Set(ids.filter((id) => id.length > 0)));
            await AsyncStorage.setItem(PRAYER_NOTIFICATION_IDS_KEY, JSON.stringify(unique));
        } catch (error) {
            console.error('[PrayerNotificationStorage] saveScheduledIds error:', error);
        }
    },

    async clearScheduledIds(): Promise<void> {
        try {
            await AsyncStorage.removeItem(PRAYER_NOTIFICATION_IDS_KEY);
        } catch (error) {
            console.error('[PrayerNotificationStorage] clearScheduledIds error:', error);
        }
    },

    async getScheduleMeta(): Promise<PrayerScheduleMeta | null> {
        try {
            const raw = await AsyncStorage.getItem(PRAYER_NOTIFICATION_META_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;
            return parsed as PrayerScheduleMeta;
        } catch (error) {
            console.error('[PrayerNotificationStorage] getScheduleMeta error:', error);
            return null;
        }
    },

    async saveScheduleMeta(meta: PrayerScheduleMeta): Promise<void> {
        try {
            await AsyncStorage.setItem(PRAYER_NOTIFICATION_META_KEY, JSON.stringify(meta));
        } catch (error) {
            console.error('[PrayerNotificationStorage] saveScheduleMeta error:', error);
        }
    },

    async clearScheduleMeta(): Promise<void> {
        try {
            await AsyncStorage.removeItem(PRAYER_NOTIFICATION_META_KEY);
        } catch (error) {
            console.error('[PrayerNotificationStorage] clearScheduleMeta error:', error);
        }
    },
};
