import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Circle, RadialGradient, Defs, Stop, G, Mask } from 'react-native-svg';
import { PrayerIndex } from './RiveAtmosphereBackground';

const { width: SW, height: SH } = Dimensions.get('window');

interface SkyEngineProps {
    currentPrayerIndex: PrayerIndex;
    motionIntensity: number;
    solarProgress: number;
    reducedMotion?: boolean;
}

// ─── V3 Spec Constants ───
const CELESTIAL = {
    SUN: {
        size: 54,
        x: 0.22,
        visibleIn: [0, 1, 2], // Fajr, Dhuhr, Asr
        factors: { 0: 0.5, 1: 0.78, 2: 0.7 } as Record<number, number>
    },
    MOON: {
        size: 44,
        x: 0.78,
        visibleIn: [0, 3, 4], // Fajr, Maghrib, Isha
        factors: { 0: 0.55, 3: 0.65, 4: 0.58 } as Record<number, number>
    }
};

export const SkyEngineV2: React.FC<SkyEngineProps> = ({
    currentPrayerIndex,
    motionIntensity,
    solarProgress,
    reducedMotion = false
}) => {
    const mi = reducedMotion ? 0 : motionIntensity;

    // Shimmer / Pulse
    const sunPulse = useRef(new Animated.Value(0)).current;
    const moonPulse = useRef(new Animated.Value(0)).current;
    const rayRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (reducedMotion) return;

        const createLoop = (val: Animated.Value, duration: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(val, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(val, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ])
            ).start();
        };

        createLoop(sunPulse, 3600);
        createLoop(moonPulse, 5200);

        // Sun Rays rotation (V3.2 - Calmer 16s)
        Animated.loop(
            Animated.timing(rayRotate, {
                toValue: 1,
                duration: 16000,
                easing: Easing.linear,
                useNativeDriver: true
            })
        ).start();

        return () => {
            sunPulse.stopAnimation();
            moonPulse.stopAnimation();
            rayRotate.stopAnimation();
        };
    }, [reducedMotion]);

    const sunShimmerScale = sunPulse.interpolate({ inputRange: [0, 1], outputRange: [0.996, 1.014] });
    const sunShimmerOp = sunPulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.0] });

    const moonShimmerScale = moonPulse.interpolate({ inputRange: [0, 1], outputRange: [0.995, 1.012] });
    const moonShimmerOp = moonPulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.0] });

    const raysRotation = rayRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '6deg']
    });

    const getSunY = (progress: number) => {
        if (progress <= 0.5) return 0.78 + (0.28 - 0.78) * (progress * 2);
        return 0.28 + (0.74 - 0.28) * ((progress - 0.5) * 2);
    };

    const showSun = CELESTIAL.SUN.visibleIn.includes(currentPrayerIndex);
    const showMoon = CELESTIAL.MOON.visibleIn.includes(currentPrayerIndex);

    const sunTop = getSunY(solarProgress) * SH * 0.46;
    const moonTop = 0.18 * SH;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Sun V3.2 */}
            {showSun && (
                <Animated.View style={[
                    styles.celestialWrapper,
                    {
                        top: sunTop,
                        left: SW * CELESTIAL.SUN.x - CELESTIAL.SUN.size / 2,
                        opacity: Animated.multiply(sunShimmerOp, CELESTIAL.SUN.factors[currentPrayerIndex] || 0.7),
                        transform: [{ scale: sunShimmerScale }]
                    }
                ]}>
                    <SunSVG size={CELESTIAL.SUN.size} rotation={raysRotation} />
                </Animated.View>
            )}

            {/* Moon V3.2 */}
            {showMoon && (
                <Animated.View style={[
                    styles.celestialWrapper,
                    {
                        top: moonTop,
                        left: SW * CELESTIAL.MOON.x - CELESTIAL.MOON.size / 2,
                        opacity: Animated.multiply(moonShimmerOp, CELESTIAL.MOON.factors[currentPrayerIndex] || 0.6),
                        transform: [{ scale: moonShimmerScale }]
                    }
                ]}>
                    <MoonSVG size={CELESTIAL.MOON.size} />
                </Animated.View>
            )}
        </View>
    );
};

