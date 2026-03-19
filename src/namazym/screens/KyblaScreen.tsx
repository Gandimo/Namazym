import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    Platform,
    Pressable
} from 'react-native';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import Svg, { Rect, Circle, Line, Path, G, Text as SvgText, Defs, Pattern, Polygon } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Internal Services & V2 Hooks
import { useQiblaLocation } from '../hooks/useQiblaLocation';
import { useQiblaBearing } from '../hooks/useQiblaBearing';
import { useSensorHeading } from '../hooks/useSensorHeading';
import { useQiblaState } from '../hooks/useQiblaState';
import { angularDifference } from '../utils/kyblaUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPASS_SIZE = SCREEN_WIDTH * 0.75;

// Premium Color Palette
const C = {
    bgTop: '#1A1A1E',
    bgBot: '#0D0D0F',
    compass: '#141416',
    gold: '#D4AF37',
    goldBright: '#FFDF73',
    goldDim: 'rgba(212, 175, 55, 0.4)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    amber: '#FFB300',
    green: '#43A047',
    needle: '#E53935',
    glassBg: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
};

export default function KyblaScreen({ navigation }: any) {
    const { t } = useTranslation();

    // V2 Architecture Hooks
    const { lat, lon } = useQiblaLocation();
    const { bearing, distanceKm } = useQiblaBearing(lat, lon);
    const { rawHeading, heading, headingUnwrapped, stability, tiltDeg, sampleCount } = useSensorHeading();

    // Calculate angular difference continuously
    const diff = useMemo(() => {
        if (bearing === null) return 0;
        return Math.abs(angularDifference(heading, bearing));
    }, [heading, bearing]);

    // Qibla State Machine & Haptics
    const { state, stateInfo } = useQiblaState({
        heading,
        bearing: bearing || 0,
        stability,
        tiltDeg,
        sampleCount
    });

    // Animations Setup
    const rotAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const badgeAnim = useRef(new Animated.Value(0)).current;
    const arrowGlowAnim = useRef(new Animated.Value(0)).current;

    // 1. Compass Rotation (smooth timing)
    useEffect(() => {
        Animated.timing(rotAnim, {
            toValue: headingUnwrapped,
            duration: 180,
            useNativeDriver: true,
        }).start();
    }, [headingUnwrapped, rotAnim]);

    // 2. Pulse, Glow, and Badge transitions based on State
    useEffect(() => {
        const isAligned = state === 'aligned' || state === 'perfect';

        // Compass pulse (gentle scale adjustment)
        Animated.spring(pulseAnim, {
            toValue: isAligned ? 1.05 : 1.0,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
        }).start();

        // Target highlight glow timing
        Animated.timing(glowAnim, {
            toValue: isAligned ? 1 : 0,
            duration: 600,
            useNativeDriver: true,
        }).start();

        // ARROW TIP PULSE LOOP — Refined logic
        // SPEC: scale [1.0, 1.05, 1.0], opacity [0.2, 0.45, 0.2], duration 2000ms
        if (isAligned) {
            arrowGlowAnim.setValue(0);
            Animated.loop(
                Animated.timing(arrowGlowAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            arrowGlowAnim.stopAnimation();
            arrowGlowAnim.setValue(0);
        }

        // Badge entry animation
        badgeAnim.setValue(0);
        Animated.timing(badgeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

    }, [state, pulseAnim, glowAnim, badgeAnim, arrowGlowAnim]);

    // INTERPOLATIONS
    const rotateStr = rotAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '-360deg']
    });

    // The Qibla bearing needs to rotate *opposite* to the compass dial 
    // to stay pointing at Mecca in worldly space
    const bearingRotStr = rotAnim.interpolate({
        inputRange: [0, 360],
        outputRange: [`${bearing}deg`, `${bearing - 360}deg`]
    });

    const isAligned = state === 'aligned' || state === 'perfect';

    // ── STATE-BASED ALIGNMENT RING FEEDBACK ──
    // Spec: far(0.0), near(0.25), aligned(0.7), perfect(1.0)
    const ringOpacity = useMemo(() => {
        if (state === 'perfect') return 1.0;
        if (state === 'aligned') return 0.7;
        if (state === 'near') return 0.25;
        return 0;
    }, [state]);

    // Spec: far/near(1.0), aligned(1.04), perfect(1.08)
    const ringScale = useMemo(() => {
        if (state === 'perfect') return 1.08;
        if (state === 'aligned') return 1.04;
        return 1.0;
    }, [state]);

    // ── STATE-BASED TARGET VISIBILITY ──
    // Spec: far(0.85), near(0.9), aligned(0.95), perfect(1.0)
    const targetOpacity = useMemo(() => {
        if (state === 'perfect') return 1.0;
        if (state === 'aligned') return 0.95;
        if (state === 'near') return 0.9;
        return 0.85;
    }, [state]);

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[C.bgTop, C.bgBot]} style={StyleSheet.absoluteFill} />

            {/* Background Pattern */}
            <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
                <Svg width="100%" height="100%">
                    <Defs>
                        <Pattern id="tile" x="0" y="0" width="58" height="58" patternUnits="userSpaceOnUse">
                            <Polygon
                                points="29,4 33,20 49,20 36,30 41,46 29,36 17,46 22,30 9,20 25,20"
                                fill="none" stroke={C.gold} strokeWidth="0.5" opacity="0.12"
                            />
                            <Circle cx="29" cy="29" r="9" fill="none" stroke={C.gold} strokeWidth="0.35" opacity="0.08" />
                        </Pattern>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#tile)" />
                </Svg>
            </View>

            <SafeAreaView style={s.safe}>

                {/* header */}
                <View style={s.header}>
                    <Pressable onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
                        <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
                    </Pressable>
                    <View style={s.headerCenter}>
                        <Text style={s.title}>{t('common.kybla', 'KYBLA').toUpperCase()}</Text>
                        {!!t('qibla.compass') && (
                            <Text style={s.subtitle}>{t('qibla.compass')}</Text>
                        )}
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* status badge */}
                <Animated.View style={[s.badge, { opacity: badgeAnim }]}>
                    <View style={[s.badgeDot, { backgroundColor: stateInfo.color }]} />
                    <Text style={[s.badgeText, { color: stateInfo.color }]}>
                        {t(stateInfo.label)}
                    </Text>
                </Animated.View>

                {/* compass area */}
                <View style={s.compassArea}>

                    {/* background success glow */}
                    <Animated.View
                        style={[s.glowRing, {
                            opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }),
                            borderColor: C.goldBright,
                            shadowColor: C.goldBright,
                        }]}
                    />

                    {/* scale wrapper */}
                    <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center', justifyContent: 'center' }}>
                        <View style={s.compassShadow}>

                            {/* KAABA TARGET (Fixed Top) */}
                            <Animated.View style={{
                                position: 'absolute',
                                top: -38, // Fixed above the center mass
                                zIndex: 30,
                                alignItems: 'center',
                                opacity: targetOpacity,
                            }}>
                                <Svg width="28" height="28" viewBox="0 0 24 24">
                                    {/* Minimal Kaaba Projection */}
                                    <Rect x="5" y="6" width="14" height="14" rx="1.5" fill="#18181B" stroke={C.gold} strokeWidth="0.5" strokeOpacity="0.4" />
                                    {/* Gold Band (Kiswa detail) */}
                                    <Rect x="5" y="8.8" width="14" height="1.8" fill={C.gold} />
                                    <Rect x="5" y="11.2" width="14" height="0.4" fill={C.gold} opacity="0.4" />
                                </Svg>

                                {/* ALIGNMENT RING */}
                                <View style={{
                                    position: 'absolute',
                                    top: -10,
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    borderWidth: 1.2,
                                    borderColor: C.gold,
                                    opacity: ringOpacity,
                                    transform: [{ scale: ringScale }],
                                    zIndex: -1
                                }} />

                                {/* Internal Glow (Perfect) */}
                                <Animated.View style={{
                                    position: 'absolute',
                                    top: -10,
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    backgroundColor: C.gold,
                                    opacity: state === 'perfect' ? 0.12 : 0,
                                    zIndex: -2
                                }} />
                            </Animated.View>

                            {/* Rotating Dial */}
                            <Animated.View style={[s.disc, { transform: [{ rotate: rotateStr }] }]}>
                                <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 100 100">
                                    {/* Dial Surface */}
                                    <Circle cx="50" cy="50" r="48" fill={C.compass} stroke={C.gold} strokeWidth="0.5" />

                                    {/* Degree ticks */}
                                    {Array.from({ length: 72 }).map((_, i) => {
                                        const major = i % 18 === 0;
                                        const mid = i % 9 === 0;
                                        return (
                                            <Line key={i}
                                                x1="50" y1="2"
                                                x2="50" y2={major ? '10' : mid ? '7' : '4.5'}
                                                stroke={major || mid ? C.gold : C.goldDim}
                                                strokeWidth={major ? '0.7' : mid ? '0.4' : '0.2'}
                                                transform={`rotate(${i * 5} 50 50)`}
                                            />
                                        );
                                    })}

                                    {/* Cardinal Points */}
                                    <SvgText x="50" y="14" textAnchor="middle" fontSize="6.5" fontWeight="900" fill={C.needle}>N</SvgText>
                                    <SvgText x="50" y="93" textAnchor="middle" fontSize="4.5" fontWeight="700" fill={C.textMuted}>S</SvgText>
                                    <SvgText x="89" y="52" textAnchor="middle" fontSize="4.5" fontWeight="700" fill={C.textMuted}>E</SvgText>
                                    <SvgText x="11" y="52" textAnchor="middle" fontSize="4.5" fontWeight="700" fill={C.textMuted}>W</SvgText>
                                </Svg>
                            </Animated.View>

                            {/* Rotating Arrow */}
                            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, { transform: [{ rotate: bearingRotStr }] }]} pointerEvents="none">
                                <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 100 100">
                                    {/* Arrow Stem */}
                                    <Line x1="50" y1="50" x2="50" y2="13" stroke={C.gold} strokeWidth="1.5" />
                                    {/* Arrow Head */}
                                    <Path d="M46,16 L54,16 L50,8 Z" fill={C.gold} />
                                </Svg>

                                {/* Arrow Tip Pulse */}
                                <Animated.View style={{
                                    position: 'absolute',
                                    top: (COMPASS_SIZE * 0.08) - 4, // Exactly over arrow tip
                                    width: 16,
                                    height: 16,
                                    borderRadius: 8,
                                    backgroundColor: C.goldBright,
                                    opacity: arrowGlowAnim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [0.2, 0.45, 0.2]
                                    }),
                                    transform: [{
                                        scale: arrowGlowAnim.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: [1.0, 1.05, 1.0]
                                        })
                                    }]
                                }} />

                                {/* Arrow Tip Core Dot */}
                                <View style={{
                                    position: 'absolute',
                                    top: (COMPASS_SIZE * 0.08) + 2,
                                    width: 5,
                                    height: 5,
                                    borderRadius: 2.5,
                                    backgroundColor: C.goldBright,
                                    opacity: state === 'perfect' ? 1.0 : (isAligned ? 0.7 : 0),
                                }} />
                            </Animated.View>

                            {/* Pivot */}
                            <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
                                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'white', borderWidth: 1, borderColor: C.gold }} />
                                <View style={{ position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold }} />
                            </View>

                        </View>
                    </Animated.View>
                </View>

                {/* info card */}
                <View style={[s.card, isAligned && s.cardAligned]}>
                    <View style={s.infoRow}>
                        <View style={s.infoCell}>
                            <Text style={s.infoLabel}>{t('qibla.heading', 'Ugur')}</Text>
                            <Text style={s.infoValue}>{Math.round(heading)}°</Text>
                        </View>
                        <View style={s.vDiv} />
                        <View style={s.infoCell}>
                            <Text style={s.infoLabel}>{t('qibla.bearing', 'Kybla ugry')}</Text>
                            <Text style={[s.infoValue, { color: C.gold }]}>{Math.round(bearing || 0)}°</Text>
                        </View>
                    </View>

                    {/* Sensor Stability Gauge */}
                    <View style={s.stabRow}>
                        <View style={s.stabBar}>
                            <View style={[s.stabFill, {
                                width: `${Math.round(stability * 100)}%` as any,
                                backgroundColor: stateInfo.isStable ? C.green : C.amber,
                            }]} />
                        </View>
                        <Text style={s.stabText}>
                            {t('qibla.sensor', 'Sensor')}: {stateInfo.isStable ? t('qibla.stable', 'Durnukly') : t('qibla.measuring', 'Ölcenýär...')}
                        </Text>
                    </View>
                </View>

            </SafeAreaView>
        </View>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: C.bgTop,
    },
    safe: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    headerCenter: {
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: C.textPrimary,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 12,
        color: C.gold,
        marginTop: 2,
        fontWeight: '500',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: C.glassBg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: C.glassBorder,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.glassBorder,
        marginTop: 20,
    },
    badgeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    compassArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    compassShadow: {
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
        borderRadius: COMPASS_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        backgroundColor: C.compass,
    },
    disc: {
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
        borderRadius: COMPASS_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowRing: {
        position: 'absolute',
        width: COMPASS_SIZE + 32,
        height: COMPASS_SIZE + 32,
        borderRadius: (COMPASS_SIZE + 32) / 2,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 15,
        pointerEvents: 'none',
    },
    card: {
        width: SCREEN_WIDTH - 48,
        backgroundColor: 'rgba(20,20,22,0.90)',
        borderRadius: 20,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        marginBottom: Platform.OS === 'ios' ? 10 : 30,
    },
    cardAligned: {
        borderColor: 'rgba(67, 160, 71, 0.4)',
        backgroundColor: 'rgba(20,28,22,0.9)',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoCell: {
        alignItems: 'center',
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: C.textMuted,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    infoValue: {
        fontSize: 22,
        fontWeight: '300',
        color: C.textPrimary,
        letterSpacing: 0.5,
    },
    vDiv: {
        width: 1,
        height: 30,
        backgroundColor: C.glassBorder,
    },
    stabRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: C.glassBorder,
    },
    stabBar: {
        width: 100,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        marginRight: 10,
        overflow: 'hidden',
    },
    stabFill: {
        height: '100%',
        borderRadius: 2,
    },
    stabText: {
        fontSize: 11,
        color: C.textSecondary,
        fontWeight: '500',
    },
});
