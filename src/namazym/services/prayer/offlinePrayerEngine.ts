import { PrayerEngine } from './engine';
import { SupportedCity } from './types';
import { PRAYER_DATASET } from '../../data/prayer/prayerDataset';

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

    getDateCount(city: SupportedCity, year?: number): number {
        if (!PrayerEngine.hasPrayerData(city, year)) return 0;
        const targetYear = year ? String(year) : PrayerEngine.getSupportedYears(city)[0];
        if (!targetYear) return 0;
        const cityData = PRAYER_DATASET[city].data;
        if (!cityData) return 0;
        const yearData = cityData[targetYear];
        if (!yearData) return 0;
        return Object.keys(yearData).length;
    },
} as const;
