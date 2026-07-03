/**
 * Offline Qibla places for Turkmenistan.
 *
 * This is a SEPARATE data source used ONLY by the Qibla compass. It does NOT
 * touch the prayer-time city/cityId system in `cities.ts` (which keeps mapping
 * the 5 selectable provinces to the 6 offline prayer-time caches).
 *
 * Everything here is fully offline: fixed coordinates + a magnetic-declination
 * approximation. The Qibla bearing itself is never hard-coded — it is computed
 * from these coordinates with the standard great-circle formula in
 * `bearingToKaaba()`. `declination` (°, East positive, WMM ~2025) converts the
 * phone's magnetic heading to true north; it drifts ~0.1°/yr.
 */

export interface QiblaPlace {
    key: string;
    label: string;
    lat: number;
    lon: number;
    /** Magnetic declination in degrees, East positive (WMM ~2025 approximation). */
    declination: number;
}

export const QIBLA_PLACES: QiblaPlace[] = [
    { key: 'asgabat', label: 'Aşgabat', lat: 37.9601, lon: 58.3261, declination: 5.5 },
    { key: 'mary', label: 'Mary', lat: 37.6004, lon: 61.8310, declination: 5.9 },
    { key: 'turkmenabat', label: 'Türkmenabat', lat: 39.0733, lon: 63.5786, declination: 6.3 },
    { key: 'dasoguz', label: 'Daşoguz', lat: 41.8369, lon: 59.9658, declination: 6.4 },
    { key: 'balkanabat', label: 'Balkanabat', lat: 39.5108, lon: 54.3671, declination: 4.9 },
    { key: 'turkmenbasy', label: 'Türkmenbaşy', lat: 40.0231, lon: 52.9597, declination: 4.6 },
    { key: 'tejen', label: 'Tejen', lat: 37.3878, lon: 60.5017, declination: 5.7 },
    { key: 'bayramaly', label: 'Baýramaly', lat: 37.6197, lon: 62.1631, declination: 6.0 },
    { key: 'serdar', label: 'Serdar', lat: 38.9764, lon: 56.2789, declination: 5.2 },
    { key: 'koneurgenc', label: 'Köneürgenç', lat: 42.3286, lon: 59.1553, declination: 6.4 },
];

export const DEFAULT_QIBLA_PLACE = QIBLA_PLACES[0]; // Aşgabat

/**
 * Maps a prayer-time placeKey (the province-level keys used by the city selector
 * / prayer-time cache) to the most specific Qibla place. Prayer-time logic is
 * unchanged — this lookup exists only so the compass can use the most accurate
 * available coordinates for the user's selected place.
 */
export const PRAYER_PLACEKEY_TO_QIBLA: Record<string, string> = {
    asgabat_arkadag_ahal: 'asgabat',
    mary: 'mary',
    lebap: 'turkmenabat',   // Lebap province → its capital Türkmenabat
    dasoguz: 'dasoguz',
    balkan: 'balkanabat',   // Balkan province → its capital Balkanabat
};

/**
 * Resolve the best offline Qibla place for a selected key.
 * Priority: (1) direct Qibla-place key, (2) prayer placeKey → Qibla mapping,
 * (3) Aşgabat fallback. Never returns undefined; never needs the network.
 */
export function resolveQiblaPlace(placeKey: string | undefined | null): QiblaPlace {
    if (!placeKey) return DEFAULT_QIBLA_PLACE;
    return (
        QIBLA_PLACES.find(p => p.key === placeKey) ??
        QIBLA_PLACES.find(p => p.key === PRAYER_PLACEKEY_TO_QIBLA[placeKey]) ??
        DEFAULT_QIBLA_PLACE
    );
}
