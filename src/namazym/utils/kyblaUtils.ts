/**
 * Qibla Engine V2 — Core Utilities
 * All calculations are fully offline.
 */

// ─── Kaaba coordinates ────────────────────────────────────────────────────────
export const KAABA_LAT = 21.422487;
export const KAABA_LON = 39.826206;

// ─── Threshold config ─────────────────────────────────────────────────────────
// Kept for backwards compatibility with older callers. The V3 compass adapts
// its reference axis when the phone is upright, so tilt is no longer an error.
export const THR_HOLD_FLAT_DEG = 35;
export const THR_STABILITY_LOW = 0.30; // below → unstable state
export const THR_STABILITY_MED = 0.55; // below → no celebration feedback
export const THR_STABILITY_HIGH = 0.75; // above → full feedback allowed
export const THR_NEAR_DEG = 10;   // diff ≤ this → near state
export const THR_ALIGNED_DEG = 5;    // diff ≤ this → aligned state
export const THR_PERFECT_DEG = 3;    // diff ≤ this → perfect state
export const THR_KAABA_ICON_DEG = 3;    // same as perfect

// ─── Magnetic field quality ───────────────────────────────────────────────────
// Interference is the one compass failure that hides itself: a magnet, a steel
// desk, a magnetic phone case or a car body produces a heading that is perfectly
// STABLE and completely WRONG. Heading variance cannot see it — the numbers look
// healthy — so the magnetic vector itself has to be inspected.

/**
 * Earth's surface field measures ~22–67 µT everywhere on the planet. A reading
 * outside this padded band is not the Earth's field, so something nearby is
 * dominating the sensor. This is a property of the planet, not a lookup — no
 * network, no location service, nothing to keep up to date.
 */
export const FIELD_MIN_UT = 25;
export const FIELD_MAX_UT = 70;

/**
 * A clean field holds a constant magnitude while the phone turns through it.
 * A distorted field does not, so the spread of |B| across a short window
 * separates real interference from a merely shaky hand. Being self-referencing,
 * it needs no per-city reference value and tolerates sensor bias.
 */
export const FIELD_SPREAD_DISTURBED_UT = 8;
export const FIELD_SPREAD_UNRELIABLE_UT = 15;

export type FieldQuality = 'unknown' | 'good' | 'disturbed' | 'unreliable';

export interface FieldReading {
    /** Latest |B| in microtesla. */
    magnitude: number;
    /** max−min of |B| across the tracked window, in microtesla. */
    spread: number;
    quality: FieldQuality;
}

export class MagneticFieldTracker {
    private samples: number[] = [];
    readonly maxSamples: number;

    /** At 25 Hz, 60 samples ≈ 2.4 s — long enough to cover a deliberate turn. */
    constructor(maxSamples = 60) { this.maxSamples = maxSamples; }

    add(magnitude: number): FieldReading {
        if (!Number.isFinite(magnitude)) {
            return { magnitude: 0, spread: 0, quality: 'unknown' };
        }

        this.samples.push(magnitude);
        if (this.samples.length > this.maxSamples) this.samples.shift();

        // An out-of-band reading is conclusive by itself; report it without
        // waiting for the window to fill.
        if (magnitude < FIELD_MIN_UT || magnitude > FIELD_MAX_UT) {
            return { magnitude, spread: 0, quality: 'unreliable' };
        }

        if (this.samples.length < 8) return { magnitude, spread: 0, quality: 'unknown' };

        let min = Infinity;
        let max = -Infinity;
        for (const sample of this.samples) {
            if (sample < min) min = sample;
            if (sample > max) max = sample;
        }
        const spread = max - min;

        const quality: FieldQuality =
            spread >= FIELD_SPREAD_UNRELIABLE_UT ? 'unreliable'
                : spread >= FIELD_SPREAD_DISTURBED_UT ? 'disturbed'
                    : 'good';

        return { magnitude, spread, quality };
    }

    get count() { return this.samples.length; }
    reset() { this.samples = []; }
}

/** Magnitude of the raw magnetometer vector, in microtesla. */
export function fieldMagnitude(x: number, y: number, z: number): number {
    return Math.sqrt(x * x + y * y + z * z);
}

// ─── State machine types ──────────────────────────────────────────────────────
export type CompassState =
    | 'calibrating'
    | 'hold_flat'
    | 'interference'
    | 'unstable'
    | 'far'
    | 'near'
    | 'aligned'
    | 'perfect';

export interface CompassStateInfo {
    state: CompassState;
    label: string;          // i18n key
    color: string;          // hex color for badge
    glow: number;           // 0–1 target opacity
    pulse: boolean;
    showKaabaIcon: boolean;
    isStable: boolean;
}

// Map state → i18n key (the screen uses t(info.label))
const STATE_LABEL_KEY: Record<CompassState, string> = {
    calibrating: 'qibla.status_calibrating',
    hold_flat: 'qibla.status_hold_flat',
    interference: 'qibla.status_interference',
    unstable: 'qibla.status_unstable',
    far: 'qibla.status_far',
    near: 'qibla.status_near',
    aligned: 'qibla.status_aligned',
    perfect: 'qibla.status_perfect',
};

