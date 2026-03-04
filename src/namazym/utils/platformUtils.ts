import { Platform } from 'react-native';

/**
 * AntiGravity Platform Value Selector
 * 
 * Safely selects a value based on the current platform.
 * Prevents ReferenceErrors by ensuring Platform is correctly accessed.
 */
export const getPlatformValue = <T>(config: {
    ios: T;
    android: T;
    web?: T;
    default?: T;
}): T => {
    const os = Platform.OS;

    if (os === 'ios') return config.ios;
    if (os === 'android') return config.android;
    if (os === 'web' && config.web !== undefined) return config.web;

    return config.default ?? config.ios;
};

/**
 * AntiGravity Blur Intensity Selector
 * 
 * iOS and Android blur intensities often need different scaling.
 */
export const getBlurIntensity = (intensity: number) => {
    return Platform.select({
        ios: intensity,
        android: intensity * 1.5, // Android typically needs higher intensity for similar look
        default: intensity,
    });
};
