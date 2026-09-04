import React, { useEffect, useRef, useMemo, useState } from 'react';
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
import { QiblaCalibrationHint } from '../components/QiblaCalibrationHint';

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
    alert: '#E05A3C',
    glassBg: 'rgba(255, 250, 242, 0.05)',
    glassBorder: 'rgba(255, 250, 242, 0.10)',
};

const CompassDial = React.memo(function CompassDial({ size }: { size: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="49" fill={C.ring} opacity="0.9" />
            <Circle cx="50" cy="50" r="46.8" fill={C.compass} stroke={C.glassBorder} strokeWidth="0.4" />
            <Circle cx="50" cy="50" r="37.5" fill="none" stroke={C.goldDim} strokeWidth="0.18" opacity="0.55" />

            {Array.from({ length: 72 }).map((_, i) => {
                const major = i % 18 === 0;
                const mid = i % 9 === 0;
                return (
                    <Line
                        key={i}
                        x1="50"
                        y1="2"
                        x2="50"
                        y2={major ? '9.4' : mid ? '6.6' : '4.7'}
                        stroke={major || mid ? C.gold : C.goldDim}
                        strokeWidth={major ? '0.62' : mid ? '0.34' : '0.16'}
                        transform={`rotate(${i * 5} 50 50)`}
                    />
                );
            })}

            <SvgText x="50" y="14.5" textAnchor="middle" fontSize="6.2" fontWeight="800" fill={C.goldBright}>N</SvgText>
            <SvgText x="50" y="91.8" textAnchor="middle" fontSize="4.1" fontWeight="700" fill={C.textMuted}>S</SvgText>
            <SvgText x="87.8" y="51.8" textAnchor="middle" fontSize="4.1" fontWeight="700" fill={C.textMuted}>E</SvgText>
            <SvgText x="12.2" y="51.8" textAnchor="middle" fontSize="4.1" fontWeight="700" fill={C.textMuted}>W</SvgText>
        </Svg>
    );
});

