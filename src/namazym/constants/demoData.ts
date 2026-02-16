/**
 * Demo Data Constants
 * 
 * Fixed values used when DEMO_MODE is enabled.
 * Ensures deterministic, reproducible screenshots.
 */

export const DEMO_CITY_ID = 1; // Aşgabat
export const DEMO_DATE = '2026-02-10';
export const DEMO_TIME = '09:15';
export const DEMO_LAST_UPDATED = '2026-02-10 09:10';
export const DEMO_QIBLA_DEGREE = 247;

/**
 * Demo Date/Time as Date object
 * Returns: 2026-02-10 09:15:00 in Turkmenistan timezone
 */
export const getDemoDateTime = (): Date => {
    // Create date in UTC then adjust for Turkmenistan (+05:00)
    return new Date('2026-02-10T09:15:00+05:00');
};
