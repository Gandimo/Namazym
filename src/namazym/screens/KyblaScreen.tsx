import React, { useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    StatusBar,
    Platform,
    Pressable,
    useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
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
import { getBoundedContentWidth, getResponsiveLayoutMetrics } from '../utils/responsiveLayout';

// Sacred Precision Palette
const C = {
    bgTop: '#171310',
    bgBot: '#090807',
    atmosphere: '#231c16',
    compass: '#12100E',
    ring: '#2B241D',
    gold: '#C5A265',
    goldBright: '#E3C58D',
    goldDim: 'rgba(197, 162, 101, 0.36)',
    goldWash: 'rgba(197, 162, 101, 0.10)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 250, 242, 0.72)',
    textMuted: 'rgba(255, 250, 242, 0.42)',
    amber: '#B98D48',
    green: '#77906C',
    accentSoft: 'rgba(255,255,255,0.06)',
    glassBg: 'rgba(255, 250, 242, 0.05)',
    glassBorder: 'rgba(255, 250, 242, 0.10)',
};

export default function KyblaScreen({ navigation }: any) {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const responsiveLayout = useMemo(() => getResponsiveLayoutMetrics(width), [width]);
    const contentWidth = useMemo(
        () => getBoundedContentWidth(width, responsiveLayout.horizontalPadding, responsiveLayout.compactContentMaxWidth),
        [responsiveLayout.compactContentMaxWidth, responsiveLayout.horizontalPadding, width],
    );
    const compassSize = useMemo(
        () => Math.min(
            responsiveLayout.isTablet ? contentWidth * 0.62 : width * 0.75,
            responsiveLayout.isTablet ? 420 : 360,
        ),
        [contentWidth, responsiveLayout.isTablet, width],
    );
    const instrumentSize = compassSize + 28;
    const infoCardWidth = Math.min(contentWidth, responsiveLayout.isTablet ? 720 : width - 48);
    const sceneAuraSize = compassSize + (responsiveLayout.isTablet ? 168 : 140);
    const sceneHaloSize = compassSize + (responsiveLayout.isTablet ? 92 : 72);
    const sceneHaloInnerSize = compassSize + (responsiveLayout.isTablet ? 34 : 22);

    // V2 Architecture Hooks
    const { lat, lon, cityLabel } = useQiblaLocation();
    const { bearing, distanceKm } = useQiblaBearing(lat, lon);
    const { heading, headingUnwrapped, stability, tiltDeg, sampleCount } = useSensorHeading();

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
    const breatheAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const badgeAnim = useRef(new Animated.Value(0)).current;
    const arrowGlowAnim = useRef(new Animated.Value(0)).current;
    const lockAnim = useRef(new Animated.Value(1)).current;
    const reachedLabelAnim = useRef(new Animated.Value(0)).current;
    const prevStateRef = useRef(state);
    const reachedLabelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, {
                    toValue: 1,
                    duration: 3200,
                    useNativeDriver: true,
                }),
                Animated.timing(breatheAnim, {
                    toValue: 0,
                    duration: 3200,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [breatheAnim]);

    useEffect(() => {
        const prevState = prevStateRef.current;

        if (state === 'perfect' && prevState !== 'perfect') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            if (reachedLabelTimerRef.current) {
                clearTimeout(reachedLabelTimerRef.current);
                reachedLabelTimerRef.current = null;
            }

            lockAnim.setValue(1);
            Animated.sequence([
                Animated.timing(lockAnim, {
                    toValue: 1.014,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(lockAnim, {
                    toValue: 1.008,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]).start();

            Animated.timing(reachedLabelAnim, {
                toValue: 1,
                duration: 260,
                useNativeDriver: true,
            }).start();

            reachedLabelTimerRef.current = setTimeout(() => {
                Animated.timing(reachedLabelAnim, {
                    toValue: 0,
                    duration: 320,
                    useNativeDriver: true,
                }).start();
                reachedLabelTimerRef.current = null;
            }, 1500);
        } else if (state !== 'perfect' && prevState === 'perfect') {
            if (reachedLabelTimerRef.current) {
                clearTimeout(reachedLabelTimerRef.current);
                reachedLabelTimerRef.current = null;
            }
            Animated.timing(reachedLabelAnim, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }).start();
            Animated.timing(lockAnim, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }).start();
        }

        prevStateRef.current = state;
    }, [state, lockAnim, reachedLabelAnim]);

    useEffect(() => {
        return () => {
            if (reachedLabelTimerRef.current) {
                clearTimeout(reachedLabelTimerRef.current);
            }
        };
    }, []);

    // 1. Compass Rotation (smooth timing)
    useEffect(() => {
        Animated.timing(rotAnim, {
            toValue: headingUnwrapped,
            duration: 110,
            useNativeDriver: true,
        }).start();
    }, [headingUnwrapped, rotAnim]);

    // 2. Pulse, Glow, and Badge transitions based on State
    useEffect(() => {
        const targetScale =
            state === 'perfect' ? 1.022 :
                state === 'aligned' ? 1.014 :
                    state === 'near' ? 1.006 :
                        1.0;

        // Compass pulse (gentle scale adjustment)
        Animated.spring(pulseAnim, {
            toValue: targetScale,
            friction: 9,
            tension: 54,
            useNativeDriver: true,
        }).start();

        // Target highlight glow timing
        Animated.timing(glowAnim, {
            toValue: state === 'perfect' ? 1 : state === 'aligned' ? 0.62 : state === 'near' ? 0.28 : 0,
            duration: 700,
            useNativeDriver: true,
        }).start();

        if (state === 'perfect') {
            arrowGlowAnim.setValue(0);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(arrowGlowAnim, {
                        toValue: 1,
                        duration: 2400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(arrowGlowAnim, {
                        toValue: 0,
                        duration: 2400,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else if (state === 'aligned') {
            Animated.timing(arrowGlowAnim, {
                toValue: 0.55,
                duration: 500,
                useNativeDriver: true,
            }).start();
        } else if (state === 'near') {
            Animated.timing(arrowGlowAnim, {
                toValue: 0.22,
                duration: 500,
                useNativeDriver: true,
            }).start();
        } else {
            arrowGlowAnim.stopAnimation();
            Animated.timing(arrowGlowAnim, {
                toValue: 0,
                duration: 350,
                useNativeDriver: true,
            }).start();
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
        if (state === 'aligned') return 0.58;
        if (state === 'near') return 0.18;
        return 0;
    }, [state]);

    // Spec: far/near(1.0), aligned(1.04), perfect(1.08)
    const ringScale = useMemo(() => {
        if (state === 'perfect') return 1.04;
        if (state === 'aligned') return 1.02;
        if (state === 'near') return 1.008;
        return 1.0;
    }, [state]);

    const ringBorderWidth = useMemo(() => {
        if (state === 'perfect') return 1.5;
        if (state === 'aligned') return 1.25;
        if (state === 'near') return 1.1;
        return 1;
    }, [state]);

    // ── STATE-BASED TARGET VISIBILITY ──
    // Spec: far(0.85), near(0.9), aligned(0.95), perfect(1.0)
    const targetOpacity = useMemo(() => {
        if (state === 'perfect') return 1.0;
        if (state === 'aligned') return 0.95;
        if (state === 'near') return 0.9;
        return 0.85;
    }, [state]);

    const sceneGlowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.02, 0.12],
    });

    const tipGlowOpacity = arrowGlowAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.02, 0.10, 0.16],
    });

    const tipGlowScale = arrowGlowAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1.0, 1.015, 1.03],
    });

    const idleBreathScale = breatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.006],
    });

    const offlineMeta = useMemo(() => {
        if (distanceKm > 0) return `${cityLabel} · ${distanceKm} km`;
        return cityLabel;
    }, [cityLabel, distanceKm]);

    const compassSceneScale = Animated.multiply(pulseAnim, lockAnim);

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[C.bgTop, C.bgBot]} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={s.safe}>

                {/* header */}
                <View style={[s.header, { width: contentWidth }]}>
                    <Pressable onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
                        <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
                    </Pressable>
                    <View style={s.headerCenter}>
                        <Text style={s.title}>{t('common.kybla', 'KYBLA').toUpperCase()}</Text>
                        <Text style={s.subtitle}>{offlineMeta}</Text>
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
                <View style={[s.compassArea, { width: contentWidth }]}>
                    <Animated.View
                        style={[
                            s.sceneAura,
                            {
                                width: sceneAuraSize,
                                height: sceneAuraSize,
                                borderRadius: sceneAuraSize / 2,
                                opacity: sceneGlowOpacity,
                            }
                        ]}
                    />
                    <View
                        style={[
                            s.sceneHalo,
                            {
                                width: sceneHaloSize,
                                height: sceneHaloSize,
                                borderRadius: sceneHaloSize / 2,
                            }
                        ]}
                    />
                    <View
                        style={[
                            s.sceneHaloInner,
                            {
                                width: sceneHaloInnerSize,
                                height: sceneHaloInnerSize,
                                borderRadius: sceneHaloInnerSize / 2,
                            }
                        ]}
                    />

                    <Animated.View style={[s.targetBlock, { opacity: targetOpacity, transform: [{ scale: idleBreathScale }] }]}>
                        <View style={[s.targetRing, isAligned && s.targetRingAligned]} />
                        <View style={[s.targetPill, state === 'perfect' && s.targetPillPerfect]}>
                            <View style={s.kaabaMark}>
                                <View style={s.kaabaBand} />
                            </View>
                            <Text style={s.targetLabel}>Kybla</Text>
                        </View>
                    </Animated.View>

                    {/* scale wrapper */}
                    <Animated.View style={{ transform: [{ scale: compassSceneScale }] as any, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={[s.instrumentFrame, { width: instrumentSize, height: instrumentSize, borderRadius: instrumentSize / 2 }]}>
                            <Animated.View
                                style={[
                                    s.alignmentRing,
                                    {
                                        width: instrumentSize,
                                        height: instrumentSize,
                                        borderRadius: instrumentSize / 2,
                                        opacity: ringOpacity,
                                        borderWidth: ringBorderWidth,
                                        transform: [{ scale: ringScale }],
                                    },
                                ]}
                            />

                            <View style={[s.compassShadow, { width: compassSize, height: compassSize, borderRadius: compassSize / 2 }]}>

                            {/* Rotating Dial */}
                            <Animated.View style={[s.disc, { width: compassSize, height: compassSize, borderRadius: compassSize / 2, transform: [{ rotate: rotateStr }] }]}>
                                <Svg width={compassSize} height={compassSize} viewBox="0 0 100 100">
                                    <Circle cx="50" cy="50" r="49" fill={C.ring} opacity="0.9" />
                                    <Circle cx="50" cy="50" r="46.8" fill={C.compass} stroke={C.glassBorder} strokeWidth="0.4" />
                                    <Circle cx="50" cy="50" r="37.5" fill="none" stroke={C.goldDim} strokeWidth="0.18" opacity="0.55" />

                                    {/* Degree ticks */}
                                    {Array.from({ length: 72 }).map((_, i) => {
                                        const major = i % 18 === 0;
                                        const mid = i % 9 === 0;
                                        return (
                                            <Line key={i}
                                                x1="50" y1="2"
                                                x2="50" y2={major ? '9.4' : mid ? '6.6' : '4.7'}
                                                stroke={major || mid ? C.gold : C.goldDim}
                                                strokeWidth={major ? '0.62' : mid ? '0.34' : '0.16'}
                                                transform={`rotate(${i * 5} 50 50)`}
                                            />
                                        );
                                    })}

                                    {/* Cardinal Points */}
                                    <SvgText x="50" y="14.5" textAnchor="middle" fontSize="6.2" fontWeight="800" fill={C.goldBright}>N</SvgText>
                                    <SvgText x="50" y="91.8" textAnchor="middle" fontSize="4.1" fontWeight="700" fill={C.textMuted}>S</SvgText>
                                    <SvgText x="87.8" y="51.8" textAnchor="middle" fontSize="4.1" fontWeight="700" fill={C.textMuted}>E</SvgText>
                                    <SvgText x="12.2" y="51.8" textAnchor="middle" fontSize="4.1" fontWeight="700" fill={C.textMuted}>W</SvgText>
                                </Svg>
                            </Animated.View>

                            {/* Rotating Arrow */}
                            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, { transform: [{ rotate: bearingRotStr }] }]} pointerEvents="none">
                                <Svg width={compassSize} height={compassSize} viewBox="0 0 100 100">
                                    <Line x1="50" y1="55" x2="50" y2="18" stroke={C.gold} strokeWidth="0.9" opacity="0.92" />
                                    <Path d="M50 11 L55.4 22.4 L52.4 22.4 L52.4 54 L47.6 54 L47.6 22.4 L44.6 22.4 Z" fill={C.goldBright} />
                                    <Path d="M50 63 L53.2 58.8 L50 54.6 L46.8 58.8 Z" fill={C.goldDim} />
                                </Svg>

                                <Animated.View
                                    style={[
                                        s.tipAura,
                                        {
                                            top: (compassSize * 0.11) - 5,
                                            opacity: tipGlowOpacity,
                                            transform: [{ scale: tipGlowScale }],
                                        }
                                    ]}
                                />
                                <View
                                    style={[
                                        s.tipCore,
                                        {
                                            top: (compassSize * 0.11) - 1,
                                            opacity: state === 'perfect' ? 1 : state === 'aligned' ? 0.62 : state === 'near' ? 0.3 : 0.14,
                                        }
                                    ]}
                                />
                            </Animated.View>

                            {/* Pivot */}
                            <View style={s.pivotWrap}>
                                <View style={s.pivotOuter} />
                                <View style={s.pivotInner} />
                            </View>

                        </View>
                        </View>
                    </Animated.View>

                    <Animated.Text
                        style={[
                            s.reachedLabel,
                            {
                                opacity: reachedLabelAnim,
                                transform: [{
                                    translateY: reachedLabelAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [4, 0],
                                    }),
                                }],
                            },
                        ]}
                    >
                        Kybla tapyldy
                    </Animated.Text>
                </View>

                {/* info card */}
                <View style={[s.card, { width: infoCardWidth }, isAligned && s.cardAligned]}>
                    <View style={s.infoTopRow}>
                        <View style={s.infoTopStatus}>
                            <View style={[s.infoTopDot, { backgroundColor: stateInfo.color }]} />
                            <Text style={s.infoTopLabel}>{t(stateInfo.label)}</Text>
                        </View>
                        <Text style={s.infoTopMeta}>{offlineMeta}</Text>
                    </View>

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
        letterSpacing: 2.2,
    },
    subtitle: {
        fontSize: 12,
        color: C.textSecondary,
        marginTop: 4,
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
        backgroundColor: 'rgba(255,250,242,0.045)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: C.glassBorder,
        marginTop: 16,
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
    },
    sceneAura: {
        position: 'absolute',
        backgroundColor: C.goldWash,
    },
    sceneHalo: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: 'rgba(255,250,242,0.045)',
    },
    sceneHaloInner: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: 'rgba(197, 162, 101, 0.10)',
    },
    targetBlock: {
        position: 'absolute',
        top: 36,
        alignItems: 'center',
        zIndex: 20,
    },
    targetRing: {
        position: 'absolute',
        top: -8,
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 1,
        borderColor: 'rgba(197, 162, 101, 0.16)',
    },
    targetRingAligned: {
        borderColor: 'rgba(197, 162, 101, 0.28)',
    },
    targetPill: {
        minWidth: 94,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(18,16,14,0.92)',
        borderWidth: 1,
        borderColor: 'rgba(255,250,242,0.08)',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 5,
    },
    targetPillPerfect: {
        backgroundColor: 'rgba(23,19,15,0.98)',
        borderColor: 'rgba(197, 162, 101, 0.18)',
    },
    kaabaMark: {
        width: 18,
        height: 18,
        borderRadius: 4,
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: 'rgba(197, 162, 101, 0.28)',
        marginBottom: 7,
        overflow: 'hidden',
    },
    kaabaBand: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 5,
        height: 3,
        backgroundColor: C.gold,
    },
    targetLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        color: C.textSecondary,
    },
    instrumentFrame: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    alignmentRing: {
        position: 'absolute',
        borderWidth: 1.2,
        borderColor: 'rgba(197, 162, 101, 0.42)',
    },
    compassShadow: {
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.30,
        shadowRadius: 24,
        elevation: 10,
        backgroundColor: C.compass,
    },
    disc: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'rgba(18,16,14,0.92)',
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        marginBottom: Platform.OS === 'ios' ? 10 : 30,
    },
    cardAligned: {
        borderColor: 'rgba(197, 162, 101, 0.22)',
        backgroundColor: 'rgba(23,19,15,0.94)',
    },
    infoTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    infoTopStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoTopDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginRight: 8,
    },
    infoTopLabel: {
        fontSize: 11,
        color: C.textSecondary,
        fontWeight: '700',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    infoTopMeta: {
        fontSize: 11,
        color: C.textMuted,
        fontWeight: '500',
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
        fontSize: 11,
        color: C.textMuted,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.9,
    },
    infoValue: {
        fontSize: 24,
        fontWeight: '400',
        color: C.textPrimary,
        letterSpacing: 0.2,
    },
    vDiv: {
        width: 1,
        height: 34,
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
        height: 3,
        backgroundColor: C.accentSoft,
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
    pivotWrap: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pivotOuter: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#F7F3EA',
        borderWidth: 1,
        borderColor: 'rgba(197, 162, 101, 0.34)',
    },
    pivotInner: {
        position: 'absolute',
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: C.gold,
    },
    tipAura: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: C.goldBright,
    },
    tipCore: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: C.goldBright,
    },
    reachedLabel: {
        position: 'absolute',
        bottom: 28,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.7,
        color: C.textSecondary,
    },
});
