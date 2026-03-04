import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import { PrayerIndex } from './RiveAtmosphereBackground';

const { width: SW, height: SH } = Dimensions.get('window');

interface BirdsEngineProps {
    currentPrayerIndex: PrayerIndex;
    motionIntensity: number;
    transitionStep?: Animated.Value;
    reducedMotion?: boolean;
}

// ─── ATMOS_V3.3 SOUL PATCH Config ───
const DECO = {
    FLOOR: 0.10,
    BASE: 0.14,
    PRAYER_FACTORS: {
        0: 0.95, // Fajr
        1: 1.10, // Dhuhr
        2: 1.05, // Asr
        3: 0.85, // Maghrib
        4: 0.65  // Isha
    } as Record<PrayerIndex, number>,
    COLORS: {
        day: "#3A3A3A",
        night: "#C8D2E6"
    }
} as const;

const FLUTTER_CONFIG = {
    scaleY_range: 0.020,
    rotateZ_deg_range: 0.7,
    duration_ms: 2800,
    easing: Easing.inOut(Easing.sin)
};

const DRIFT_CONFIG = {
    amplitude_px: 14,
    vertical_sway_px: 6,
    speed_px_s: 6,
    direction_bias: 0.6, // 60% left to right bias
};

const DEPTH_MIX = {
    near: { scale: 1.05, opacity_multiplier: 1.08, blur: 0, speedFactor: 1.0 },
    far: { scale: 0.92, opacity_multiplier: 0.88, blur: 0.6, speedFactor: 0.7 }
};

// Bird template positions
const BIRD_TEMPLATES = [
    { top: 0.12, left: 0.15 },
    { top: 0.16, left: 0.22 },
    { top: 0.20, left: 0.18 },
    { top: 0.15, left: 0.75 },
    { top: 0.22, left: 0.82 },
    { top: 0.10, left: 0.45 }
];

