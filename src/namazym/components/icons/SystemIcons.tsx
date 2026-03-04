import React from 'react';
import Svg, { Path, Rect, Circle, Polyline, Line } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Notification Icon - Bell
 * Minimal outline bell
 */
export function NotificationIcon({ size = ICON_DEFAULTS.size, color = ICON_DEFAULTS.color, strokeWidth = ICON_DEFAULTS.strokeWidth }: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

/**
 * Checklist Icon - Kaza
 * Square with checkmark inside
 */
export function ChecklistIcon({ size = ICON_DEFAULTS.size, color = ICON_DEFAULTS.color, strokeWidth = ICON_DEFAULTS.strokeWidth }: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M9 11l3 3L22 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

/**
 * Share Icon - Share
 * Standard share node icon
 */
export function ShareIcon({ size = ICON_DEFAULTS.size, color = ICON_DEFAULTS.color, strokeWidth = ICON_DEFAULTS.strokeWidth }: PremiumIconProps) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={strokeWidth} />
            <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
            <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={color} strokeWidth={strokeWidth} />
            <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
    );
}
