/**
 * Kybla (Qibla) Direction Calculation Utilities
 * Provides accurate bearing to Kaaba from any location using great-circle calculation
 */

// Kaaba coordinates (hardcoded)
export const KAABA_LAT = 21.4225;
export const KAABA_LON = 39.8262;

/**
 * Calculate great-circle bearing from user location to Kaaba
 * Uses Haversine formula variation for accurate bearing
 * 
 * @param userLat User latitude in degrees
 * @param userLon User longitude in degrees
 * @returns Bearing in degrees (0-360, where 0 is North)
 */
export function bearingToKaaba(userLat: number, userLon: number): number {
    // Convert to radians
    const φ1 = (userLat * Math.PI) / 180;
    const φ2 = (KAABA_LAT * Math.PI) / 180;
    const Δλ = ((KAABA_LON - userLon) * Math.PI) / 180;

    // Great-circle bearing formula
    const θ = Math.atan2(
        Math.sin(Δλ) * Math.cos(φ2),
        Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
    );

    // Convert to degrees and normalize to 0-360
    return (θ * 180 / Math.PI + 360) % 360;
}

/**
 * Magnetic declination values for Turkmenistan regions (approximate for 2026)
 * Values in degrees (positive = East declination)
 */
export const DECLINATION_MAP: Record<string, number> = {
    'asgabat': 3.5,
    'mary': 3.8,
    'dasoguz': 4.2,
    'balkan': 2.9,
    'lebap': 4.0,
    'ahal': 3.5
};

/**
 * Get magnetic declination for a given city
 * @param cityKey City key (lowercase)
 * @returns Declination in degrees (defaults to Aşgabat if not found)
 */
export function getDeclination(cityKey: string): number {
    return DECLINATION_MAP[cityKey.toLowerCase()] || 3.5;
}

/**
 * Convert magnetic heading to true heading using declination
 * @param magneticHeading Heading from compass (degrees)
 * @param declination Magnetic declination for location (degrees)
 * @returns True heading (degrees, 0-360)
 */
export function magneticToTrue(magneticHeading: number, declination: number): number {
    return (magneticHeading + declination + 360) % 360;
}

/**
 * Exponential Moving Average filter for smooth angle transitions
 * Handles 0/360 wrap-around properly
 */
export class AngleSmoother {
    private value: number = 0;
    private alpha: number;
    private initialized: boolean = false;

    constructor(alpha: number = 0.2) {
        this.alpha = Math.max(0.1, Math.min(0.5, alpha)); // Clamp between 0.1 and 0.5
    }

    /**
     * Smooth a new angle value using EMA
     * @param newAngle New angle in degrees (0-360)
     * @returns Smoothed angle (0-360)
     */
    smooth(newAngle: number): number {
        // Initialize on first call
        if (!this.initialized) {
            this.value = newAngle;
            this.initialized = true;
            return this.value;
        }

        // Calculate shortest angular difference (handles wrap-around)
        let diff = newAngle - this.value;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        // Apply EMA
        this.value = (this.value + diff * this.alpha + 360) % 360;
        return this.value;
    }

    /**
     * Reset the smoother
     */
    reset(): void {
        this.initialized = false;
        this.value = 0;
    }
}

/**
 * Calculate the shortest angular difference between two angles
 * @param angle1 First angle (degrees)
 * @param angle2 Second angle (degrees)
 * @returns Shortest angular distance (-180 to 180)
 */
export function angularDifference(angle1: number, angle2: number): number {
    let diff = angle2 - angle1;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
}

/**
 * Alignment thresholds (in degrees)
 */
export const ALIGNED_THRESHOLD = 2;  // Within 2° = aligned
export const NEAR_THRESHOLD = 5;     // Within 5° = near

export type AlignmentStatus = 'aligned' | 'near' | 'searching';

/**
 * Get alignment status based on angular difference
 * @param diff Angular difference in degrees
 * @returns Alignment status
 */
export function getAlignmentStatus(diff: number): AlignmentStatus {
    const absDiff = Math.abs(diff);
    if (absDiff <= ALIGNED_THRESHOLD) return 'aligned';
    if (absDiff <= NEAR_THRESHOLD) return 'near';
    return 'searching';
}
