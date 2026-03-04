import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Chevron Down — NamazDetail
 * Minimal arrow
 */
export function ChevronDownIcon({
    size = ICON_DEFAULTS.size,
    color = ICON_DEFAULTS.color,
    strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M6 9L12 15L18 9"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

/**
 * Chevron Right — IslamBayramlary
 * Minimal arrow
 */
export function ChevronRightIcon({
    size = ICON_DEFAULTS.size,
    color = ICON_DEFAULTS.color,
    strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M9 18L15 12L9 6"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
