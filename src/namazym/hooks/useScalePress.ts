import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

export const useScalePress = (scaleValue = 0.95, hapticEnabled = true, duration = 150) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = useCallback(() => {
        if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.timing(scaleAnim, {
            toValue: scaleValue,
            duration: duration,
            useNativeDriver: true,
        }).start();
    }, [scaleValue, hapticEnabled, duration]);

    const onPressOut = useCallback(() => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, []);

    return {
        onPressIn,
        onPressOut,
        scaleStyle: { transform: [{ scale: scaleAnim }] }
    };
};
