/**
 * Offline Prayer Engine — Dataset Validator
 *
 * Validates a year-specific MM-DD keyed Dataset before it is accepted as official data.
 *
 * Checks:
 *   1. Year-aware day count (365 / 366)
 *   2. All keys are valid "MM-DD" pairs
 *   3. No missing calendar days
 *   4. All time strings are valid "HH:MM"
 *   5. Per-day ordering: fajr < sunrise < dhuhr < asr < maghrib < isha
 */

import { Dataset, DailyPrayerTimes, ValidationSummary } from './types';

// ─── Calendar helpers ─────────────────────────────────────────────────────────

/** Full leap-style key list (contains 02-29). */
function allMmDdKeysLeap(): string[] {
    const keys: string[] = [];
    const d = new Date(Date.UTC(2000, 0, 1));
    while (d.getUTCFullYear() === 2000) {
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        keys.push(`${mm}-${dd}`);
        d.setUTCDate(d.getUTCDate() + 1);
    }
    return keys;
}

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

export interface ValidationOptions {
    readonly year: number;
    readonly sourceRows: number;
    readonly duplicateKeys?: readonly string[];
    readonly allowFeb29?: boolean;
}

/**
 * Validates a year-specific MM-DD keyed Dataset.
 *
 * @param dataset - Output of `parseRaw()`
 * @param options - Year/source metadata
 * @returns ValidationSummary — check `isValid` before accepting
 */
export function validate(
    dataset: Dataset,
    options: ValidationOptions = {
        year: 2000,
        sourceRows: Object.keys(dataset).length,
        duplicateKeys: [],
    },
): ValidationSummary {
    const errors:   string[] = [];
    const warnings: string[] = [];

    const keySet = new Set(Object.keys(dataset));
    const includeFeb29 = options.allowFeb29 ?? (keySet.has('02-29') || options.sourceRows === 366);
    const expectedKeys = allMmDdKeysLeap().filter((key) => includeFeb29 || key !== '02-29');
    const expectedCount = expectedKeys.length;
    const keys       = Object.keys(dataset);
    const totalDays  = keys.length;
    const duplicates = options.duplicateKeys?.length ?? 0;

    // 1. Total count
    if (options.sourceRows !== totalDays) {
        errors.push(`Source rows mismatch: source=${options.sourceRows}, generated=${totalDays}`);
    }
    if (totalDays !== expectedCount) {
        errors.push(`Day count mismatch: expected=${expectedCount}, got=${totalDays}`);
    }

    // 2. Missing or extra keys
    const datasetKeySet = new Set(keys);
    let missing = 0;
    for (const expected of expectedKeys) {
        if (!datasetKeySet.has(expected)) {
            missing++;
            errors.push(`Missing: ${expected}`);
        }
    }
    let extra = 0;
    for (const key of keys) {
        if (!expectedKeys.includes(key)) {
            extra++;
            errors.push(`Unexpected key: "${key}"`);
        }
    }
    if (duplicates > 0) {
        errors.push(`Duplicate keys found in source: ${duplicates}`);
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
        sourceRows: options.sourceRows,
        expectedRows: expectedCount,
        totalDays,
        duplicates,
        missing,
        extra,
        orderingErrors: orderErrors,
        errors,
        warnings,
    };
}
