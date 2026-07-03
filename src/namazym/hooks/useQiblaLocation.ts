/**
 * useQiblaLocation — resolves user lat/lon
 * Priority: (1) saved city from CityContext, (2) CITIES[0] as fallback.
 * No GPS fetch — fully offline per spec.
 */
import { useMemo } from 'react';
import { useCity } from '../context/CityContext';
import { CITIES } from '../constants/cities';

export interface QiblaLocation {
    lat: number;
    lon: number;
    cityLabel: string;
    cityKey: string;
    /** Magnetic declination (°E) for the selected city — offline, WMM ~2025. */
    declination: number;
}

export function useQiblaLocation(): QiblaLocation {
    const { placeKey } = useCity();

    return useMemo<QiblaLocation>(() => {
        const city = CITIES.find(c => c.key === placeKey) ?? CITIES[0];
        return {
            lat: city.lat ?? 37.9601,
            lon: city.lon ?? 58.3261,
            cityLabel: city.label ?? 'Aşgabat',
            cityKey: city.key,
            // Fallback ~5.5°E is a safe Turkmenistan-wide average if a city is
            // missing the value; still far better than no declination correction.
            declination: city.declination ?? 5.5,
        };
    }, [placeKey]);
}