const GLOW_BY_STATE: Record<CompassState, number> = {
    calibrating: 0,
    hold_flat: 0,
    interference: 0,
    unstable: 0,
    far: 0.10,
    near: 0.35,
    aligned: 0.65,
    perfect: 1.00,
};

const COLOR_BY_STATE: Record<CompassState, string> = {
    calibrating: '#FFB300',    // Amber
    hold_flat: '#F44336',      // Red
    interference: '#E05A3C',   // Alert red-orange — the field cannot be trusted
    unstable: '#FF9800',       // Orange
    far: '#9E9E9E',         // Gray
    near: '#D4AF37',        // Gold
    aligned: '#4CAF50',     // Green
    perfect: '#43A047',     // Dark Green
};

export function getStateInfo(state: CompassState, diff: number): CompassStateInfo {
    return {
        state,
        label: STATE_LABEL_KEY[state],
        color: COLOR_BY_STATE[state],
        glow: GLOW_BY_STATE[state],
        pulse: state === 'aligned' || state === 'perfect',
        showKaabaIcon: state === 'perfect' && Math.abs(diff) <= THR_KAABA_ICON_DEG,
        isStable: state === 'far' || state === 'near' || state === 'aligned' || state === 'perfect',
    };
}

/**
 * Resolve compass state from inputs — pure function, no side effects.
 * Includes hysteresis to prevent flickering between states.
 */
export function resolveCompassState(
    currentState: CompassState,
    diff: number,
    stability: number,
    _tiltDeg: number,
    sampleCount: number,
    fieldQuality: FieldQuality = 'unknown',
): CompassState {
    if (sampleCount < 6) return 'calibrating';

    // A contaminated field is the one failure worth interrupting for: it yields a
    // heading that is steady, confident and wrong, so every other signal here
    // still looks healthy. Say nothing about direction until the field recovers —
    // pointing a person the wrong way for prayer is worse than pointing nowhere.
    if (fieldQuality === 'unreliable') return 'interference';

    // Hysteresis for unstable: Enter < LOW, Exit > LOW + 0.05
    if (currentState === 'unstable' && stability < (THR_STABILITY_LOW + 0.05)) return 'unstable';
    if (stability < THR_STABILITY_LOW) return 'unstable';

    // A merely disturbed field still gives a usable rough direction, but not one
    // worth celebrating. Cap guidance at 'near' so the compass keeps asking the
    // user to turn instead of declaring the Qibla found on suspect data.
    if (fieldQuality === 'disturbed') {
        return diff <= THR_NEAR_DEG ? 'near' : 'far';
    }

    // Hysteresis for distance states (enter at threshold, exit at threshold + margin)
    const margin = 2.5;

    if (currentState === 'perfect' && diff <= THR_PERFECT_DEG + margin) return 'perfect';
    if (diff <= THR_PERFECT_DEG) return 'perfect';

    if (currentState === 'aligned' && diff <= THR_ALIGNED_DEG + margin) return 'aligned';
    if (diff <= THR_ALIGNED_DEG) return 'aligned';

    if (currentState === 'near' && diff <= THR_NEAR_DEG + margin) return 'near';
    if (diff <= THR_NEAR_DEG) return 'near';

    return 'far';
}

// ─── Great-circle bearing ─────────────────────────────────────────────────────
export function bearingToKaaba(userLat: number, userLon: number): number {
    const φ1 = toRad(userLat), φ2 = toRad(KAABA_LAT);
    const Δλ = toRad(KAABA_LON - userLon);
    const θ = Math.atan2(
        Math.sin(Δλ) * Math.cos(φ2),
        Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ),
    );
    return (θ * 180 / Math.PI + 360) % 360;
}

// ─── Haversine distance ───────────────────────────────────────────────────────
export function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Tilt-compensated heading ─────────────────────────────────────────────────
/**
 * Returns heading in degrees (0–360), or NaN if sensor data is degenerate.
 * Also returns tiltDeg for diagnostics and UI quality feedback.
 */
