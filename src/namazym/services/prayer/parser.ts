/**
 * Offline Prayer Engine — Official Schedule Parser
 *
 * Converts raw semicolon-separated official text into a 366-day `Dataset`
 * keyed by "MM-DD". Called once at module load from dataset.ts (not per-request).
 *
 * Source format (9 columns, semicolon-separated):
 *   Aý;Gün;Agyz beklenýän wagty;Ertir namazy;Günüň dogýan wagty;
 *   Öýle namazy;Ikindi namazy;Agşam namazy;Ýassy namazy
 *
 * Example row:
 *   Ýanwar;1;6:37;7:17;8:27;13:30;16:04;17:44;19:04
 */

import { Dataset, DailyPrayerTimes } from './types';

// ─── Turkmen month → zero-padded month number ─────────────────────────────────
const MONTHS: Readonly<Record<string, string>> = {
    'Ýanwar':   '01',
    'Fewral':   '02',
    'Mart':     '03',
    'Aprel':    '04',
    'Maý':      '05',
    'Iýun':     '06',
    'Iýul':     '07',
    'Awgust':   '08',
    'Sentýabr': '09',
    'Oktýabr':  '10',
    'Noýabr':   '11',
    'Dekabr':   '12',
};

const DAYS_IN_MONTH: Readonly<Record<string, number>> = {
    '01': 31, '02': 29, '03': 31, '04': 30,
    '05': 31, '06': 30, '07': 31, '08': 31,
    '09': 30, '10': 31, '11': 30, '12': 31,
};

const EXPECTED_COLUMNS = 9;

// ─── Time normalization ───────────────────────────────────────────────────────
function normalizeTime(raw: string): string {
    const trimmed = raw.trim();
    const match   = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) throw new Error(`Invalid time format: "${trimmed}"`);

    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 23 || m > 59) throw new Error(`Time out of range: "${trimmed}"`);

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── Key builder ──────────────────────────────────────────────────────────────
function toKey(monthTk: string, day: number): string {
    const mm = MONTHS[monthTk.trim()];
    if (!mm) throw new Error(`Unknown Turkmen month: "${monthTk}"`);

    const maxDay = DAYS_IN_MONTH[mm];
    if (!Number.isInteger(day) || day < 1 || day > maxDay) {
        throw new Error(`Invalid day for ${monthTk}: ${day} (max ${maxDay})`);
    }
    return `${mm}-${String(day).padStart(2, '0')}`;
}

// ─── Header detection ─────────────────────────────────────────────────────────
function isHeader(line: string): boolean {
    return line.startsWith('Aý;') || line.startsWith('Ay;') || line.startsWith('month');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parses raw official timetable text into a `Dataset` keyed by "MM-DD".
 * Should be called at module load time (embedded in dataset.ts), not per-request.
 *
 * @throws Error on malformed rows, invalid times, or duplicate MM-DD keys.
 */
export function parseRaw(raw: string): Dataset {
    const result: Record<string, DailyPrayerTimes> = {};
    const seen   = new Set<string>();

    const lines = raw
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0);

    for (const line of lines) {
        if (isHeader(line)) continue;

        const cols = line.split(';');
        if (cols.length !== EXPECTED_COLUMNS) {
            throw new Error(
                `Expected ${EXPECTED_COLUMNS} columns, got ${cols.length}: "${line}"`,
            );
        }

        const monthTk  = cols[0];
        const day      = Number(cols[1]);
        // cols[2] = Agyz beklenýän wagty — intentionally discarded
        const fajrRaw    = cols[3];
        const sunriseRaw = cols[4];
        const dhuhrRaw   = cols[5];
        const asrRaw     = cols[6];
        const maghribRaw = cols[7];
        const ishaRaw    = cols[8];

        if (!Number.isInteger(day)) {
            throw new Error(`Invalid day value: "${cols[1]}"`);
        }

        const key = toKey(monthTk, day);
        if (seen.has(key)) {
            throw new Error(`Duplicate MM-DD key: "${key}"`);
        }
        seen.add(key);

        result[key] = {
            fajr:    normalizeTime(fajrRaw),
            sunrise: normalizeTime(sunriseRaw),
            dhuhr:   normalizeTime(dhuhrRaw),
            asr:     normalizeTime(asrRaw),
            maghrib: normalizeTime(maghribRaw),
            isha:    normalizeTime(ishaRaw),
        };
    }

    return result;
}
