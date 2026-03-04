import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, RadialGradient, Defs, Stop, G, Mask, Rect } from 'react-native-svg';
import { PrayerIndex } from './RiveAtmosphereBackground';

const { width: SW, height: SH } = Dimensions.get('window');

interface SkyEngineProps {
    currentPrayerIndex: PrayerIndex;
    motionIntensity: number;
    solarProgress: number;
    reducedMotion?: boolean;
}

// ─── ATMOS_V3.5 REAL MOON Constants ───
const CELESTIAL = {
    SUN: {
        size: 54,
        x: 0.22,
        visibleIn: [0, 1, 2], // Fajr, Dhuhr, Asr
        factors: { 0: 0.5, 1: 0.78, 2: 0.7 } as Record<number, number>,
        corona_opacity: 0.045,
        rays_opacity: 0.055,
        flicker_intensity: 0.18,
        flicker_period: 1400
    },
    MOON: {
        size: 44, // Radius R = size / 2 = 22
        x: 0.78,
        visibleIn: [0, 3, 4], // Fajr, Maghrib, Isha
        factors: { 0: 0.55, 3: 0.65, 4: 0.58 } as Record<number, number>,
        crescent: {
            illumination_ratio: 0.22,
            terminator_angle: 22,
            cut_offset_x: 0.55,
            cut_offset_y: 0.08,
            softness: 0.22, // V3.6 Inner edge feathering
        },
        lighting: {
            rim_opacity: 0.30, // Spec V1.0
            dark_fill_opacity: 0.04, // "Earthshine" Spec V1.0
            strong_glow_opacity: 0.12, // Spec V1.0
            weak_glow_opacity: 0.02,
            glow_spread: 1.6, // Spec V1.0
        },
        surface: {
            variation_opacity: 0.04,
            scale: 0.5,
            soft_blur: 0.015, // Spec V1.0
        },
        float_amplitude: 1.5,
        float_period: 11000
    }
};

