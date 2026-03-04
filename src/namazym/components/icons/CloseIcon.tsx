import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Close Icon — General
 * Minimal X
 */
export function CloseIcon({
    size = ICON_DEFAULTS.size,
    color = ICON_DEFAULTS.color,
    strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M18 6L6 18M6 6L18 18"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
