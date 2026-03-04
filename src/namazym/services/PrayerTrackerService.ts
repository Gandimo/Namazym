import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeService } from './TimeService';

const TRACKER_PREFIX = 'namazym_tracker_';

export interface DailyProgress {
    [prayerKey: string]: boolean;
}

export class PrayerTrackerService {
    /**
     * Get the storage key for a specific date (YYYY-MM-DD)
     */
    private static getKey(dateStr: string) {
        return `${TRACKER_PREFIX}${dateStr}`;
    }

    /**
     * Get completion status for today (or specific date)
     */
    static async getProgress(dateStr: string = TimeService.getTodayDateString()): Promise<DailyProgress> {
        try {
            const key = this.getKey(dateStr);
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error("Error loading tracker:", e);
            return {};
        }
    }

    /**
     * Toggle the status of a specific prayer
     * Returns the new status (true/false)
     */
    static async togglePrayer(prayerKey: string, dateStr: string = TimeService.getTodayDateString()): Promise<boolean> {
        try {
            const key = this.getKey(dateStr);
            const current = await this.getProgress(dateStr);

            const newStatus = !current[prayerKey];
            const updated = { ...current, [prayerKey]: newStatus };

            await AsyncStorage.setItem(key, JSON.stringify(updated));
            return newStatus;
        } catch (e) {
            console.error("Error toggling prayer:", e);
            return false;
        }
    }

    /**
     * Check if a specific prayer is completed
     */
    static async isCompleted(prayerKey: string, dateStr: string = TimeService.getTodayDateString()): Promise<boolean> {
        const progress = await this.getProgress(dateStr);
        return !!progress[prayerKey];
    }
}
