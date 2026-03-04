import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient as SvgRadialGradient, Stop, Rect } from 'react-native-svg';
import { PrayerIndex } from './RiveAtmosphereBackground';
import { useMemo } from 'react';

const { width: SW, height: SH } = Dimensions.get('window');

interface AtmosphereLayerProps {
    currentPrayerIndex: PrayerIndex;
    reducedMotion?: boolean;
}

const CONFIG = {
    HAZE_OPACITY: 0.06, // Spec V1.0
    GRAIN_OPACITY: 0.035, // Balanced for subpixel motion (felt, not seen)
    GRAIN_SCALE: 2.2, // Spec V1.0
    VIGNETTE_OPACITY: 0.08, // Spec V1.0
};

export const AtmosphereLayer: React.FC<AtmosphereLayerProps> = ({
    currentPrayerIndex,
    reducedMotion = false
}) => {
    const grainDrift = useRef(new Animated.Value(0)).current;

    const isNight = currentPrayerIndex === 0 || currentPrayerIndex === 4;
    const hazeColor = isNight ? '#0E1628' : '#F0E8D8';

    useEffect(() => {
        if (reducedMotion) return;

        // "Subconscious Opacity Breathing" (Spec V1.0 Master Bible)
        // Rule: Atmosphere should breathe (opacity), never move (translation).
        const breathe = Animated.loop(
            Animated.sequence([
                Animated.timing(grainDrift, { toValue: 1.0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(grainDrift, { toValue: 0.6, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );
        breathe.start();
        return () => breathe.stop();
    }, [reducedMotion]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* 1. Haze Layer (Top to Bottom) */}
            <LinearGradient
                colors={[hazeColor, 'transparent']}
                style={[StyleSheet.absoluteFill, { opacity: CONFIG.HAZE_OPACITY }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.4 }}
            />

            {/* 2. Film Grain Layer (Static with slow drift) */}
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        opacity: Animated.multiply(CONFIG.GRAIN_OPACITY, grainDrift),
                        transform: [{ scale: CONFIG.GRAIN_SCALE }]
                    }
                ]}>
                <GrainSVG />
            </Animated.View>

            {/* 3. Vignette Layer (Edge framing) */}
            <View style={[StyleSheet.absoluteFill, { opacity: CONFIG.VIGNETTE_OPACITY }]}>
                <Svg height={SH} width={SW}>
                    <Defs>
                        <SvgRadialGradient id="vignette" cx="50%" cy="50%" rx="85%" ry="85%" fx="50%" fy="50%">
                            <Stop offset="0.6" stopColor="transparent" stopOpacity="0" />
                            <Stop offset="1" stopColor="#000000" stopOpacity="1" />
                        </SvgRadialGradient>
                    </Defs>
                    <Rect x="0" y="0" width={SW} height={SH} fill="url(#vignette)" />
                </Svg>
            </View>
        </View>
    );
};

// Generates a semi-random dotted pattern to simulate film grain texture
const GrainSVG = () => {
    const dots = useMemo(() => {
        const count = 120; // Enough for texture, safe for performance
        return Array.from({ length: count }).map((_, i) => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            r: 0.4 + Math.random() * 0.8,
        }));
    }, []);

    return (
        <Svg height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            {dots.map((dot, i) => (
                <Circle
                    key={i}
                    cx={`${dot.x}%`}
                    cy={`${dot.y}%`}
                    r={dot.r}
                    fill="#FFFFFF"
                    opacity={0.4 + Math.random() * 0.6}
                />
            ))}
        </Svg>
    );
};

const styles = StyleSheet.create({
    grainContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    }
});


