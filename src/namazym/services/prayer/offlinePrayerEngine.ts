import { PrayerEngine } from './engine';
import { DailyPrayerTimes, SupportedCity } from './types';

// Deprecated wrapper; moving towards PrayerEngine
export const OfflinePrayerEngine = {
    getPrayerTimes(city: SupportedCity, date: Date | string) {
        try {
            const data = PrayerEngine.getPrayerTimes(city, date);
            return { ok: true, data };
        } catch (e: any) {
            return { ok: false, reason: e.name || 'UNKNOWN_ERROR' };
        }
    },

    hasPrayerData(city: SupportedCity): boolean {
        return PrayerEngine.hasPrayerData(city);
    },

    getSupportedCities(): SupportedCity[] {
        return PrayerEngine.getSupportedCities();
    },

    getDateCount(city: SupportedCity): number {
        return PrayerEngine.hasPrayerData(city) ? 366 : 0;
    },
} as const;
