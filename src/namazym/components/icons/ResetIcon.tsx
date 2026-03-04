import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Reset Icon — Tesbih
 * Minimal Refresh arrow
 */
export function ResetIcon({
    size = ICON_DEFAULTS.size,
    color = ICON_DEFAULTS.color,
    strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M23 4V10H17"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M1 20V14H7"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14L18.36 18.36A9 9 0 013.51 15"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
