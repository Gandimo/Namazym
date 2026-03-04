import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Path, Ellipse } from 'react-native-svg';
import { PrayerIndex } from './RiveAtmosphereBackground';

const { width: SW, height: SH } = Dimensions.get('window');

interface BirdsEngineProps {
    currentPrayerIndex: PrayerIndex;
    motionIntensity: number;
    reducedMotion?: boolean;
}

// ─── Configuration ───
const DECO = {
    FLOOR: 0.12,
    BASE: 0.18,
    PRAYER_FACTORS: {
        0: 0.85, // Fajr
        1: 1.10, // Dhuhr
        2: 1.00, // Asr
        3: 0.75, // Maghrib
        4: 0.65  // Isha
    } as Record<PrayerIndex, number>,
    COLORS: {
        day: "#3A3A3A",
        night: "#C8D2E6"
    }
} as const;

// 2 Groups of birds for parallax variety
const BIRD_GROUPS = {
    G1: { drift: 26, duration: 42000 },
    G2: { drift: 18, duration: 52000 }
};

const FLUTTER_CONFIG = {
    scaleY: 0.022,
    rotateZ: 0.9,
    duration: 2600
};

// V3.2 - Reduced to 6 birds for less busy sky
const BIRDS = [
    { top: 0.12, left: 0.15, variant: 'far', group: 'G1' },
    { top: 0.16, left: 0.22, variant: 'mid', group: 'G2' },
    { top: 0.20, left: 0.18, variant: 'far', group: 'G1' },
    { top: 0.15, left: 0.75, variant: 'mid', group: 'G1' },
    { top: 0.22, left: 0.82, variant: 'near', group: 'G2' },
    { top: 0.10, left: 0.45, variant: 'far', group: 'G1' }
] as const;

const VARIANTS = {
    far: 0.85,
    mid: 1.0,
    near: 1.12
};

export const BirdsEngineV2: React.FC<BirdsEngineProps> = ({
    currentPrayerIndex,
    motionIntensity,
    reducedMotion = false
}) => {
    // ── V3.1 Final Lock ──
    // mi only affects opacity floor. Drift and flutter MUST stay alive (not multiplied by mi).
    const mi = reducedMotion ? 0 : motionIntensity;
    const isNight = currentPrayerIndex >= 3;
    const color = isNight ? DECO.COLORS.night : DECO.COLORS.day;
    const pf = DECO.PRAYER_FACTORS[currentPrayerIndex];

    // Formula: Math.max(FLOOR, motionIntensity * (BASE * PRAYER_FACTOR))
    const targetOpacity = Math.max(DECO.FLOOR, mi * (DECO.BASE * pf));

    // ─── Animated Values ───
    const opacityA = useRef(new Animated.Value(targetOpacity)).current;
    const driftG1 = useRef(new Animated.Value(0)).current;
    const driftG2 = useRef(new Animated.Value(0)).current;
    const flutterA = useRef(new Animated.Value(0)).current;

    // ─── Animations ───
    useEffect(() => {
        Animated.timing(opacityA, {
            toValue: targetOpacity,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
        }).start();
    }, [targetOpacity]);

    useEffect(() => {
        if (reducedMotion) return;

        // V3.1: Initialize with random phase offset
        driftG1.setValue((Math.random() * 2 - 1) * BIRD_GROUPS.G1.drift);
        driftG2.setValue((Math.random() * 2 - 1) * BIRD_GROUPS.G2.drift);

        // Drift loops (Linear for predictable continuous glide)
        const loopG1 = Animated.loop(
            Animated.sequence([
                Animated.timing(driftG1, { toValue: BIRD_GROUPS.G1.drift, duration: BIRD_GROUPS.G1.duration, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(driftG1, { toValue: -BIRD_GROUPS.G1.drift, duration: BIRD_GROUPS.G1.duration, easing: Easing.linear, useNativeDriver: true })
            ])
        );

        const loopG2 = Animated.loop(
            Animated.sequence([
                Animated.timing(driftG2, { toValue: BIRD_GROUPS.G2.drift, duration: BIRD_GROUPS.G2.duration, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(driftG2, { toValue: -BIRD_GROUPS.G2.drift, duration: BIRD_GROUPS.G2.duration, easing: Easing.linear, useNativeDriver: true })
            ])
        );

        // Micro-Flutter (Symmetrical sine pulse)
        const loopFlutter = Animated.loop(
            Animated.sequence([
                Animated.timing(flutterA, { toValue: 1, duration: FLUTTER_CONFIG.duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(flutterA, { toValue: 0, duration: FLUTTER_CONFIG.duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
            ])
        );

        loopG1.start();
        loopG2.start();
        loopFlutter.start();

        return () => {
            loopG1.stop();
            loopG2.stop();
            loopFlutter.stop();
        };
    }, [reducedMotion]);

    const flutterScaleY = flutterA.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1 - FLUTTER_CONFIG.scaleY]
    });

    const flutterRotate = flutterA.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', `${FLUTTER_CONFIG.rotateZ}deg`]
    });

    return (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityA }]} pointerEvents="none">
            {BIRDS.map((bird, i) => {
                const drift = bird.group === 'G1' ? driftG1 : driftG2;
                return (
                    <Animated.View
                        key={i}
                        style={[
                            styles.birdContainer,
                            {
                                top: `${bird.top * 100}%` as any,
                                left: `${bird.left * 100}%` as any,
                                transform: [
                                    { scale: VARIANTS[bird.variant] },
                                    { translateX: drift },
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
        </Animated.View>
    );
};

const BirdSilhouette = ({ color }: { color: string }) => {
    return (
        <View style={styles.birdSvgWrap}>
            <Svg height="14" width="24" viewBox="0 0 24 14">
                {/* Body: Oval centered at 12, 7 */}
                <Ellipse cx="12" cy="7" rx="1.1" ry="0.6" fill={color} opacity={0.55} />

                {/* Left Wing */}
                <Path
                    d="M 12 7 Q 6 3 2 7"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeOpacity={0.9}
                />

                {/* Right Wing */}
                <Path
                    d="M 12 7 Q 18 3 22 7"
                    fill="none"
                    stroke={color}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeOpacity={0.9}
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
