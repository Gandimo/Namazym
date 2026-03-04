/**
 * mekruh.ts — Hanafi Asr Kerahat Time Calculator
 *
 * Fixed-offset model (ilmihal-friendly):
 *   kerahat window  : Maghrib − 45 min → Maghrib
 *   severe kerahat  : Maghrib − 15 min → Maghrib
 *
 * Rules:
 *   ✓ NO astronomical calculations — no suncalc, no sun angles
 *   ✓ NO season / latitude dependency
 *   ✓ Deterministic — same input always gives same output
 *   ✓ Instant — no async, no loading
 *   ✓ Returns null if maghribTimeStr is missing or unparseable
 *   ✓ Never throws
 *
 * Output shape:
 *   {
 *     kerahat:       { start: "HH:MM", end: "HH:MM" },
 *     severeKerahat: { start: "HH:MM", end: "HH:MM" }
 *   }
 */

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface KerahatWindow {
    start: string; // "HH:MM"
    end: string;   // "HH:MM"
}

export interface MekruhInfo {
    /** Full kerahat window: Maghrib − 45 min → Maghrib */
    kerahat: KerahatWindow;
    /** Severe kerahat: Maghrib − 15 min → Maghrib */
    severeKerahat: KerahatWindow;

    // Legacy aliases — kept for backward-compat with HomeScreen usage
    kerahatStartTime: string;
    kerahatEndTime: string;
    strongStartTime: string;
}

export interface MekruhParams {
    /** Local date (used as base for HH:MM construction) */
    date: Date;
    /** Maghrib time as "HH:MM" */
    maghribTimeStr: string;
    /** @deprecated — not used in fixed-offset model, kept for API compat */
    asrTimeStr?: string;
    /** @deprecated — not used, kept for API compat */
    timezone?: string;
    /** @deprecated — not used, kept for API compat */
    location?: { lat: number; lon: number };
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/**
 * Parse "HH:MM" onto a Date's calendar day.
 * setHours() operates in local time — consistent with rest of app.
 */
function parseTimeStr(base: Date, timeStr: string): Date | null {
    if (!timeStr || !timeStr.includes(':')) return null;
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
}

/** Format a Date as "HH:MM" using local hours. */
function fmt(d: Date): string {
    return (
        String(d.getHours()).padStart(2, '0') +
        ':' +
        String(d.getMinutes()).padStart(2, '0')
    );
}

/** Subtract `minutes` from a Date, return new Date. */
function minusMins(d: Date, minutes: number): Date {
    return new Date(d.getTime() - minutes * 60 * 1000);
}

// ─────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────

/**
 * Compute Hanafi kerahat window using fixed offsets from Maghrib.
 *
 * Returns null if:
 *   - maghribTimeStr is missing or unparseable
 *   - any unexpected error
 */
export function computeMekruhInfo(params: MekruhParams): MekruhInfo | null {
    try {
        const { date, maghribTimeStr } = params;
        if (!maghribTimeStr) return null;

        const maghrib = parseTimeStr(date, maghribTimeStr);
        if (!maghrib) return null;

        // Fixed offsets — no astronomy
        const kerahatStart   = minusMins(maghrib, 45);
        const severeStart    = minusMins(maghrib, 15);
        const kerahatEnd     = maghrib; // = severeEnd

        const kerahatStartTime = fmt(kerahatStart);
        const kerahatEndTime   = fmt(kerahatEnd);
        const strongStartTime  = fmt(severeStart);

        return {
            kerahat: {
                start: kerahatStartTime,
                end:   kerahatEndTime,
            },
            severeKerahat: {
                start: strongStartTime,
                end:   kerahatEndTime,
            },
            // Legacy aliases
            kerahatStartTime,
            kerahatEndTime,
            strongStartTime,
        };
    } catch {
        return null;
    }
}