export const BirdsEngineV3: React.FC<BirdsEngineProps> = ({
    currentPrayerIndex,
    motionIntensity,
    transitionStep,
    reducedMotion = false
}) => {
    const mi = reducedMotion ? 0 : motionIntensity;
    const isNight = currentPrayerIndex === 0 || currentPrayerIndex === 4;
    const color = isNight ? DECO.COLORS.night : DECO.COLORS.day;
    const pf = DECO.PRAYER_FACTORS[currentPrayerIndex];

    // Count rule: Reduce by 1 at Fajr, DISABLE in Isha (Spec V1.0)
    const birdCount = currentPrayerIndex === 4 ? 0 : (currentPrayerIndex === 0 ? 5 : 6);

    // Generate deterministic seeds on mount
    const birdSeeds = useMemo(() => {
        return Array.from({ length: 6 }).map((_, i) => ({
            phase: Math.random() * Math.PI * 2,
            driftPhase: Math.random() * Math.PI * 2,
            flutterPhase: Math.random() * Math.PI * 2,
            scaleBias: 0.98 + Math.random() * 0.04,
            opacityBias: 0.90 + Math.random() * 0.15,
            isFar: i % 2 === 1, // Half far, half near
            initialX: BIRD_TEMPLATES[i].left * SW,
            initialY: BIRD_TEMPLATES[i].top * SH,
        }));
    }, []);

    // Individual bird animated values for noise-based drift
    const driftXValues = useRef(birdSeeds.map(() => new Animated.Value(0))).current;
    const driftYValues = useRef(birdSeeds.map(() => new Animated.Value(0))).current;
    const flutterValues = useRef(birdSeeds.map(() => new Animated.Value(0))).current;
    const opacityA = useRef(new Animated.Value(0)).current;

    // Formula: Math.max(FLOOR, mi * (BASE * PRAYER_FACTOR)) * bias
    const baseOpacity = Math.max(DECO.FLOOR, mi * (DECO.BASE * pf));

    useEffect(() => {
        Animated.timing(opacityA, {
            toValue: 1, // Controller for bird group presence
            duration: 1200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
        }).start();
    }, []);

    useEffect(() => {
        if (reducedMotion) return;

        // Create independent loops for each bird to ensure non-synchronized movement
        const loops: Animated.CompositeAnimation[] = [];

        birdSeeds.forEach((seed, i) => {
            const depth = seed.isFar ? DEPTH_MIX.far : DEPTH_MIX.near;

            // X Drift (Primary horizontal movement)
            const xPeriod = (14000 + Math.random() * 4000) / depth.speedFactor;
            const xLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(driftXValues[i], {
                        toValue: DRIFT_CONFIG.amplitude_px,
                        duration: xPeriod / 2,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true
                    }),
                    Animated.timing(driftXValues[i], {
                        toValue: -DRIFT_CONFIG.amplitude_px,
                        duration: xPeriod / 2,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true
                    })
                ])
            );

            // Y Sway (Vertical noise-like oscillation)
            const yPeriod = 8000 + Math.random() * 3000;
            const yLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(driftYValues[i], {
                        toValue: DRIFT_CONFIG.vertical_sway_px,
                        duration: yPeriod / 2,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true
                    }),
                    Animated.timing(driftYValues[i], {
                        toValue: -DRIFT_CONFIG.vertical_sway_px,
                        duration: yPeriod / 2,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true
                    })
                ])
            );

            // Flutter (Breathing feel)
            const flutterPeriod = FLUTTER_CONFIG.duration_ms + (Math.random() * 400 - 200);
            const flutterLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(flutterValues[i], {
                        toValue: 1,
                        duration: flutterPeriod / 2,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true
                    }),
                    Animated.timing(flutterValues[i], {
                        toValue: 0,
                        duration: flutterPeriod / 2,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true
                    })
                ])
            );

            loops.push(xLoop, yLoop, flutterLoop);
        });

        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, [reducedMotion]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {birdSeeds.slice(0, birdCount).map((seed, i) => {
                const depth = seed.isFar ? DEPTH_MIX.far : DEPTH_MIX.near;

                const flutterScaleY = flutterValues[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1 - FLUTTER_CONFIG.scaleY_range]
                });

                const flutterRotate = flutterValues[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${FLUTTER_CONFIG.rotateZ_deg_range}deg`]
                });

                const driftX = Animated.add(driftXValues[i], DRIFT_CONFIG.amplitude_px * (DRIFT_CONFIG.direction_bias * 2 - 1));

                // V15: Cloud/Bird shift starts at 15s (0.166)
                const shiftMult = transitionStep ? transitionStep.interpolate({
                    inputRange: [0, 0.166, 1],
                    outputRange: [1, 1, 0.85], // Subtle fade back/shrink
                    extrapolate: 'clamp'
                }) : 1;

                const birdOpacity = baseOpacity * seed.opacityBias * depth.opacity_multiplier;

                return (
                    <Animated.View
                        key={i}
                        style={[
                            styles.birdContainer,
                            {
                                top: seed.initialY,
                                left: seed.initialX,
                                opacity: Animated.multiply(Animated.multiply(opacityA, birdOpacity), shiftMult),
                                transform: [
                                    { translateX: driftX },
                                    { translateY: driftYValues[i] },
                                    { scale: Animated.multiply(seed.scaleBias * depth.scale, shiftMult) },
                                    { scaleY: flutterScaleY },
                                    { rotateZ: flutterRotate }
                                ]
                            }
                        ]}
                    >
                        <BirdSilhouette color={color} />
                    </Animated.View>
                );
            })}
        </View>
    );
};

const BirdSilhouette = ({ color }: { color: string }) => {
    return (
        <View style={styles.birdSvgWrap}>
            <Svg height="14" width="24" viewBox="0 0 24 14">
                <Ellipse cx="12" cy="7" rx="1.1" ry="0.6" fill={color} opacity={0.55} />
                <Path
                    d="M 12 7 Q 6 3 2 7"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeOpacity={0.8}
                />
                <Path
                    d="M 12 7 Q 18 3 22 7"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeOpacity={0.8}
                />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    birdContainer: {
        position: 'absolute',
        width: 24,
        height: 14,
    },
    birdSvgWrap: {
        width: 24,
        height: 14,
    }
});
