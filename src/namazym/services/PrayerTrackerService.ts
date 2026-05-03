import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeService } from './TimeService';

const TRACKER_PREFIX = 'namazym_tracker_';
const KAZA_KEY = 'namazym_kaza_counts';

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
     * Build a YYYY-MM-DD string for a given number of days ago,
     * using the app's canonical timezone (Ashgabat).
     */
    private static getDateStringDaysAgo(daysAgo: number): string {
        const now = TimeService.now();
        const d = new Date(now);
        d.setDate(d.getDate() - daysAgo);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
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

    /**
     * Returns the current prayer streak in days.
     *
     * Counting rules:
     * - A day counts toward the streak if at least 1 prayer was marked that day.
     * - Today is included if it already has at least 1 prayer marked.
     * - The streak breaks on the first day (going backwards) that has no marked prayers.
     * - maxDays caps how far back we look (default 30).
     */
    static async getStreakCount(maxDays: number = 30): Promise<number> {
        try {
            let streak = 0;

            // Check today first — include it only if already has a prayer
            const todayStr = TimeService.getTodayDateString();
            const todayProgress = await this.getProgress(todayStr);
            const todayHasAny = Object.values(todayProgress).some(Boolean);

            if (todayHasAny) {
                streak = 1;
            }

            // Walk backwards from yesterday
            for (let daysAgo = 1; daysAgo < maxDays; daysAgo++) {
                const dateStr = this.getDateStringDaysAgo(daysAgo);
                const progress = await this.getProgress(dateStr);
                const hasAny = Object.values(progress).some(Boolean);

                if (!hasAny) break;
                streak++;
            }

            return streak;
        } catch (e) {
            console.error("Error computing streak:", e);
            return 0;
        }
    }

    /**
     * Load the persisted kaza (missed prayer) counts.
     */
    static async getKazaCounts(): Promise<Record<string, number>> {
        try {
            const data = await AsyncStorage.getItem(KAZA_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error("Error loading kaza counts:", e);
            return {};
        }
    }

    /**
     * Persist updated kaza counts.
     */
    static async saveKazaCounts(counts: Record<string, number>): Promise<void> {
        try {
            await AsyncStorage.setItem(KAZA_KEY, JSON.stringify(counts));
        } catch (e) {
            console.error("Error saving kaza counts:", e);
        }
    }
}
