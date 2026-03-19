/**
 * useQiblaBearing — computes qibla bearing and Mecca distance from coordinates.
 * Pure offline calculation, memoized by lat/lon.
 */
import { useMemo } from 'react';
import { bearingToKaaba, haversineDistance, KAABA_LAT, KAABA_LON } from '../utils/kyblaUtils';

export interface QiblaBearing {
    bearing: number;      // 0–360°
    distanceKm: number;   // km to Mecca
}

export function useQiblaBearing(lat: number, lon: number): QiblaBearing {
    return useMemo<QiblaBearing>(() => ({
        bearing: bearingToKaaba(lat, lon),
        distanceKm: Math.round(haversineDistance(lat, lon, KAABA_LAT, KAABA_LON)),
    }), [lat, lon]);
}
