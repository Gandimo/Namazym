/**
 * useQiblaLocation — resolves user lat/lon
 * Priority: (1) saved city from CityContext, (2) CITIES[0] as fallback.
 * No GPS fetch — fully offline per spec.
 */
import { useMemo } from 'react';
import { useCity } from '../context/CityContext';
import { resolveQiblaPlace } from '../constants/qiblaPlaces';

export interface QiblaLocation {
    lat: number;
    lon: number;
    cityLabel: string;
    cityKey: string;
    /** Magnetic declination (°E) for the resolved Qibla place — offline, WMM ~2025. */
    declination: number;
}

export function useQiblaLocation(): QiblaLocation {
    // placeKey/placeLabel come from the prayer-time city selector (unchanged).
    const { placeKey, placeLabel } = useCity();

    return useMemo<QiblaLocation>(() => {
        // Resolve to the most specific offline Qibla coordinates for the selected
        // place. Prayer-time cityId logic is untouched — this only affects the
        // compass. Fully offline (no GPS / geocoding / network).
        const qp = resolveQiblaPlace(placeKey);
        return {
            lat: qp.lat,
            lon: qp.lon,
            // Keep showing the user's selected place label (falls back to the
            // Qibla place label if the context label is empty).
            cityLabel: placeLabel || qp.label,
            cityKey: placeKey,
            declination: qp.declination,
        };
    }, [placeKey, placeLabel]);
}
