/**
 * Location utilities for NAMAZYM
 * Includes validation, haversine distance, and safe location fetching
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_LOCATION_KEY = 'last_good_location_v1';
const LOCATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface StoredLocation extends Coordinates {
    timestamp: number;
}

/**
 * Validates if coordinates are valid and not (0,0)
 */
export function isValidLocation(coords: Coordinates | null | undefined): boolean {
    if (!coords) return false;
    const { lat, lng } = coords;

    // Check null/undefined
    if (lat == null || lng == null) return false;

    // Check range
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;

    // Check not (0,0) - common error coordinate
    if (lat === 0 && lng === 0) return false;

    return true;
}

/**
 * Haversine formula to calculate distance between two points in km
 * CRITICAL: Correct lat/lng order
 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Request location with permission handling
 * Returns null if permission denied or location unavailable
 */
export async function requestLocationSafe(): Promise<Coordinates | null> {
    try {
        // Check permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            console.log('Location permission denied');
            // Try to use cached location
            return await getLastGoodLocation();
        }

        // Get current position
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        const coords: Coordinates = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
        };

        // Validate before returning
        if (!isValidLocation(coords)) {
            console.warn('Location coordinates invalid:', coords);
            return await getLastGoodLocation();
        }

        // Save as last good location
        await saveLastGoodLocation(coords);

        return coords;
    } catch (error) {
        console.error('Error getting location:', error);
        return await getLastGoodLocation();
    }
}

/**
 * Get last known good location from cache (if recent)
 */
async function getLastGoodLocation(): Promise<Coordinates | null> {
    try {
        const stored = await AsyncStorage.getItem(LAST_LOCATION_KEY);
        if (!stored) return null;

        const data: StoredLocation = JSON.parse(stored);

        // Check if too old
        const age = Date.now() - data.timestamp;
        if (age > LOCATION_MAX_AGE_MS) {
            console.log('Cached location too old');
            return null;
        }

        // Validate
        if (!isValidLocation(data)) {
            return null;
        }

        return { lat: data.lat, lng: data.lng };
    } catch (e) {
        console.error('Error reading cached location:', e);
        return null;
    }
}

/**
 * Save current location to cache
 */
async function saveLastGoodLocation(coords: Coordinates): Promise<void> {
    try {
        const data: StoredLocation = {
            ...coords,
            timestamp: Date.now(),
        };
        await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving location:', e);
    }
}
