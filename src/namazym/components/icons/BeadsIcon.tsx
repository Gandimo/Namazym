import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { PremiumIconProps, ICON_DEFAULTS } from './PremiumIcon';

/**
 * Beads Icon — Tesbih
 * Abstract loop with a few beads, zen aesthetic
 */
export function BeadsIcon({
  size = ICON_DEFAULTS.size,
  color = ICON_DEFAULTS.color,
  strokeWidth = ICON_DEFAULTS.strokeWidth,
}: PremiumIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Main Loop */}
      <Circle
        cx="12"
        cy="11"
        r="8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Tassel */}
      <Path
        d="M12 19V22"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Bead Indicators (Hollow/Monoline) */}
      <Circle cx="12" cy="3" r="1.5" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="19" cy="11" r="1.5" stroke={color} strokeWidth={strokeWidth} />
      <Circle cx="5" cy="11" r="1.5" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