export function tiltCompensatedHeading(
    mx: number, my: number, mz: number,
    ax: number, ay: number, az: number,
): { heading: number; tiltDeg: number } {
    const aNorm = Math.sqrt(ax * ax + ay * ay + az * az);
    if (aNorm < 0.5) return { heading: NaN, tiltDeg: 0 };

    const nx = ax / aNorm, ny = ay / aNorm, nz = az / aNorm;
    // Tilt angle from horizontal (0° = flat, 90° = upright)
    const tiltDeg = Math.acos(Math.abs(nz)) * 180 / Math.PI;

    // Build a horizontal basis directly from gravity + magnetic vectors.
    // This is more robust than pitch/roll Euler formulas and avoids axis/sign
    // errors that appear when the device is tilted away from flat.
    const eastX = my * nz - mz * ny;
    const eastY = mz * nx - mx * nz;
    const eastZ = mx * ny - my * nx;
    const eastNorm = Math.sqrt(eastX * eastX + eastY * eastY + eastZ * eastZ);
    if (eastNorm < 1e-6) return { heading: NaN, tiltDeg };

    const ex = eastX / eastNorm;
    const ey = eastY / eastNorm;
    const ez = eastZ / eastNorm;

    const northX = ny * ez - nz * ey;
    const northY = nz * ex - nx * ez;
    const northZ = nx * ey - ny * ex;
    const northNorm = Math.sqrt(northX * northX + northY * northY + northZ * northZ);
    if (northNorm < 1e-6) return { heading: NaN, tiltDeg };

    const nnx = northX / northNorm;
    const nny = northY / northNorm;
    const nnz = northZ / northNorm;

    // When the phone is flat, +Y (the top edge of the screen) is the natural
    // compass reference. Near portrait-upright, +Y becomes parallel to gravity
    // and has no usable horizontal projection. Blend to the screen-normal axis
    // in that pose. The sign is selected from gravity so lifting either the top
    // or bottom edge keeps the displayed direction continuous.
    const topVerticality = Math.abs(ny);
    const uprightProgress = clamp01((topVerticality - 0.55) / 0.30);
    const uprightMix = uprightProgress * uprightProgress * (3 - 2 * uprightProgress);
    const facingSign = ny >= 0 ? 1 : -1;
    const forwardNorth = (1 - uprightMix) * nny + uprightMix * facingSign * nnz;

    if (Math.hypot(nnx, forwardNorth) < 1e-6) return { heading: NaN, tiltDeg };

    // Preserve the established compass sign convention while using the
    // pose-adaptive forward axis above.
    const heading = (Math.atan2(nnx, forwardNorth) * 180 / Math.PI + 360) % 360;
    return { heading, tiltDeg };
}

export type ScreenRotation = 0 | 90 | -90 | 180;

/**
 * Rotate a native sensor vector into the axes of the currently rendered screen.
 * This keeps the screen's top edge as +Y in portrait and both landscape modes.
 */
export function rotateVectorForScreen(
    x: number,
    y: number,
    z: number,
    rotation: ScreenRotation,
): { x: number; y: number; z: number } {
    switch (rotation) {
        case 90:
            return { x: -y, y: x, z };
        case -90:
            return { x: y, y: -x, z };
        case 180:
            return { x: -x, y: -y, z };
        default:
            return { x, y, z };
    }
}

// ─── Circular vector smoother (sin/cos EMA) ───────────────────────────────────
/**
 * Smooths angles using sin/cos EMA — correctly handles 0°/360° wrap-around.
 * α ≈ 0.12–0.18 gives natural compass inertia.
 */
export class CircularEMA {
    private sinEMA = 0;
    private cosEMA = 1;
    private initialized = false;
    readonly alpha: number;

    constructor(alpha = 0.22) {
        this.alpha = Math.max(0.05, Math.min(0.5, alpha));
    }

    smooth(angleDeg: number, alphaOverride?: number): number {
        const alpha = alphaOverride === undefined
            ? this.alpha
            : Math.max(0.05, Math.min(0.9, alphaOverride));
        const r = toRad(angleDeg);
        const s = Math.sin(r), c = Math.cos(r);
        if (!this.initialized) {
            this.sinEMA = s; this.cosEMA = c;
            this.initialized = true;
        } else {
            this.sinEMA = alpha * s + (1 - alpha) * this.sinEMA;
            this.cosEMA = alpha * c + (1 - alpha) * this.cosEMA;
        }
        return (Math.atan2(this.sinEMA, this.cosEMA) * 180 / Math.PI + 360) % 360;
    }

    reset() { this.initialized = false; }
}

// ─── Stability tracker (circular variance) ────────────────────────────────────
export class StabilityTracker {
    private samples: number[] = [];
    readonly maxSamples: number;

    constructor(maxSamples = 20) { this.maxSamples = maxSamples; }

    /** Returns circular-mean resultant length R (0 = random, 1 = perfectly stable). */
    add(angleDeg: number): number {
        this.samples.push(angleDeg);
        if (this.samples.length > this.maxSamples) this.samples.shift();
        if (this.samples.length < 4) return 0;
        let sS = 0, cS = 0;
        for (const a of this.samples) {
            sS += Math.sin(toRad(a));
            cS += Math.cos(toRad(a));
        }
        return Math.sqrt(sS ** 2 + cS ** 2) / this.samples.length;
    }

    get count() { return this.samples.length; }
    reset() { this.samples = []; }
}

// ─── Angular helpers ──────────────────────────────────────────────────────────
/** Shortest angular distance from a1 to a2 (result: -180..180) */
export function angularDifference(a1: number, a2: number): number {
    let d = a2 - a1;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
}

// ─── Legacy exports (kept for backward compat) ───────────────────────────────
export const ALIGNED_THRESHOLD = THR_PERFECT_DEG;
export const KAABA_LAT_EXPORT = KAABA_LAT;
export const KAABA_LON_EXPORT = KAABA_LON;
export type AlignmentStatus = 'aligned' | 'near' | 'searching';

// ─── Internal ─────────────────────────────────────────────────────────────────
function toRad(d: number) { return d * Math.PI / 180; }
function clamp01(value: number) { return Math.max(0, Math.min(1, value)); }
