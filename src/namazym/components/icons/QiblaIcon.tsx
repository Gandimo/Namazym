import React from 'react';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Qibla Icon — Minimal Compass
 * Thin circle with delicate needle
 */
export function QiblaIcon({
  size = ICON_DEFAULTS.size,
  color = ICON_DEFAULTS.color,
  strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Minimal Needle */}
      <Path
        d="M12 7L13.5 12L12 16L10.5 12L12 7Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* North Indicator */}
      <Line
        x1="12"
        y1="4"
        x2="12"
        y2="5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
