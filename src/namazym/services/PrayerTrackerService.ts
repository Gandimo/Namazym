import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeService } from './TimeService';
import { KAZA_PRAYER_KEYS } from '../constants/prayerNames';

const TRACKER_PREFIX = 'namazym_tracker_';
const KAZA_STORAGE_KEY = 'namazym_kaza_counts_v1';

export interface DailyProgress {
    [prayerKey: string]: boolean;
}

export interface KazaState {
    counts: Record<string, number>;
    updatedAt: number | null;
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

    private static normalizeKazaCounts(rawCounts: Record<string, unknown> | null | undefined): Record<string, number> {
        const normalized: Record<string, number> = {};

        for (const key of KAZA_PRAYER_KEYS) {
            const rawValue = rawCounts?.[key];
            const value = typeof rawValue === 'number' ? rawValue : Number(rawValue || 0);
            normalized[key] = Number.isFinite(value) ? Math.max(0, value) : 0;
        }

        return normalized;
    }

    static async getKazaState(): Promise<KazaState> {
        try {
            const raw = await AsyncStorage.getItem(KAZA_STORAGE_KEY);
            if (!raw) {
                return {
                    counts: this.normalizeKazaCounts({}),
                    updatedAt: null,
                };
            }

            const parsed = JSON.parse(raw);

            if (parsed && typeof parsed === 'object' && 'counts' in parsed) {
                return {
                    counts: this.normalizeKazaCounts((parsed as KazaState).counts),
                    updatedAt: typeof (parsed as KazaState).updatedAt === 'number' ? (parsed as KazaState).updatedAt : null,
                };
            }

            return {
                counts: this.normalizeKazaCounts(parsed),
                updatedAt: null,
            };
        } catch (e) {
            console.error("Error loading kaza tracker:", e);
            return {
                counts: this.normalizeKazaCounts({}),
                updatedAt: null,
            };
        }
    }

    static async getKazaCounts(): Promise<Record<string, number>> {
        const state = await this.getKazaState();
        return state.counts;
    }

    static async saveKazaCounts(counts: Record<string, number>): Promise<void> {
        try {
            const normalized = this.normalizeKazaCounts(counts);
            const nextState: KazaState = {
                counts: normalized,
                updatedAt: Date.now(),
            };
            await AsyncStorage.setItem(KAZA_STORAGE_KEY, JSON.stringify(nextState));
        } catch (e) {
            console.error("Error saving kaza tracker:", e);
        }
    }
}
