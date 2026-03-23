/**
 * Offline Prayer Engine — Unified Type Contract
 *
 * Shared across parser, validator, generator, engine, and all city datasets.
 * Any addition to SupportedCity here is the only code change needed to
 * register a new city — no engine logic changes required.
 */

// ─── Prayer domain ────────────────────────────────────────────────────────────

export type PrayerName =
    | 'fajr'
    | 'sunrise'
    | 'dhuhr'
    | 'asr'
    | 'maghrib'
    | 'isha';

/**
 * One day's complete prayer times.
 * All values are normalized "HH:MM" 24-hour strings (local city time, UTC+5).
 * Invariant (enforced by validator): fajr < sunrise < dhuhr < asr < maghrib < isha
 */
export type DailyPrayerTimes = Record<PrayerName, string>;

/** Alias — a single day entry for use in dataset type signatures. */
export type PrayerDatasetDay = DailyPrayerTimes;

/**
 * A full year's prayer times.
 * Key format: "MM-DD".
 */
export type PrayerDatasetYear = Record<string, DailyPrayerTimes>;

/**
 * Canonical city data keyed by year.
 * Example:
 * {
 *   "2026": { "01-01": { ... } },
 *   "2027": { "01-01": { ... } }
 * }
 */
export type CityYearDataset = Record<string, PrayerDatasetYear>;

/**
 * One city's entry in the central registry.
 * `data` is null when the official dataset has not yet been imported.
 */
export interface PrayerDatasetCity {
    readonly city:   SupportedCity;
    /** null = no official data imported yet for this city */
    readonly data:   CityYearDataset | null;
    /** Human-readable status for debugging and self-checks. */
    readonly status: 'available' | 'empty';
}

/**
 * The full multi-city registry shape.
 * Runtime engine imports this to resolve prayer times.
 */
export type PrayerDataset = Readonly<Record<SupportedCity, PrayerDatasetCity>>;

// ─── Dataset key formats ──────────────────────────────────────────────────────

/**
 * One year's MM-DD keyed dataset.
 */
export type Dataset = Record<string, DailyPrayerTimes>;

// ─── Supported cities ─────────────────────────────────────────────────────────

/**
 * All city identifiers recognized by the engine.
 *
 * EXTENDING: add a new city key here, create its data file, and register it
 * in prayerDataset.ts. The engine requires zero further code changes.
 */
export type SupportedCity =
    | 'ashgabat'
    | 'ahal'
    | 'arkadag'
    | 'balkan'
    | 'dashoguz'
    | 'lebap'
    | 'mary';

// ─── Parser types ─────────────────────────────────────────────────────────────

/** One row from the raw official source before normalization. */
export interface RawPrayerRow {
    readonly monthTk:       string;
    readonly day:           number;
    readonly agyzBeklenyan: string;  // always discarded
    readonly fajr:          string;
    readonly sunrise:       string;
    readonly dhuhr:         string;
    readonly asr:           string;
    readonly maghrib:       string;
    readonly isha:          string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationSummary {
    readonly isValid:     boolean;
    readonly sourceRows:  number;
    readonly expectedRows: number;
    readonly totalDays:   number;
    readonly duplicates:  number;
    readonly missing:     number;
    readonly extra:       number;
    readonly orderingErrors: number;
    readonly errors:      readonly string[];
    readonly warnings:    readonly string[];
}

// ─── Import pipeline ──────────────────────────────────────────────────────────

/**
 * Result returned by `generator.importOfficialData()`.
 * On success: `dataset` contains the 366-day normalized Dataset.
 * On failure: `dataset` is null; check `validation.errors`.
 */
export interface ImportResult {
    readonly city:       SupportedCity;
    readonly year:       number;
    readonly dataset:    Dataset | null;
    readonly validation: ValidationSummary;
    readonly success:    boolean;
}

export interface ImportSourceMeta {
    readonly sourcePath: string;
    readonly sourceType: 'txt' | 'csv' | 'xlsx' | 'rtf';
    readonly sheetsUsed: readonly string[];
    readonly rowsRead: number;
    readonly duplicateKeys: readonly string[];
}

export interface DriftWarning {
    readonly key: string;
    readonly prayer: PrayerName;
    readonly previous: string;
    readonly current: string;
    readonly deltaMinutes: number;
}

export interface YearChangeReport {
    readonly city: SupportedCity;
    readonly year: number;
    readonly sourcePath: string;
    readonly sourceType: 'txt' | 'csv' | 'xlsx' | 'rtf';
    readonly rowsRead: number;
    readonly rowsGenerated: number;
    readonly duplicates: number;
    readonly missing: number;
    readonly extra: number;
    readonly orderingErrors: number;
    readonly parseErrors: readonly string[];
    readonly validationErrors: readonly string[];
    readonly driftWarnings: readonly DriftWarning[];
    readonly selfCheckPassed: boolean;
    readonly pass: boolean;
}

export interface CityManifestEntry {
    readonly canonicalYears: readonly number[];
    readonly sourceType: 'none' | 'txt' | 'csv' | 'xlsx' | 'rtf' | 'mixed';
    readonly lastImportedAt: string | null;
    readonly status: 'empty' | 'ready' | 'failed';
}

export type CityManifest = Readonly<Record<SupportedCity, CityManifestEntry>>;

// ─── Engine errors ────────────────────────────────────────────────────────────

/** Input date could not be parsed. */
export class InvalidDateError extends Error {
    constructor(input: unknown) {
        super(`InvalidDateError: cannot parse date from "${String(input)}"`);
        this.name = 'InvalidDateError';
    }
}

/** The city exists in SupportedCity but has no data imported yet. */
export class EmptyCityDatasetError extends Error {
    constructor(city: SupportedCity) {
        super(`EmptyCityDatasetError: "${city}" has no official data imported yet`);
        this.name = 'EmptyCityDatasetError';
    }
}

/** A valid MM-DD key is not in the dataset, or Feb 29 on a non-leap year. */
export class UnsupportedDateError extends Error {
    constructor(mmdd: string, reason?: string) {
        super(
            `UnsupportedDateError: "${mmdd}" is not available` +
            (reason ? ` — ${reason}` : ''),
        );
        this.name = 'UnsupportedDateError';
    }
}

/** The city has data, but not for the requested year. */
export class UnsupportedYearError extends Error {
    constructor(city: SupportedCity, year: number, supportedYears: readonly string[]) {
        super(
            `UnsupportedYearError: "${city}" has no canonical data for ${year}` +
            (supportedYears.length > 0
                ? ` — supported years: ${supportedYears.join(', ')}`
                : ''),
        );
        this.name = 'UnsupportedYearError';
    }
}