const SunSVG = ({ size, rotation }: { size: number; rotation: Animated.AnimatedInterpolation<string | number> }) => {
    const center = size / 2;
    return (
        <Svg height={size * 1.5} width={size * 1.5} viewBox={`0 0 ${size * 1.5} ${size * 1.5}`}>
            <Defs>
                <RadialGradient id="sunCore" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
                    <Stop offset="0%" stopColor="#FFF5C8" stopOpacity="0.95" />
                    <Stop offset="45%" stopColor="#FFD76A" stopOpacity="0.7" />
                    <Stop offset="100%" stopColor="#FFAA00" stopOpacity="0.12" />
                </RadialGradient>
            </Defs>
            <G translate={`${size * 0.25} ${size * 0.25}`}>
                {/* Corona Ring (V3.2) */}
                <Circle cx={center} cy={center} r={center * 1.25} stroke="#FFD76A" strokeWidth="8" opacity="0.05" fill="none" />

                {/* Dotted Rays (Animated Rotation) */}
                <AnimatedG rotation={rotation} origin={`${center}, ${center}`}>
                    {[...Array(14)].map((_, i) => (
                        <Circle
                            key={i}
                            cx={center + Math.cos(i * (Math.PI * 2) / 14) * (center + 12)}
                            cy={center + Math.sin(i * (Math.PI * 2) / 14) * (center + 12)}
                            r="1.2"
                            fill="#FFD76A"
                            opacity="0.08"
                        />
                    ))}
                </AnimatedG>

                {/* Main Core */}
                <Circle cx={center} cy={center} r={center} fill="url(#sunCore)" />

                {/* Outer Rim */}
                <Circle cx={center} cy={center} r={center} stroke="#FFFFFF" strokeWidth="1.1" opacity="0.18" fill="none" />
            </G>
        </Svg>
    );
};

const MoonSVG = ({ size }: { size: number }) => {
    const center = size / 2;
    return (
        <Svg height={size * 1.2} width={size * 1.2} viewBox={`0 0 ${size * 1.2} ${size * 1.2}`}>
            <Defs>
                <RadialGradient id="moonCore" cx="35%" cy="35%" rx="50%" ry="50%" fx="35%" fy="35%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
                    <Stop offset="55%" stopColor="#E6EBF5" stopOpacity="0.62" />
                    <Stop offset="100%" stopColor="#C8D2E6" stopOpacity="0.18" />
                </RadialGradient>
                <Mask id="moonMask">
                    <Circle cx={center} cy={center} r={center} fill="white" />
                    <Circle cx={center - 4} cy={center + 2} r={center} fill="black" />
                </Mask>
            </Defs>
            <G translate={`${size * 0.1} ${size * 0.1}`}>
                {/* Glow Ring (V3.2) */}
                <Circle cx={center} cy={center} r={center * 1.15} stroke="#E6EBF5" strokeWidth="8" opacity="0.045" fill="none" />

                {/* Core */}
                <Circle cx={center} cy={center} r={center} fill="url(#moonCore)" />

                {/* Terminator Shadow (V3.2) */}
                <Circle cx={center} cy={center} r={center} fill="#000000" opacity="0.18" mask="url(#moonMask)" />

                {/* Outer Rim */}
                <Circle cx={center} cy={center} r={center} stroke="#FFFFFF" strokeWidth="1.2" opacity="0.22" fill="none" />
            </G>
        </Svg>
    );
};

const AnimatedG = Animated.createAnimatedComponent(G);

const styles = StyleSheet.create({
    celestialWrapper: {
        position: 'absolute',
        width: 100, // Safe container for shimmer scale
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
