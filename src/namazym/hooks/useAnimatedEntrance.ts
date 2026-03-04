import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const useAnimatedEntrance = (delay = 0) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                delay: delay,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 1,
                duration: 400,
                delay: delay,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();
    }, [delay, opacity, scale]);

    return { opacity, transform: [{ scale }] };
};