export const SkyEngineV3: React.FC<SkyEngineProps> = ({
    currentPrayerIndex,
    motionIntensity,
    solarProgress,
    reducedMotion = false
}) => {
    const mi = reducedMotion ? 0 : motionIntensity;

    const sunFlicker = useRef(new Animated.Value(0)).current;
    const moonFloat = useRef(new Animated.Value(0)).current;
    const rayRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (reducedMotion) return;

        const loopSun = Animated.loop(
            Animated.sequence([
                Animated.timing(sunFlicker, { toValue: 1, duration: CELESTIAL.SUN.flicker_period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(sunFlicker, { toValue: 0, duration: CELESTIAL.SUN.flicker_period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );

        const loopMoon = Animated.loop(
            Animated.sequence([
                Animated.timing(moonFloat, { toValue: 1, duration: CELESTIAL.MOON.float_period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(moonFloat, { toValue: -1, duration: CELESTIAL.MOON.float_period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        );

        const loopRays = Animated.loop(
            Animated.timing(rayRotate, { toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true })
        );

        loopSun.start();
        loopMoon.start();
        loopRays.start();

        return () => {
            loopSun.stop();
            loopMoon.stop();
            loopRays.stop();
        };
    }, [reducedMotion]);

    const sunScale = sunFlicker.interpolate({ inputRange: [0, 1], outputRange: [1, 1.01] });
    const sunOpacityMult = sunFlicker.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] });
    const moonTranslateY = moonFloat.interpolate({
        inputRange: [-1, 1],
        outputRange: [-CELESTIAL.MOON.float_amplitude, CELESTIAL.MOON.float_amplitude]
    });
    const raysRotation = rayRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

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
            {showSun && (
                <Animated.View style={[
                    styles.celestialWrapper,
                    {
                        top: sunTop,
                        left: SW * CELESTIAL.SUN.x - CELESTIAL.SUN.size / 2,
                        opacity: Animated.multiply(sunOpacityMult, CELESTIAL.SUN.factors[currentPrayerIndex] || 0.7),
                        transform: [{ scale: sunScale }]
                    }
                ]}>
                    <SunSVG size={CELESTIAL.SUN.size} rotation={raysRotation} />
                </Animated.View>
            )}

            {showMoon && (
                <Animated.View style={[
                    styles.celestialWrapper,
                    {
                        top: moonTop,
                        left: SW * CELESTIAL.MOON.x - CELESTIAL.MOON.size / 2,
                        opacity: (CELESTIAL.MOON.factors[currentPrayerIndex] || 0.6) * mi,
                        transform: [{ translateY: moonTranslateY }]
                    }
                ]}>
                    <MoonSVG size={CELESTIAL.MOON.size} isNight={currentPrayerIndex === 4} />
                </Animated.View>
            )}

            {/* Night Depth Model: Zenith Cooling & Horizon Lift (Spec V1.0) */}
            {currentPrayerIndex === 4 && (
                <View style={[StyleSheet.absoluteFill, { zIndex: -1 }]} pointerEvents="none">
                    {/* Zenith Cooling: Darker top gradient overlay */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.22)', 'transparent']}
                        style={styles.zenithCover}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 0.3 }}
                    />
                    {/* Horizon Lift: Subtle airy glow at bottom */}
                    <LinearGradient
                        colors={['transparent', 'rgba(22, 28, 54, 0.15)']}
                        style={styles.horizonLift}
                        start={{ x: 0, y: 0.7 }}
                        end={{ x: 0, y: 1 }}
                    />
                </View>
            )}
        </View>
    );
};

const SunSVG = ({ size, rotation }: { size: number; rotation: Animated.AnimatedInterpolation<string | number> }) => {
    const center = size * 0.9;
    const innerSize = size;
    return (
        <Svg height={size * 1.8} width={size * 1.8} viewBox={`0 0 ${size * 1.8} ${size * 1.8}`}>
            <Defs>
                <RadialGradient id="sunCore" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
                    <Stop offset="0%" stopColor="#FFF5C8" stopOpacity="0.95" />
                    <Stop offset="45%" stopColor="#FFD76A" stopOpacity="0.75" />
                    <Stop offset="100%" stopColor="#FFAA00" stopOpacity="0.10" />
                </RadialGradient>
            </Defs>
            <G translate={`${size * 0.4} ${size * 0.4}`}>
                <Circle cx={innerSize / 2} cy={innerSize / 2} r={innerSize * 0.675} stroke="#FFD76A" strokeWidth="12" opacity={CELESTIAL.SUN.corona_opacity} fill="none" />
                <AnimatedG rotation={rotation} origin={`${innerSize / 2}, ${innerSize / 2}`}>
                    {[...Array(16)].map((_, i) => (
                        <Circle
                            key={i}
                            cx={innerSize / 2 + Math.cos(i * (Math.PI * 2) / 16) * (innerSize * 0.75)}
                            cy={innerSize / 2 + Math.sin(i * (Math.PI * 2) / 16) * (innerSize * 0.75)}
                            r="1.0"
                            fill="#FFD76A"
                            opacity={CELESTIAL.SUN.rays_opacity}
                        />
                    ))}
                </AnimatedG>
                <Circle cx={innerSize / 2} cy={innerSize / 2} r={innerSize / 2} fill="url(#sunCore)" />
                <Circle cx={innerSize / 2} cy={innerSize / 2} r={innerSize / 2} stroke="#FFFFFF" strokeWidth="0.8" opacity="0.15" fill="none" />
            </G>
        </Svg>
    );
};

const MoonSVG = ({ size, isNight }: { size: number; isNight?: boolean }) => {
    const center = size / 2;
    const R = center;
    const cfg = CELESTIAL.MOON;

    // crater generation
    const craters = useMemo(() => {
        return Array.from({ length: 8 }).map((_, i) => ({
            cx: center + (Math.random() * 0.6 - 0.3) * size,
            cy: center + (Math.random() * 0.6 - 0.3) * size,
            r: 0.8 + Math.random() * 1.5,
            op: 0.15 + Math.random() * 0.3
        }));
    }, [size]);

    return (
        <Svg height={size * 2} width={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`}>
            <Defs>
                {/* Lit Surface Gradient (V1.0 Master Spec) */}
                <RadialGradient id="moonLit" cx="45%" cy="45%" rx="55%" ry="55%" fx="70%" fy="30%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                    <Stop offset="65%" stopColor="#E6EBF5" stopOpacity="0.65" />
                    <Stop offset="100%" stopColor="#C8D2E6" stopOpacity="0.18" />
                </RadialGradient>

                {/* Radial Light Scatter Mask (Gamma 1.8 Physics - V1.0) */}
                <RadialGradient id="cutMaskGradientV1" cx="50%" cy="50%" rx="50%" ry="50%">
                    <Stop offset="0%" stopColor="black" stopOpacity="1" />
                    <Stop offset="88%" stopColor="black" stopOpacity="1" />
                    <Stop offset="96%" stopColor="black" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="white" stopOpacity="1" />
                </RadialGradient>

                {/* Exponential Atmospheric Glow Falloff (Spec V1.0) */}
                <RadialGradient id="moonGlowV1" cx="60%" cy="40%" rx="50%" ry="50%" fx="80%" fy="20%">
                    <Stop offset="0%" stopColor="#E6EBF5" stopOpacity={cfg.lighting.strong_glow_opacity} />
                    <Stop offset="40%" stopColor="#E6EBF5" stopOpacity={cfg.lighting.strong_glow_opacity * 0.4} />
                    <Stop offset="100%" stopColor="#E6EBF5" stopOpacity="0" />
                </RadialGradient>

                {/* Crescent Geometry Mask (V1.0 Master) */}
                <Mask id="crescentMaskV1">
                    <Circle cx={center} cy={center} r={R} fill="white" />
                    <Circle
                        cx={center - R * cfg.crescent.cut_offset_x}
                        cy={center + R * cfg.crescent.cut_offset_y}
                        r={R + 0.3}
                        fill="url(#cutMaskGradientV1)"
                    />
                </Mask>

                {/* Lit Area Mask (Intersection) */}
                <Mask id="litSideMaskV1">
                    <Rect x="0" y="0" width={size * 2} height={size * 2} fill="black" />
                    <Circle cx={center} cy={center} r={R} fill="white" mask="url(#crescentMaskV1)" />
                </Mask>
            </Defs>

            <G rotate={cfg.crescent.terminator_angle} origin={`${center}, ${center}`} translate={`${size * 0.25} ${size * 0.25}`}>
                {/* 1. Directional Atmospheric Glow (Spread 1.6 - V1.0) */}
                <Circle cx={center} cy={center} r={R * cfg.lighting.glow_spread} fill="url(#moonGlowV1)" />

                {/* 2. Earthshine / Dark Side Ambient (Fixed 0.04 - V1.0) */}
                <Circle cx={center} cy={center} r={R} fill={isNight ? "#141B33" : "#1A2242"} opacity={cfg.lighting.dark_fill_opacity} />

                {/* 3. Main Lit Crescent (Soft Light Scatter) */}
                <Circle cx={center} cy={center} r={R} fill="url(#moonLit)" mask="url(#crescentMaskV1)" />

                {/* 4. Surface Detail (Luminance Variation - V1.0) */}
                <G mask="url(#litSideMaskV1)" opacity={cfg.surface.variation_opacity}>
                    {craters.map((c, i) => (
                        <Circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="#000000" opacity={c.op} />
                    ))}
                </G>

                {/* 5. Rim Light Arc (Master Stroke) */}
                <Circle
                    cx={center} cy={center} r={R - 0.5}
                    stroke="#FFFFFF"
                    strokeWidth="1.1"
                    opacity={cfg.lighting.rim_opacity}
                    fill="none"
                    mask="url(#crescentMaskV1)"
                />
            </G>
        </Svg>
    );
};


const AnimatedG = Animated.createAnimatedComponent(G);

const styles = StyleSheet.create({
    celestialWrapper: {
        position: 'absolute',
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    zenithCover: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: SH * 0.30,
    },
    horizonLift: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: SH * 0.30,
    }
});
