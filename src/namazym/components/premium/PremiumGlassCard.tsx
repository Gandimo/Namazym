import React from 'react';
import { Animated, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useScalePress } from '../../hooks/useScalePress';
import { premiumScreenTokens } from '../../theme/premiumScreenTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PremiumGlassCardProps = {
    children: React.ReactNode;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    haptic?: 'selection' | 'light' | 'none';
    scale?: number;
};

export function PremiumGlassCard({
    children,
    onPress,
    style,
    contentStyle,
    haptic = 'none',
    scale = 0.985,
}: PremiumGlassCardProps) {
    const press = useScalePress(scale, false, 110);

    const handlePress = () => {
        if (haptic === 'selection') Haptics.selectionAsync();
        if (haptic === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    const sharedStyle: StyleProp<ViewStyle> = [
        {
            backgroundColor: premiumScreenTokens.colors.card,
            borderRadius: premiumScreenTokens.radius.card,
            borderWidth: 1,
            borderColor: premiumScreenTokens.colors.cardBorder,
            paddingHorizontal: premiumScreenTokens.spacing.cardX,
            paddingVertical: premiumScreenTokens.spacing.cardY,
        },
        premiumScreenTokens.shadow.card,
        style,
    ];

    if (onPress) {
        return (
            <AnimatedPressable
                onPress={handlePress}
                onPressIn={press.onPressIn}
                onPressOut={press.onPressOut}
                style={[sharedStyle, press.scaleStyle]}
            >
                <View style={contentStyle}>{children}</View>
            </AnimatedPressable>
        );
    }

    return (
        <View style={sharedStyle}>
            <View style={contentStyle}>{children}</View>
        </View>
    );
}

