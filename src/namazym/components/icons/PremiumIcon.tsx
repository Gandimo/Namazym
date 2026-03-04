import React from 'react';
import { Pressable, ViewStyle, StyleProp, Animated, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';

import { useScalePress } from '../../hooks/useScalePress';
import { ICON_SIZES, ICON_COLORS, ICON_GRADIENTS, IconSize, IconGradient } from '../../theme/iconConstants';
import { IconAnalyticsService } from '../../services/IconAnalyticsService';

type IconLibrary = 'ionicons' | 'feather';
type IconState = 'active' | 'inactive';

interface PremiumIconProps {
  library?: IconLibrary;
  name: string;
  size?: IconSize;
  customSize?: number; // For migration: 14, 20, 22px gibi custom değerler
  state?: IconState;
  color?: string; // Manuel renk override
  gradient?: IconGradient; // Soft 3D gradient
  interactive?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  source?: string; // For analytics tracking
  pulse?: boolean; // Pulse animation for proximity
  style?: StyleProp<ViewStyle>;
}

export const PremiumIcon: React.FC<PremiumIconProps> = ({
  library = 'ionicons',
  name,
  size = 'STANDARD',
  customSize,
  state = 'active',
  color,
  gradient,
  interactive = false,
  onPress,
  accessibilityLabel,
  source,
  pulse = false,
  style,
}) => {
  const { scaleStyle, onPressIn, onPressOut } = useScalePress();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse animation logic
  React.useEffect(() => {
    if (pulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [pulse]);

  // Boyut hesaplama (Material Design 3 standardına çek)
  const iconSize = customSize || ICON_SIZES[size];

  // Renk hesaplama (eğer gradient yoksa)
  const iconColor = color || ICON_COLORS.LIGHT_ACTIVE;
  const opacity = state === 'active' ? 1 : 0.5;

  // Soft shadow (2026 Soft 3D trend)
  const shadowStyle = {
    shadowColor: gradient ? ICON_GRADIENTS[gradient][1] : '#000',
    shadowOffset: { width: 0, height: iconSize / 12 },
    shadowOpacity: 0.15,
    shadowRadius: iconSize / 6,
    elevation: iconSize / 8,
  } as ViewStyle;

  const handlePress = () => {
    if (interactive && onPress) {
      // Track the tap for analytics
      IconAnalyticsService.trackIconTap(name, source, !!gradient);
      onPress();
    }
  };

  // Touch Target (Material: 48dp)
  const hitSlop = iconSize < 48 ? {
    top: (48 - iconSize) / 2,
    bottom: (48 - iconSize) / 2,
    left: (48 - iconSize) / 2,
    right: (48 - iconSize) / 2
  } : undefined;

  // Icon library seçimi
  const IconComponent = library === 'feather' ? Feather : Ionicons;

  // Gradient wrapper (Soft 3D aesthetic)
  if (gradient) {
    const gradientColors = ICON_GRADIENTS[gradient];
    return (
      <Pressable
        onPressIn={interactive ? onPressIn : undefined}
        onPressOut={interactive ? onPressOut : undefined}
        onPress={handlePress}
        disabled={!interactive}
        hitSlop={hitSlop}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Animated.View style={[
          scaleStyle,
          { transform: [...scaleStyle.transform, { scale: pulseAnim }] },
          style
        ]}>
          <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: iconSize / 2,
              padding: iconSize / 6,
              ...shadowStyle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconComponent
              name={name as any}
              size={iconSize * 0.6}
              color="#FFF"
            />
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  // Simple icon (no gradient)
  const IconElement = (
    <IconComponent
      name={name as any}
      size={iconSize}
      color={iconColor}
      style={{ opacity }}
    />
  );

  if (interactive) {
    return (
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={handlePress}
        hitSlop={hitSlop}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Animated.View style={[
          scaleStyle,
          { transform: [...scaleStyle.transform, { scale: pulseAnim }] },
          shadowStyle,
          style
        ]}>
          {IconElement}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={[
      scaleStyle,
      { transform: [...scaleStyle.transform, { scale: pulseAnim }] },
      style
    ]}>
      {IconElement}
    </Animated.View>
  );
};
