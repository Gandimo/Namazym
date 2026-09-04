import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimeService } from './TimeService';
import { DAILY_PRAYER_KEYS, KAZA_PRAYER_KEYS } from '../constants/prayerNames';

const TRACKER_PREFIX = 'namazym_tracker_';
const KAZA_STORAGE_KEY = 'namazym_kaza_counts_v1';
const BEST_STREAK_KEY = 'namazym_streak_best_v1';

/** A streak this long is already unreachable in practice; it only bounds the walk. */
const MAX_STREAK_LOOKBACK_DAYS = 730;
/** Days fetched per multiGet round while walking backwards. */
const STREAK_BATCH_SIZE = 30;

export interface DailyProgress {
    [prayerKey: string]: boolean;
}

export interface KazaState {
    counts: Record<string, number>;
    updatedAt: number | null;
}

export interface StreakSummary {
    /** Consecutive days, ending today or yesterday, with at least one prayer marked. */
    current: number;
    /** Longest streak the user has ever reached. */
    best: number;
    /** How many of the five daily prayers are marked today (0–5). */
    todayCount: number;
    /** True once every daily prayer is marked for today. */
    todayComplete: boolean;
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

    /**
     * Shift a YYYY-MM-DD date by whole days. Uses UTC arithmetic so a daylight
     * saving change can never add or drop a day from a streak.
     */
    static shiftDateString(dateStr: string, days: number): string {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString().slice(0, 10);
    }

    /** Number of the five daily prayers marked in one stored day record. */
    private static countMarked(raw: string | null): number {
        if (!raw) return 0;
        try {
            const progress = JSON.parse(raw) as DailyProgress;
            return DAILY_PRAYER_KEYS.reduce(
                (total, key) => (progress?.[key] ? total + 1 : total),
                0,
            );
        } catch {
            return 0;
        }
    }

    /** Explicitly set a prayer's state — used by the notification action, where a
     *  toggle could flip an already-marked prayer back off. */
    static async setPrayer(
        prayerKey: string,
        done: boolean,
        dateStr: string = TimeService.getTodayDateString(),
    ): Promise<void> {
        try {
            const current = await this.getProgress(dateStr);
            if (Boolean(current[prayerKey]) === done) return;
            await AsyncStorage.setItem(
                this.getKey(dateStr),
                JSON.stringify({ ...current, [prayerKey]: done }),
            );
        } catch (e) {
            console.warn('Error setting prayer:', e);
        }
    }

    /**
     * Walk backwards from today until a day with nothing marked is found.
     *
     * A day counts toward the streak when at least one prayer is marked — the
     * point is to keep someone returning, and an all-or-nothing rule breaks on
     * the first busy day and stops motivating. Today counting as zero does not
     * end the streak either, or every streak would read zero until the first
     * prayer of the day was marked.
     */
    static async getStreakSummary(): Promise<StreakSummary> {
        const today = TimeService.getTodayDateString();
        let current = 0;
        let todayCount = 0;

        try {
            let offset = 0;
            let reachedGap = false;

            while (!reachedGap && offset < MAX_STREAK_LOOKBACK_DAYS) {
                const dates: string[] = [];
                for (let i = 0; i < STREAK_BATCH_SIZE && offset + i < MAX_STREAK_LOOKBACK_DAYS; i++) {
                    dates.push(this.shiftDateString(today, -(offset + i)));
                }

                const entries = await AsyncStorage.multiGet(dates.map(date => this.getKey(date)));

                for (let i = 0; i < entries.length; i++) {
                    const marked = this.countMarked(entries[i][1]);
                    const dayOffset = offset + i;

                    if (dayOffset === 0) todayCount = marked;
                    if (marked > 0) {
                        current += 1;
                        continue;
                    }
                    if (dayOffset === 0) continue; // today is simply not started yet

                    reachedGap = true;
                    break;
                }

                offset += STREAK_BATCH_SIZE;
            }

            const storedBest = Number(await AsyncStorage.getItem(BEST_STREAK_KEY)) || 0;
            const best = Math.max(storedBest, current);
            if (best > storedBest) {
                await AsyncStorage.setItem(BEST_STREAK_KEY, String(best));
            }

            return {
                current,
                best,
                todayCount,
                todayComplete: todayCount >= DAILY_PRAYER_KEYS.length,
            };
        } catch (e) {
            console.warn('Error reading streak:', e);
            return { current: 0, best: 0, todayCount, todayComplete: false };
        }
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
