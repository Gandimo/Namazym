/**
 * Fasting times (agyz bekleme / agyz açar) for Turkmenistan.
 *
 * These are NOT new data and the prayer timetable is never modified. Both values
 * are derived from the same official table the app already ships, following the
 * relationship printed in Turkmenistan's own Ramadan imsakiýe:
 *
 *   agyz açar (iftar)     = maghrib, exactly
 *   agyz bekleme (imsak)  = fajr − 40 minutes
 *
 * Verified against `data/ramadan_2026_tm.json`, which lists imsak and ertir
 * (fajr) as separate columns: the gap is exactly 40 minutes in all 17 records
 * that carry both, across all five regions. The same file's iftar and yassy
 * values match the prayer dataset's maghrib and isha to the minute
 * (e.g. 2026-02-18 Ahal → iftar 19:00 = maghrib 19:00, yassy 20:20 = isha 20:20).
 *
 * Deriving rather than duplicating matters because Turkmenistan reuses one fixed
 * timetable every year: there is no second source to drift away from.
 */

/** Official gap between imsak and fajr in the Turkmen timetable, in minutes. */
export const IMSAK_BEFORE_FAJR_MINUTES = 40;

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

/** Parse "HH:MM" into minutes past midnight, or null when malformed. */
export function parseTimeToMinutes(time: string | null | undefined): number | null {
    if (typeof time !== 'string') return null;
    const match = TIME_PATTERN.exec(time.trim());
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
}

/** Format minutes past midnight back into "HH:MM", wrapping across midnight. */
export function formatMinutes(totalMinutes: number): string {
    const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
    const hours = Math.floor(wrapped / 60);
    const minutes = wrapped % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export interface FastingTimes {
    /** Agyz bekleme — the moment fasting begins. */
    imsak: string | null;
    /** Agyz açar — the moment fasting ends. */
    iftar: string | null;
}

/**
 * Derive both fasting times from one day's prayer times.
 * Returns nulls rather than guesses when the source values are missing.
 */
export function getFastingTimes(
    timings: { Fajr?: string; Maghrib?: string } | null | undefined,
): FastingTimes {
    const fajrMinutes = parseTimeToMinutes(timings?.Fajr);
    const maghrib = parseTimeToMinutes(timings?.Maghrib) === null ? null : timings?.Maghrib ?? null;

    return {
        imsak: fajrMinutes === null
            ? null
            : formatMinutes(fajrMinutes - IMSAK_BEFORE_FAJR_MINUTES),
        iftar: maghrib,
    };
}
