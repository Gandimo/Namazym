import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Info Icon — Kybla Calibration/Help
 * Minimal i in circle
 */
export function InfoIcon({
    size = ICON_DEFAULTS.size,
    color = ICON_DEFAULTS.color,
    strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} />
            <Path
                d="M12 16V12"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />
            <Circle cx="12" cy="8" r="1" fill={color} />
        </Svg>
    );
}
