/**
 * Offline Prayer Engine — Dataset Validator
 *
 * Validates a 366-day MM-DD keyed Dataset before it is accepted as official data.
 *
 * Checks:
 *   1. Exactly 366 entries (Jan 1 → Dec 31, including Feb 29)
 *   2. All keys are valid "MM-DD" pairs
 *   3. No missing calendar days
 *   4. All time strings are valid "HH:MM"
 *   5. Per-day ordering: fajr < sunrise < dhuhr < asr < maghrib < isha
 */

import { Dataset, DailyPrayerTimes, ValidationSummary } from './types';

// ─── Calendar helpers ─────────────────────────────────────────────────────────

/** All 366 "MM-DD" keys that must be present in a complete base dataset. */
function allMmDdKeys(): string[] {
    const keys: string[] = [];
    // Use a fixed known leap year to generate all 366 day combinations
    const d = new Date(Date.UTC(2000, 0, 1)); // 2000 is a leap year
    while (d.getUTCFullYear() === 2000) {
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        keys.push(`${mm}-${dd}`);
        d.setUTCDate(d.getUTCDate() + 1);
    }
    return keys;
}

const EXPECTED_KEYS = allMmDdKeys(); // computed once at module load
const EXPECTED_COUNT = 366;

// ─── Time helpers ─────────────────────────────────────────────────────────────

const TIME_RE = /^\d{2}:\d{2}$/;

function isValidTime(t: string): boolean {
    if (!TIME_RE.test(t)) return false;
    const [h, m] = t.split(':').map(Number);
    return h <= 23 && m <= 59;
}

function toMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

// ─── Per-day order check ──────────────────────────────────────────────────────

const PRAYER_ORDER: Array<keyof DailyPrayerTimes> = [
    'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha',
];

function validateDay(key: string, day: DailyPrayerTimes): string[] {
    const errs: string[] = [];

    for (const prayer of PRAYER_ORDER) {
        if (!isValidTime(day[prayer])) {
            errs.push(`${key}: invalid time for ${prayer}: "${day[prayer]}"`);
        }
    }
    if (errs.length > 0) return errs; // skip ordering if times malformed

    for (let i = 1; i < PRAYER_ORDER.length; i++) {
        const prev = PRAYER_ORDER[i - 1];
        const curr = PRAYER_ORDER[i];
        if (toMinutes(day[prev]) >= toMinutes(day[curr])) {
            errs.push(
                `${key}: ${prev} (${day[prev]}) must be strictly before ${curr} (${day[curr]})`,
            );
        }
    }
    return errs;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validates a 366-day MM-DD keyed Dataset.
 *
 * @param dataset - Output of `parseRaw()`
 * @returns ValidationSummary — check `isValid` before accepting
 */
export function validate(dataset: Dataset): ValidationSummary {
    const errors:   string[] = [];
    const warnings: string[] = [];

    const keys       = Object.keys(dataset);
    const totalDays  = keys.length;

    // 1. Total count
    if (totalDays !== EXPECTED_COUNT) {
        errors.push(`Day count: expected ${EXPECTED_COUNT}, got ${totalDays}`);
    }

    // 2. Missing or extra keys
    const datasetKeySet = new Set(keys);
    for (const expected of EXPECTED_KEYS) {
        if (!datasetKeySet.has(expected)) {
            errors.push(`Missing: ${expected}`);
        }
    }
    for (const key of keys) {
        if (!EXPECTED_KEYS.includes(key)) {
            errors.push(`Unexpected key: "${key}"`);
        }
    }

    // 3. Per-day time validation
    let orderErrors = 0;
    for (const [key, day] of Object.entries(dataset)) {
        const dayErrors = validateDay(key, day);
        if (dayErrors.length > 0) {
            orderErrors += dayErrors.length;
            if (orderErrors <= 6) errors.push(...dayErrors);
        }
    }
    if (orderErrors > 6) {
        errors.push(`... and ${orderErrors - 6} more time ordering errors`);
    }

    return {
        isValid:   errors.length === 0,
        totalDays,
        errors,
        warnings,
    };
}
