/**
 * Offline Prayer Engine
 *
 * Dataset-first, offline-only, multi-city, multi-year.
 *
 * Key decisions:
 *   - Lookup is city + year + MM-DD
 *   - Empty cities throw controlled errors
 *   - Unsupported years throw controlled errors
 *   - No adhan.js, no internet, no calculations for bundled official cities
 */

import { PRAYER_DATASET } from '../../data/prayer/prayerDataset';
import type { SupportedCity, DailyPrayerTimes } from './types';
import {
    InvalidDateError,
    EmptyCityDatasetError,
    UnsupportedDateError,
    UnsupportedYearError,
} from './types';

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function isLeap(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// ─── Date parsing ─────────────────────────────────────────────────────────────

function toDate(input: Date | string): Date {
    if (input instanceof Date) {
        if (isNaN(input.getTime())) throw new InvalidDateError(input);
        return input;
    }
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
        const [y, mo, d] = input.trim().split('-').map(Number);
        if (mo === 2 && d === 29 && !isLeap(y)) {
            throw new UnsupportedDateError('02-29', `${y} is not a leap year`);
        }
        const date = new Date(y, mo - 1, d);
        if (
            isNaN(date.getTime()) ||
            date.getFullYear() !== y ||
            date.getMonth() !== mo - 1 ||
            date.getDate() !== d
        ) {
            throw new InvalidDateError(input);
        }
        return date;
    }
    throw new InvalidDateError(input);
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export const PrayerEngine = {

    /**
     * Returns prayer times for the given city and date.
     *
     * @throws EmptyCityDatasetError  — city has no official data yet
     * @throws UnsupportedYearError   — city has no dataset for requested year
     * @throws UnsupportedDateError   — MM-DD key is missing inside requested year
     * @throws InvalidDateError       — date argument cannot be parsed
     */
    getPrayerTimes(city: SupportedCity, date: Date | string): DailyPrayerTimes {
        const cityEntry = PRAYER_DATASET[city];
        if (!cityEntry.data || Object.keys(cityEntry.data).length === 0) {
            throw new EmptyCityDatasetError(city);
        }

        const d      = toDate(date);
        const year   = d.getFullYear();
        const yearKey = String(year);
        const mm     = String(d.getMonth() + 1).padStart(2, '0');
        const dd     = String(d.getDate()).padStart(2, '0');

        const yearDataset = cityEntry.data[yearKey];
        if (!yearDataset) {
            throw new UnsupportedYearError(city, year, Object.keys(cityEntry.data));
        }

        const key = `${mm}-${dd}`;
        const times = yearDataset[key];
        if (!times) throw new UnsupportedDateError(key, `Not found in ${city}/${year} dataset`);

        return times;
    },

    /**
     * Returns true if city has any canonical dataset.
     * If year is passed, checks city-year availability.
     */
    hasPrayerData(city: SupportedCity, year?: number): boolean {
        const cityData = PRAYER_DATASET[city].data;
        if (!cityData || Object.keys(cityData).length === 0) return false;
        if (year === undefined) return true;
        return Boolean(cityData[String(year)]);
    },

    /**
     * Returns all cities that currently have imported official data.
     */
    getSupportedCities(): SupportedCity[] {
        return (Object.keys(PRAYER_DATASET) as SupportedCity[]).filter(
            (city) => this.hasPrayerData(city),
        );
    },

    /**
     * Returns all cities registered in the system, including empty ones.
     */
    getAllCities(): SupportedCity[] {
        return Object.keys(PRAYER_DATASET) as SupportedCity[];
    },

    /**
     * Returns the data status for a city.
     */
    getCityStatus(city: SupportedCity): 'available' | 'empty' {
        return PRAYER_DATASET[city].status;
    },

    /**
     * Returns sorted list of canonical years for this city.
     */
    getSupportedYears(city: SupportedCity): string[] {
        const data = PRAYER_DATASET[city].data;
        if (!data) return [];
        return Object.keys(data).sort();
    },

} as const;
