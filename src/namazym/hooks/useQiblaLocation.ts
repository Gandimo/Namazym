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
        };
    }, [placeKey]);
}
