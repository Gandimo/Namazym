/**
 * Offline Prayer Engine
 *
 * Dataset-first, offline-only, multi-city, year-agnostic.
 *
 * Key decisions:
 *   - MM-DD keyed Dataset → one 366-day base per city, works for every year
 *   - Feb 29 handled at lookup time (non-leap years → UnsupportedDateError)
 *   - Empty cities → EmptyCityDatasetError (no silent fallback, no calculations)
 *   - No adhan.js, no internet, no astronomical math for bundled cities
 */

import { PRAYER_DATASET } from '../../data/prayer/prayerDataset';
import type { SupportedCity, DailyPrayerTimes } from './types';
import {
    InvalidDateError,
    EmptyCityDatasetError,
    UnsupportedDateError,
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
        // Parse as local date (year/month/day components, not UTC)
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
     * @throws UnsupportedDateError   — Feb 29 on non-leap year, or key not in dataset
     * @throws InvalidDateError       — date argument cannot be parsed
     */
    getPrayerTimes(city: SupportedCity, date: Date | string): DailyPrayerTimes {
        const cityEntry = PRAYER_DATASET[city];
        if (!cityEntry.data) throw new EmptyCityDatasetError(city);

        const d    = toDate(date);
        const year = d.getFullYear();
        const mm   = String(d.getMonth() + 1).padStart(2, '0');
        const dd   = String(d.getDate()).padStart(2, '0');

        // Guard: Feb 29 requested on a non-leap year → calendar error, not a data gap
        if (!isLeap(year) && mm === '02' && dd === '29') {
            throw new UnsupportedDateError(
                '02-29',
                `${year} is not a leap year`,
            );
        }

        const key   = `${mm}-${dd}`;
        const times = cityEntry.data[key];
        if (!times) throw new UnsupportedDateError(key, `Not found in ${city} dataset`);

        return times;
    },

    /**
     * Returns true if the city has an imported, non-null dataset.
     * Note: in the MM-DD model, "has data" = "all years supported".
     */
    hasPrayerData(city: SupportedCity): boolean {
        return PRAYER_DATASET[city].data !== null;
    },

    /**
     * Returns all cities that currently have imported official data.
     */
    getSupportedCities(): SupportedCity[] {
        return (Object.keys(PRAYER_DATASET) as SupportedCity[]).filter(
            city => PRAYER_DATASET[city].data !== null,
        );
    },

    /**
     * Returns all cities registered in the system, including empty ones.
     * Useful for UI "coming soon" features.
     */
    getAllCities(): SupportedCity[] {
        return Object.keys(PRAYER_DATASET) as SupportedCity[];
    },

    /**
     * Returns the data status for a city.
     * 'available' = has imported data | 'empty' = awaiting official import
     */
    getCityStatus(city: SupportedCity): 'available' | 'empty' {
        return PRAYER_DATASET[city].status;
    },

    /**
     * In the MM-DD year-agnostic model, every supported year is valid
     * for cities that have data. Returns 'all-years' for populated cities.
     */
    getSupportedYears(city: SupportedCity): 'all-years' | 'no-data' {
        return PRAYER_DATASET[city].data ? 'all-years' : 'no-data';
    },

} as const;
