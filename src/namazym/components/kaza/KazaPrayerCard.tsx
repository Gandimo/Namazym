import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Easing,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { kazaTokens } from '../../theme/kazaTokens';
import type { KazaPrayerCardProps } from '../../types/kaza';

const COUNT_DURATION_MS = 200;
const PRESS_IN_SCALE = 0.96;

export function KazaPrayerCard({
    title,
    count,
    onIncrement,
    onDecrement,
    style,
    disabled = false,
    testID,
}: KazaPrayerCardProps) {
    const plusScale = useRef(new Animated.Value(1)).current;
    const minusScale = useRef(new Animated.Value(1)).current;
    const plusOpacity = useRef(new Animated.Value(1)).current;
    const minusOpacity = useRef(new Animated.Value(1)).current;
    const countOpacity = useRef(new Animated.Value(1)).current;
    const countTranslateY = useRef(new Animated.Value(0)).current;
    const activeLine = useRef(new Animated.Value(count > 0 ? 1 : 0)).current;
    const cardGlow = useRef(new Animated.Value(count > 0 ? 1 : 0)).current;
    const disabledPulse = useRef(new Animated.Value(0)).current;
    const previousCount = useRef(count);

    const isActive = count > 0;
    const supportText = isActive ? 'Galany' : 'Tamamlandy';

    useEffect(() => {
        const direction = count >= previousCount.current ? 1 : -1;
        previousCount.current = count;

        countTranslateY.setValue(direction > 0 ? 5 : -5);
        countOpacity.setValue(0.64);

        Animated.parallel([
            Animated.timing(countTranslateY, {
                toValue: 0,
                duration: COUNT_DURATION_MS,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(countOpacity, {
                toValue: 1,
                duration: COUNT_DURATION_MS,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(activeLine, {
                toValue: isActive ? 1 : 0,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
            Animated.timing(cardGlow, {
                toValue: isActive ? 1 : 0,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
        ]).start();
    }, [activeLine, cardGlow, count, countOpacity, countTranslateY, isActive]);

    const animateSegmentPress = (scaleValue: Animated.Value, opacityValue: Animated.Value) => {
        Animated.parallel([
            Animated.timing(scaleValue, {
                toValue: PRESS_IN_SCALE,
                duration: 90,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
                toValue: 0.84,
                duration: 90,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();
    };

    const releaseSegmentPress = (scaleValue: Animated.Value, opacityValue: Animated.Value) => {
        Animated.parallel([
            Animated.spring(scaleValue, {
                toValue: 1,
                friction: 7,
                tension: 180,
                useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
                toValue: 1,
                duration: 140,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();
    };

    const triggerDisabledFeedback = () => {
        disabledPulse.setValue(0);
        Animated.sequence([
            Animated.timing(disabledPulse, {
                toValue: 1,
                duration: 90,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }),
            Animated.timing(disabledPulse, {
                toValue: 0,
                duration: 130,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }),
        ]).start();
    };

    const handleIncrement = async () => {
        if (disabled) {
            triggerDisabledFeedback();
            return;
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onIncrement();
    };

    const handleDecrement = async () => {
        if (disabled || count === 0) {
            await Haptics.selectionAsync();
            triggerDisabledFeedback();
            return;
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        onDecrement();
    };

    const animatedCardStyle = useMemo<StyleProp<ViewStyle>>(
        () => ({
            borderColor: activeLine.interpolate({
                inputRange: [0, 1],
                outputRange: [kazaTokens.colors.cardBorder, kazaTokens.colors.cardBorderActive],
            }),
            backgroundColor: cardGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [kazaTokens.colors.cardSurfaceSoft, kazaTokens.colors.cardSurface],
            }),
        }),
        [activeLine, cardGlow]
    );

    const activeLineWidth = activeLine.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const disabledSurface = disabledPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.72],
    });

    return (
        <Animated.View style={[styles.card, animatedCardStyle, style]} testID={testID}>
            <View style={styles.contentRow}>
                <View style={styles.copyBlock}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={[styles.supportText, isActive ? styles.supportTextActive : styles.supportTextNeutral]}>
                        {supportText}
                    </Text>

                    <Animated.View
                        style={[
                            styles.countRow,
                            {
                                opacity: countOpacity,
                                transform: [{ translateY: countTranslateY }],
                            },
                        ]}
                    >
                        <Text style={[styles.countText, isActive ? styles.countTextActive : styles.countTextNeutral]}>
                            {count}
                        </Text>
                        <Text style={styles.unitText}>gezek</Text>
                    </Animated.View>
                </View>

                <Animated.View style={[styles.stepperShell, { opacity: disabledSurface }]}>
                    <Animated.View
                        style={[
                            styles.stepperCard,
                            kazaTokens.shadows.stepper,
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.segmentWrap,
                                {
                                    transform: [{ scale: plusScale }],
                                    opacity: plusOpacity,
                                },
                            ]}
                        >
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`${title} goş`}
                                onPressIn={() => animateSegmentPress(plusScale, plusOpacity)}
                                onPressOut={() => releaseSegmentPress(plusScale, plusOpacity)}
                                onPress={handleIncrement}
                                style={styles.segment}
                            >
                                <Ionicons name="add" size={22} color={kazaTokens.colors.accent} />
                            </Pressable>
                        </Animated.View>

                        <View style={styles.segmentDivider} />

                        <Animated.View
                            style={[
                                styles.segmentWrap,
                                {
                                    transform: [{ scale: minusScale }],
                                    opacity: minusOpacity,
                                },
                            ]}
                        >
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`${title} aýyr`}
                                onPressIn={() => animateSegmentPress(minusScale, minusOpacity)}
                                onPressOut={() => releaseSegmentPress(minusScale, minusOpacity)}
                                onPress={handleDecrement}
                                style={styles.segment}
                            >
                                <Ionicons
                                    name="remove"
                                    size={22}
                                    color={count === 0 ? kazaTokens.colors.textMuted : kazaTokens.colors.textSecondary}
                                />
                            </Pressable>
                        </Animated.View>
                    </Animated.View>
                </Animated.View>
            </View>

            <View style={styles.accentTrack}>
                <Animated.View style={[styles.accentLine, { width: activeLineWidth }]} />
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: kazaTokens.radii.card,
        padding: kazaTokens.spacing.cardPadding,
        borderWidth: 1,
        overflow: 'hidden',
        ...kazaTokens.shadows.card,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    copyBlock: {
        flex: 1,
        paddingRight: 18,
    },
    title: {
        fontSize: kazaTokens.typography.title,
        fontWeight: '800',
        color: kazaTokens.colors.textPrimary,
        letterSpacing: 0.2,
    },
    supportText: {
        fontSize: kazaTokens.typography.support,
        fontWeight: '700',
        marginTop: 6,
        letterSpacing: 0.3,
    },
    supportTextActive: {
        color: kazaTokens.colors.textSecondary,
    },
    supportTextNeutral: {
        color: kazaTokens.colors.textMuted,
    },
    countRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 14,
    },
    countText: {
        fontSize: kazaTokens.typography.count,
        fontWeight: '900',
        letterSpacing: -1.2,
        lineHeight: 44,
    },
    countTextActive: {
        color: kazaTokens.colors.countActive,
    },
    countTextNeutral: {
        color: kazaTokens.colors.countNeutral,
    },
    unitText: {
        fontSize: kazaTokens.typography.unit,
        fontWeight: '700',
        color: kazaTokens.colors.textSecondary,
        marginLeft: 8,
        marginBottom: 6,
    },
    stepperShell: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperCard: {
        width: 66,
        borderRadius: kazaTokens.radii.stepper,
        backgroundColor: kazaTokens.colors.stepperSurface,
        borderWidth: 1,
        borderColor: kazaTokens.colors.stepperBorder,
        paddingVertical: 4,
    },
    segmentWrap: {
        borderRadius: kazaTokens.radii.stepperSegment,
    },
    segment: {
        width: 64,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    segmentDivider: {
        height: 1,
        marginHorizontal: 14,
        backgroundColor: kazaTokens.colors.divider,
    },
    accentTrack: {
        height: 3,
        borderRadius: 999,
        marginTop: 18,
        backgroundColor: 'rgba(81, 63, 38, 0.05)',
        overflow: 'hidden',
    },
    accentLine: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: kazaTokens.colors.accentLine,
    },
});

export default KazaPrayerCard;
