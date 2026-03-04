/**
 * Returns the appropriate Ionicons moon icon name for a given Hijri day.
 * Implements a simplified visual morphology for moon phases.
 */
export const getMoonIconForDay = (hijriDay: number): string => {
    // 1-3: New Moon / Crescent
    // 4-6: Early Crescent
    // 7-10: First Quarter
    // 11-13: Waxing Gibbous
    // 14-16: Full Moon
    // 17-20: Waning Gibbous
    // 21-23: Last Quarter
    // 24-27: Late Crescent
    // 28-30: Waning Crescent / New Moon

    if (hijriDay >= 13 && hijriDay <= 16) return 'moon'; // Full
    if (hijriDay >= 7 && hijriDay <= 12) return 'moon-outline'; // Quarterish
    if (hijriDay >= 17 && hijriDay <= 22) return 'moon-outline'; // Quarterish

    // Default to crescent for most other days
    return 'moon-outline';
};

// Note: If we had a custom svg-based morphology, we would return paths here.
// For Ionicons, we rely on available variants.
