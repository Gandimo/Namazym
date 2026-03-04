import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Plus Icon — Tesbih
 * Minimal Cross
 */
export function PlusIcon({
    size = ICON_DEFAULTS.size,
    color = ICON_DEFAULTS.color,
    strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 5V19M5 12H19"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

/**
 * Minus Icon — Tesbih
 * Minimal Dash
 */
export function MinusIcon({
    size = ICON_DEFAULTS.size,
    color = ICON_DEFAULTS.color,
    strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M5 12H19"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
