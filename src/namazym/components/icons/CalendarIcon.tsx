import React from 'react';
import Svg, { Rect, Path, Line } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Calendar Icon — Islam Bayramlary
 * Ultra minimal grid
 */
export function CalendarIcon({
  size = ICON_DEFAULTS.size,
  color = ICON_DEFAULTS.color,
  strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="3"
        y1="9"
        x2="21"
        y2="9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line x1="8" y1="2" x2="8" y2="4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}
