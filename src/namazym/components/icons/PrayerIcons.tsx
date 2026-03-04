import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Fajr Icon - Dawn
 * Horizon line with sun just peeking up and rising rays
 */
export function FajrIcon({ size = ICON_DEFAULTS.size, color = ICON_DEFAULTS.color, strokeWidth = ICON_DEFAULTS.strokeWidth }: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M3 20h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M8 20a4 4 0 0 1 8 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M12 14v-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M7 16l-2-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M17 16l2-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
    );
}

/**
 * Sunrise Icon - Full Sunrise
 * Horizon line with full sun sitting on it
 */
export function SunriseIcon({ size = ICON_DEFAULTS.size, color = ICON_DEFAULTS.color, strokeWidth = ICON_DEFAULTS.strokeWidth }: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M3 20h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Circle cx="12" cy="14" r="4" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M12 8v-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M6 10l-2-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M18 10l2-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
    );
}

/**
 * Dhuhr Icon - Zenith
 * Full sun in sky, no horizon
 */
export function DhuhrIcon({ size = ICON_DEFAULTS.size, color = ICON_DEFAULTS.color, strokeWidth = ICON_DEFAULTS.strokeWidth }: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M12 1v2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M12 21v2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M4.22 4.22l1.42 1.42" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M18.36 18.36l1.42 1.42" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M1 12h2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M21 12h2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M4.22 19.78l1.42-1.42" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M18.36 5.64l1.42-1.42" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
    );
}

/**
 * Asr Icon - Afternoon
 * Sun with minimal cloud to indicate later day/shadow
 */
export function AsrIcon({ size = ICON_DEFAULTS.size, color = ICON_DEFAULTS.color, strokeWidth = ICON_DEFAULTS.strokeWidth }: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="16" cy="8" r="3" stroke={color} strokeWidth={strokeWidth} />
            <Path d="M4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M4 18h16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
    );
}

/**
 * Maghrib Icon - Sunset
 * Horizon with sun half set (same as Fajr but no up rays, maybe down/neutral?)
 * Actually visually distinguishing from Fajr is good.
 * Let's make it Horizon + Sun half set + Arrow Down? No arrows.
 * Let's just use the same peeking sun but maybe different ray angle?
 * Fajr rays were Up/Out. Maghrib rays can be neutral or omitted.
 */
export function MaghribIcon({ size = ICON_DEFAULTS.size, color = ICON_DEFAULTS.color, strokeWidth = ICON_DEFAULTS.strokeWidth }: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M3 20h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Path d="M8 20a4 4 0 0 1 8 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            {/* Omit rays to imply setting/calmness */}
        </Svg>
    );
}

/**
 * Isha Icon - Night
 * Crescent Moon and Star
 */
export function IshaIcon({ size = ICON_DEFAULTS.size, color = ICON_DEFAULTS.color, strokeWidth = ICON_DEFAULTS.strokeWidth }: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}
