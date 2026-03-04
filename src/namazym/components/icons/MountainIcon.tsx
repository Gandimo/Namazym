import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Mountain Icon — Ziyarat
 * Fluid peaks, not jagged
 */
export function MountainIcon({
  size = ICON_DEFAULTS.size,
  color = ICON_DEFAULTS.color,
  strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 20L8.5 7L14 16L16.5 12L21 20H3Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
