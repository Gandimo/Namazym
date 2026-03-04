import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Check Circle Icon — Tesbih Completion
 * Circle with tick
 */
export function CheckCircleIcon({
    size = ICON_DEFAULTS.size,
    color = ICON_DEFAULTS.color,
    strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle
                cx="12"
                cy="12"
                r="10"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />
            <Path
                d="M8.5 12.5L10.5 14.5L15.5 9.5"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
