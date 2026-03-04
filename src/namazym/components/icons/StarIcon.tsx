import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Star Icon — Sähetli gün
 * Abstract North Star / Sparkle style (More premium than 5-point star)
 */
export function StarIcon({
  size = ICON_DEFAULTS.size,
  color = ICON_DEFAULTS.color,
  strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