export default function KyblaScreen({ navigation }: any) {
    const { t } = useTranslation();
    const [turnSide, setTurnSide] = useState<'left' | 'right'>('right');
    const turnSideReadyRef = useRef(false);
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const responsiveLayout = useMemo(() => getResponsiveLayoutMetrics(width), [width]);
    const contentWidth = useMemo(
        () => getBoundedContentWidth(width, responsiveLayout.horizontalPadding, responsiveLayout.compactContentMaxWidth),
        [responsiveLayout.compactContentMaxWidth, responsiveLayout.horizontalPadding, width],
    );
    const compassSize = useMemo(
        () => Math.min(
            responsiveLayout.isTablet ? contentWidth * 0.62 : width * (isLandscape ? 0.42 : 0.75),
            height * (isLandscape ? 0.58 : 0.44),
            responsiveLayout.isTablet ? 420 : 360,
        ),
        [contentWidth, height, isLandscape, responsiveLayout.isTablet, width],
    );
    const instrumentSize = compassSize + 28;
    const infoCardWidth = isLandscape
        ? Math.min(280, contentWidth * 0.39)
        : Math.min(contentWidth, responsiveLayout.isTablet ? 720 : width - 48);
    const sceneAuraSize = compassSize + (responsiveLayout.isTablet ? 168 : 140);
    const sceneHaloSize = compassSize + (responsiveLayout.isTablet ? 92 : 72);
    const sceneHaloInnerSize = compassSize + (responsiveLayout.isTablet ? 34 : 22);

    // V2 Architecture Hooks
    const { lat, lon, cityLabel, declination } = useQiblaLocation();
    const { bearing, distanceKm } = useQiblaBearing(lat, lon);
    const {
        heading: magHeading,
        headingUnwrapped: magHeadingUnwrapped,
        stability,
        tiltDeg,
        sampleCount,
        fieldQuality,
    } = useSensorHeading();

    // The sensor pipeline returns a MAGNETIC heading; the Qibla bearing is a TRUE
    // great-circle bearing. Add the local magnetic declination (offline constant,
    // °E) to convert magnetic → true north so the needle points at the real Qibla.
    const heading = useMemo(() => (magHeading + declination + 360) % 360, [magHeading, declination]);
    const headingUnwrapped = magHeadingUnwrapped + declination;

    // Qibla state machine (haptics are emitted once inside the hook)
    const { state, stateInfo } = useQiblaState({
        heading,
        bearing: bearing || 0,
        stability,
        tiltDeg,
        sampleCount,
        fieldQuality,
    });

    // Animations Setup
    const rotAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const breatheAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const guidanceAnim = useRef(new Animated.Value(0)).current;
    const arrowGlowAnim = useRef(new Animated.Value(0)).current;
    const lockAnim = useRef(new Animated.Value(1)).current;
    const prevStateRef = useRef(state);

    useEffect(() => {
        const breathing = Animated.loop(
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
            ]),
        );
        breathing.start();
        return () => breathing.stop();
    }, [breatheAnim]);

    useEffect(() => {
        const prevState = prevStateRef.current;

        if (state === 'perfect' && prevState !== 'perfect') {
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
        } else if (state !== 'perfect' && prevState === 'perfect') {
            Animated.timing(lockAnim, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }).start();
        }

        prevStateRef.current = state;
    }, [state, lockAnim]);

    // Sensor output is already adaptively smoothed. Updating the native animated
    // value directly avoids stacking a new 110 ms timing animation every 40 ms.
    useEffect(() => {
        if (sampleCount === 0) return;
        rotAnim.stopAnimation();
        rotAnim.setValue(headingUnwrapped);
    }, [headingUnwrapped, rotAnim, sampleCount]);

    // 2. Pulse, Glow, and Badge transitions based on State
    useEffect(() => {
        let perfectGlowLoop: Animated.CompositeAnimation | null = null;
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
            perfectGlowLoop = Animated.loop(
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
                ]),
            );
            perfectGlowLoop.start();
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

        // Guidance entry animation
        guidanceAnim.setValue(0);
        Animated.timing(guidanceAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        return () => perfectGlowLoop?.stop();
    }, [state, pulseAnim, glowAnim, guidanceAnim, arrowGlowAnim]);

    // INTERPOLATIONS
    const rotateStr = useMemo(() => rotAnim.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '-360deg'],
    }), [rotAnim]);

    // The Qibla bearing needs to rotate *opposite* to the compass dial 
    // to stay pointing at Mecca in worldly space
    const bearingRotStr = useMemo(() => rotAnim.interpolate({
        inputRange: [0, 360],
        outputRange: [`${bearing}deg`, `${bearing - 360}deg`],
    }), [bearing, rotAnim]);

    const isAligned = state === 'aligned' || state === 'perfect';
    const signedTurn = useMemo(
        () => angularDifference(heading, bearing || 0),
        [bearing, heading],
    );
    useEffect(() => {
        if (sampleCount < 6) return;

        const measuredSide = signedTurn >= 0 ? 'right' : 'left';
        if (!turnSideReadyRef.current) {
            turnSideReadyRef.current = true;
            setTurnSide(measuredSide);
            return;
        }

        // Near the exact opposite direction, sensor noise can alternate between
        // +180° and -180°. Keep the chosen side until the user starts turning.
        if (Math.abs(signedTurn) < 165) {
            setTurnSide(current => current === measuredSide ? current : measuredSide);
        }
    }, [sampleCount, signedTurn]);
    const turnDegrees = Math.round(Math.abs(signedTurn));
    const isInterference = state === 'interference';
    // Both states mean "don't trust the needle yet", so both get the figure-8 prompt.
    const isCalibrating = state === 'calibrating' || state === 'unstable' || isInterference;
    const guidanceTitle = useMemo(() => {
        if (state === 'calibrating') {
            return t('qibla.status_calibrating', 'Kybla ugruny tapyň');
        }
        if (state === 'interference') {
            return t('qibla.status_interference', 'Magnit päsgelçiligi');
        }
        if (state === 'unstable') {
            return t('qibla.status_unstable', 'Telefony durnukly tutuň');
        }
        if (state === 'perfect') {
            return t('qibla.status_perfect', 'Kybla tapyldy');
        }
        if (turnSide === 'right') {
            return t('qibla.turn_right', {
                degrees: turnDegrees,
                defaultValue: `Saga ${turnDegrees}° öwrüliň`,
            });
        }
        return t('qibla.turn_left', {
            degrees: turnDegrees,
            defaultValue: `Çepe ${turnDegrees}° öwrüliň`,
        });
    }, [state, t, turnDegrees, turnSide]);
    const guidanceHint = isInterference
        ? t('qibla.interference_hint', 'Metal we magnitli zatlardan daşlaşyň, soňra telefony “8” görnüşinde hereketlendiriň.')
        : state === 'unstable'
            ? t('qibla.unstable_hint', 'Telefony deň we asuda saklaň.')
            : state === 'calibrating'
                ? t('qibla.calibration_hint', 'Telefonyňyzy “8” görnüşinde hereketlendiriň we metal zatlardan daşda tutuň.')
                : state === 'perfect'
                    ? t('qibla.success_hint', 'Namaz üçin şu tarapa öwrüliň.')
                    : t('qibla.align_hint', 'Ok Käbe belgisi bilen gabat gelýänçä öwrüliň.');
    const guidanceIcon: React.ComponentProps<typeof Ionicons>['name'] =
        state === 'perfect' ? 'checkmark-circle' :
            state === 'interference' ? 'magnet' :
                state === 'unstable' ? 'warning' :
                    state === 'calibrating' ? 'sync' :
                        turnSide === 'right' ? 'arrow-forward' : 'arrow-back';
    const guidanceColor = state === 'perfect'
        ? C.green
        : state === 'interference'
            ? C.alert
            : state === 'unstable'
                ? C.amber
                : C.goldBright;
    const guidanceWidth = isLandscape
        ? Math.min(contentWidth, 500)
        : Math.min(contentWidth, width - 48);

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

    const sceneGlowOpacity = useMemo(() => glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.02, 0.12],
    }), [glowAnim]);

    const tipGlowOpacity = useMemo(() => arrowGlowAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.02, 0.10, 0.16],
    }), [arrowGlowAnim]);

    const tipGlowScale = useMemo(() => arrowGlowAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1.0, 1.015, 1.03],
    }), [arrowGlowAnim]);

    const idleBreathScale = useMemo(() => breatheAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.006],
    }), [breatheAnim]);

    const offlineLabel = t('qibla.offline', 'Oflaýn');

    // The status line now reports what the magnetometer actually sees rather than
    // only whether the needle happens to be still — a steady needle in a distorted
    // field used to read as "ready".
    const accuracyLabel = useMemo(() => {
        if (fieldQuality === 'unreliable') return t('qibla.accuracy_bad', 'Ynamly däl');
        if (fieldQuality === 'disturbed') return t('qibla.accuracy_low', 'Takyklyk pes');
        if (fieldQuality === 'good' && stateInfo.isStable) {
            return t('qibla.compass_ready', 'Kompas taýýar');
        }
        return t('qibla.compass_checking', 'Kompas barlanýar');
    }, [fieldQuality, stateInfo.isStable, t]);

    const accuracyColor = fieldQuality === 'unreliable'
        ? C.alert
        : fieldQuality === 'disturbed'
            ? C.amber
            : fieldQuality === 'good' && stateInfo.isStable
                ? C.green
                : C.amber;
    const distanceLabel = distanceKm > 0 ? `${distanceKm} km` : '—';

    const compassSceneScale = useMemo(
        () => Animated.multiply(pulseAnim, lockAnim),
        [lockAnim, pulseAnim],
    );

    return (
        <View style={s.root}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={[C.bgTop, C.bgBot]} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={[s.safe, isLandscape && s.safeLandscape]}>

                {/* header */}
                <View style={[s.header, isLandscape && s.headerLandscape, { width: contentWidth }]}>
                    <Pressable onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={12}>
                        <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
                    </Pressable>
                    <View style={s.headerCenter}>
                        <Text style={s.title}>{t('common.kybla', 'KYBLA').toUpperCase()}</Text>
                        <Text style={s.subtitle}>{cityLabel} · {offlineLabel}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {/* One clear instruction: turn left/right, calibrate, or stop when aligned. */}
                <Animated.View
                    accessible
                    accessibilityLabel={`${guidanceTitle}. ${guidanceHint}`}
                    accessibilityLiveRegion={state === 'perfect' ? 'polite' : 'none'}
                    style={[
                        s.guidanceCard,
                        isLandscape && s.guidanceCardLandscape,
                        state === 'perfect' && s.guidanceCardPerfect,
                        { width: guidanceWidth, opacity: guidanceAnim },
                    ]}
                >
                    <View style={[
                        s.guidanceIcon,
                        state === 'perfect' && s.guidanceIconPerfect,
                    ]}>
                        <Ionicons name={guidanceIcon} size={isLandscape ? 22 : 26} color={guidanceColor} />
                    </View>
                    <View style={s.guidanceCopy}>
                        <Text
                            numberOfLines={2}
                            style={[
                                s.guidanceTitle,
                                isLandscape && s.guidanceTitleLandscape,
                                { color: guidanceColor },
                            ]}
                        >
                            {guidanceTitle}
                        </Text>
                        <Text
                            numberOfLines={isLandscape ? 1 : 3}
                            style={[s.guidanceHint, isLandscape && s.guidanceHintLandscape]}
                        >
                            {guidanceHint}
                        </Text>
                    </View>
                    {isCalibrating && (
                        <QiblaCalibrationHint
                            width={isLandscape ? 64 : 84}
                            height={isLandscape ? 28 : 36}
                            markerColor={isInterference ? C.alert : C.goldBright}
                            trackColor={isInterference ? 'rgba(224, 90, 60, 0.32)' : C.goldDim}
                        />
                    )}
                </Animated.View>

                <View style={[s.mainContent, { width: contentWidth }, isLandscape && s.mainContentLandscape]}>
                {/* compass area */}
                <View style={[s.compassArea, !isLandscape && { width: contentWidth }, isLandscape && s.compassAreaLandscape]}>
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

                    <Animated.View style={[s.targetBlock, isLandscape && s.targetBlockLandscape, { opacity: targetOpacity, transform: [{ scale: idleBreathScale }] }]}>
                        <View style={[
                            s.targetRing,
                            isAligned && s.targetRingAligned,
                            state === 'perfect' && s.targetRingPerfect,
                        ]} />
                        <View style={[s.targetPill, state === 'perfect' && s.targetPillPerfect]}>
                            <View style={[s.kaabaMark, state === 'perfect' && s.kaabaMarkPerfect]}>
                                <View style={s.kaabaBand} />
                            </View>
                            <Text style={s.targetLabel}>{t('qibla.kaaba', 'Käbe')}</Text>
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
                                        borderColor: state === 'perfect'
                                            ? 'rgba(119, 144, 108, 0.88)'
                                            : 'rgba(197, 162, 101, 0.42)',
                                        transform: [{ scale: ringScale }],
                                    },
                                ]}
                            />

                            <View style={[s.compassShadow, { width: compassSize, height: compassSize, borderRadius: compassSize / 2 }]}>

                            {/* Rotating Dial */}
                            <Animated.View style={[s.disc, { width: compassSize, height: compassSize, borderRadius: compassSize / 2, transform: [{ rotate: rotateStr }] }]}>
                                <CompassDial size={compassSize} />
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

                </View>

                {/* Only the useful offline facts remain visible. */}
                <View style={[
                    s.metaCard,
                    { width: infoCardWidth },
                    isLandscape && s.metaCardLandscape,
                    isAligned && s.metaCardAligned,
                ]}>
                    <View style={s.metaItem}>
                        <Ionicons name="navigate-outline" size={18} color={C.gold} />
                        <View style={s.metaCopy}>
                            <Text style={s.metaLabel}>{t('qibla.distance', 'Mekgä')}</Text>
                            <Text style={s.metaValue}>{distanceLabel}</Text>
                        </View>
                    </View>
                    <View style={s.metaDivider} />
                    <View style={s.metaItem}>
                        <View style={[
                            s.readyDot,
                            { backgroundColor: accuracyColor },
                        ]} />
                        <View style={s.metaCopy}>
                            <Text style={s.metaLabel}>{offlineLabel}</Text>
                            <Text style={s.metaValueSmall}>{accuracyLabel}</Text>
                        </View>
                    </View>
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
    safeLandscape: {
        paddingVertical: 4,
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    headerLandscape: {
        paddingTop: 0,
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
    guidanceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,250,242,0.055)',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: C.glassBorder,
        marginTop: 12,
    },
    guidanceCardLandscape: {
        marginTop: 2,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
    },
    guidanceCardPerfect: {
        backgroundColor: 'rgba(119,144,108,0.11)',
        borderColor: 'rgba(119,144,108,0.46)',
    },
    guidanceIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        backgroundColor: 'rgba(197,162,101,0.10)',
    },
    guidanceIconPerfect: {
        backgroundColor: 'rgba(119,144,108,0.15)',
    },
    guidanceCopy: {
        flex: 1,
        minWidth: 0,
    },
    guidanceTitle: {
        fontSize: 21,
        lineHeight: 26,
        fontWeight: '800',
        letterSpacing: 0.15,
    },
    guidanceTitleLandscape: {
        fontSize: 17,
        lineHeight: 21,
    },
    guidanceHint: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 17,
        color: C.textSecondary,
        fontWeight: '500',
    },
    guidanceHintLandscape: {
        marginTop: 1,
        fontSize: 11,
        lineHeight: 14,
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
    },
    mainContentLandscape: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    compassArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compassAreaLandscape: {
        minWidth: 0,
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
    targetBlockLandscape: {
        top: 4,
    },
    targetRing: {
        position: 'absolute',
        top: -9,
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 1,
        borderColor: 'rgba(197, 162, 101, 0.16)',
    },
    targetRingAligned: {
        borderColor: 'rgba(197, 162, 101, 0.28)',
    },
    targetRingPerfect: {
        borderWidth: 1.5,
        borderColor: 'rgba(119, 144, 108, 0.74)',
        backgroundColor: 'rgba(119, 144, 108, 0.06)',
    },
    targetPill: {
        minWidth: 104,
        paddingHorizontal: 18,
        paddingVertical: 11,
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
        backgroundColor: 'rgba(22,27,20,0.98)',
        borderColor: 'rgba(119, 144, 108, 0.48)',
    },
    kaabaMark: {
        width: 24,
        height: 24,
        borderRadius: 4,
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: 'rgba(197, 162, 101, 0.52)',
        marginBottom: 6,
        overflow: 'hidden',
    },
    kaabaMarkPerfect: {
        borderColor: C.goldBright,
    },
    kaabaBand: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 7,
        height: 4,
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
    metaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        backgroundColor: 'rgba(18,16,14,0.92)',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
        marginBottom: Platform.OS === 'ios' ? 10 : 30,
    },
    metaCardLandscape: {
        alignSelf: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginLeft: 16,
        marginBottom: 0,
    },
    metaCardAligned: {
        borderColor: 'rgba(197, 162, 101, 0.22)',
        backgroundColor: 'rgba(23,19,15,0.94)',
    },
    metaItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
    },
    metaCopy: {
        marginLeft: 9,
        minWidth: 0,
    },
    metaLabel: {
        fontSize: 11,
        color: C.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        fontWeight: '600',
    },
    metaValue: {
        marginTop: 2,
        fontSize: 18,
        fontWeight: '700',
        color: C.textPrimary,
    },
    metaValueSmall: {
        marginTop: 3,
        fontSize: 13,
        fontWeight: '600',
        color: C.textPrimary,
    },
    metaDivider: {
        width: 1,
        height: 32,
        backgroundColor: C.glassBorder,
        marginHorizontal: 14,
    },
    readyDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        shadowColor: C.green,
        shadowOpacity: 0.32,
        shadowRadius: 6,
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
});
