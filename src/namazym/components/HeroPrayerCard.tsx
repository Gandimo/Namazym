import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Animated, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { tokens2026 } from '../theme/tokens2026';
import { formatCountdown } from '../utils/timeUtils';
import { useAnimatedEntrance } from '../hooks/useAnimatedEntrance';
import { useScalePress } from '../hooks/useScalePress';
import { PremiumIcon } from './icons/PremiumIcon';
import { getMoonIconForDay } from '../utils/moonUtils';
import { getHijriDay, isRamadan } from '../utils/sahetli';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroProps {
    current: any;
    next: any;
    remainingMs: number;
    progress: number;
    delay?: number;
    isPassengerMode?: boolean;
    onPress?: () => void;
}

export const HeroPrayerCard = ({ current, next, remainingMs, progress, delay = 0, isPassengerMode = false, onPress }: HeroProps) => {
    const { t } = useTranslation();
    const nextLabel = next?.label || 'Indiki';
    const countdown = formatCountdown(remainingMs);
    const entranceStyle = useAnimatedEntrance(delay);
    const { onPressIn, onPressOut, scaleStyle } = useScalePress();

    // Breathing Glow Animation
    const glowAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 0.8,
                    duration: 1500,
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0.3,
                    duration: 1500,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, [glowAnim]);

    const glowStyle = {
        opacity: glowAnim,
        shadowRadius: glowAnim.interpolate({
            inputRange: [0.3, 0.8],
            outputRange: [4, 8],
        }),
    };

    // Dynamic morphology & pulse
    const hijriDay = React.useMemo(() => getHijriDay(new Date()), []);
    const moonIcon = React.useMemo(() => getMoonIconForDay(hijriDay), [hijriDay]);
    const isRamadanMonth = React.useMemo(() => isRamadan(), []);
    const isNearPrayer = !isPassengerMode && remainingMs < 15 * 60 * 1000 && remainingMs > 0;

    return (
        <Animated.View style={[styles.container, entranceStyle, scaleStyle]}>
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={onPress}
                style={[styles.card, tokens2026.elevation.focused]}
            >
                <BlurView
                    intensity={tokens2026.glass.blurRadius}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: tokens2026.colors.surface.glass }]} />

                <View style={styles.accentBorder} />

                <View style={styles.content}>
                    <Text style={styles.nextLabel}>
                        {isPassengerMode ? t('common.prayer_times').toUpperCase() : `${t(`prayer.${next?.key?.toLowerCase()}`).toUpperCase()} NAMAZYNA`}
                    </Text>
                    <Text style={styles.timer}>
                        {isPassengerMode ? (current?.time || '--:--') : countdown}
                    </Text>

                    {!isPassengerMode && (
                        <View style={styles.progressTrack}>
                            <Animated.View style={[
                                styles.progressBar,
                                { width: `${progress * 100}%` },
                                glowStyle
                            ]} />
                        </View>
                    )}

                    <View style={styles.footer}>
                        <View style={styles.footerLeft}>
                            <Text style={styles.currentInfo}>
                                {isPassengerMode ? `${t('common.prayer_times')}:` : 'Häzir:'} <Text style={styles.bold}>{t(`prayer.${current?.key?.toLowerCase()}`) || '...'}</Text>
                            </Text>
                            <Text style={styles.footerTime}>{current?.time || '--:--'}</Text>
                        </View>
                        <PremiumIcon
                            name={moonIcon as any}
                            size="LARGE"
                            gradient={isRamadanMonth ? "RAMADAN_MOON" : "PRAYER_GOLD"}
                            interactive
                            onPress={onPress}
                            pulse={isNearPrayer}
                            source="HeroPrayerCard"
                        />
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: tokens2026.layout.screenPadding,
        marginVertical: 10,
    },
    card: {
        height: 180,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    accentBorder: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 1,
        borderColor: tokens2026.colors.accent,
        opacity: 0.2,
        borderRadius: 24,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextLabel: {
        fontSize: 11,
        color: tokens2026.colors.text.secondary,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
    },
    timer: {
        fontSize: 42,
        color: tokens2026.colors.text.primary,
        fontWeight: '900',
        letterSpacing: -1,
        fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
    },
    progressTrack: {
        width: '100%',
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 2,
        marginTop: 20,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: tokens2026.colors.accent,
        shadowColor: tokens2026.colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: 16,
    },
    footerLeft: {
        flex: 1,
    },
    currentInfo: {
        fontSize: 13,
        color: tokens2026.colors.text.secondary,
    },
    bold: {
        fontWeight: 'bold',
        color: tokens2026.colors.text.primary,
    },
    footerTime: {
        fontSize: 13,
        color: tokens2026.colors.text.secondary,
        fontWeight: '700',
    }
});
