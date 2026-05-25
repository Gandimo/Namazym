import React from 'react';
import { View, Text, StyleSheet, Platform, Animated, Pressable, useWindowDimensions, Image, ImageSourcePropType } from 'react-native';
import { BlurView } from 'expo-blur';
import { tokens2026 } from '../theme/tokens2026';
import { formatCountdown } from '../utils/timeUtils';
import { useAnimatedEntrance } from '../hooks/useAnimatedEntrance';
import { useScalePress } from '../hooks/useScalePress';
import { PremiumIcon } from './icons/PremiumIcon';
import { AsrIcon, DhuhrIcon, IshaIcon, MaghribIcon, SunriseIcon } from './icons/PrayerIcons';
import { StarIcon } from './icons/StarIcon';
import { CrescentIcon } from './icons/CrescentIcon';
import { getMoonIconForDay } from '../utils/moonUtils';
import { getHijriDay, isRamadan } from '../utils/sahetli';
import { useTranslation } from 'react-i18next';

interface HeroProps {
    current: any;
    next: any;
    remainingMs: number;
    progress: number;
    delay?: number;
    isPassengerMode?: boolean;
    onPress?: () => void;
}

type PrayerPeriodKey = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

type HeroVisualConfig = {
    accent: string;
    chipBackground: string;
    chipBorder: string;
    glowPrimary: string;
    glowSecondary: string;
    iconColor: string;
    progressTrack: string;
    icon: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
    showDecorativeImage?: boolean;
};

const fajrKaabaAsset = require('../assets/hero/hero-fajr-kaaba-final.png');
const sunriseMosqueAsset = require('../assets/hero/hero-sunrise-mosque-final.png');
const dhuhrKaabaAsset = require('../assets/hero/hero-dhuhr-final.png');
const asrCamelAsset = require('../assets/hero/hero-asr-camel-final.png');
const maghribAsset = require('../assets/hero/hero-maghrib-final.png');
const ishaAsset = require('../assets/hero/hero-isha-final.png');

const HERO_ASSETS: Record<PrayerPeriodKey, ImageSourcePropType> = {
    Fajr: fajrKaabaAsset,
    Sunrise: sunriseMosqueAsset,
    Dhuhr: dhuhrKaabaAsset,
    Asr: asrCamelAsset,
    Maghrib: maghribAsset,
    Isha: ishaAsset,
};

const HERO_VISUALS: Record<PrayerPeriodKey, HeroVisualConfig> = {
    Fajr: {
        accent: '#8FB7FF',
        chipBackground: 'rgba(143, 183, 255, 0.12)',
        chipBorder: 'rgba(143, 183, 255, 0.32)',
        glowPrimary: 'rgba(118, 158, 255, 0.26)',
        glowSecondary: 'rgba(212, 175, 83, 0.14)',
        iconColor: '#DDE8FF',
        progressTrack: 'rgba(143, 183, 255, 0.18)',
        icon: 'fajr',
        showDecorativeImage: true,
    },
    Sunrise: {
        accent: '#F0B35E',
        chipBackground: 'rgba(240, 179, 94, 0.14)',
        chipBorder: 'rgba(240, 179, 94, 0.34)',
        glowPrimary: 'rgba(240, 179, 94, 0.24)',
        glowSecondary: 'rgba(255, 221, 156, 0.14)',
        iconColor: '#FFE2B3',
        progressTrack: 'rgba(240, 179, 94, 0.20)',
        icon: 'sunrise',
        showDecorativeImage: true,
    },
    Dhuhr: {
        accent: '#B8D9FF',
        chipBackground: 'rgba(184, 217, 255, 0.13)',
        chipBorder: 'rgba(184, 217, 255, 0.28)',
        glowPrimary: 'rgba(184, 217, 255, 0.22)',
        glowSecondary: 'rgba(255, 255, 255, 0.10)',
        iconColor: '#EAF4FF',
        progressTrack: 'rgba(184, 217, 255, 0.18)',
        icon: 'dhuhr',
        showDecorativeImage: true,
    },
    Asr: {
        accent: '#DDBB73',
        chipBackground: 'rgba(221, 187, 115, 0.14)',
        chipBorder: 'rgba(221, 187, 115, 0.30)',
        glowPrimary: 'rgba(221, 187, 115, 0.22)',
        glowSecondary: 'rgba(255, 229, 172, 0.10)',
        iconColor: '#F5E1B5',
        progressTrack: 'rgba(221, 187, 115, 0.18)',
        icon: 'asr',
        showDecorativeImage: true,
    },
    Maghrib: {
        accent: '#F0B08D',
        chipBackground: 'rgba(240, 176, 141, 0.14)',
        chipBorder: 'rgba(240, 176, 141, 0.28)',
        glowPrimary: 'rgba(240, 176, 141, 0.24)',
        glowSecondary: 'rgba(255, 213, 168, 0.12)',
        iconColor: '#FFE1CE',
        progressTrack: 'rgba(240, 176, 141, 0.18)',
        icon: 'maghrib',
        showDecorativeImage: true,
    },
    Isha: {
        accent: '#B6C7F1',
        chipBackground: 'rgba(182, 199, 241, 0.12)',
        chipBorder: 'rgba(182, 199, 241, 0.30)',
        glowPrimary: 'rgba(111, 134, 198, 0.24)',
        glowSecondary: 'rgba(212, 175, 83, 0.12)',
        iconColor: '#E2EAFF',
        progressTrack: 'rgba(182, 199, 241, 0.18)',
        icon: 'isha',
        showDecorativeImage: true,
    },
};

const NORMALIZED_PERIOD_KEYS: Record<string, PrayerPeriodKey> = {
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
};

const normalizePrayerPeriodKey = (key?: string | null): PrayerPeriodKey | null => {
    if (!key) return null;
    if (key in HERO_VISUALS) return key as PrayerPeriodKey;
    return NORMALIZED_PERIOD_KEYS[key.toLowerCase()] ?? null;
};

const getHeroTargetPrayer = ({
    current,
    next,
    isPassengerMode,
}: {
    current: any;
    next: any;
    isPassengerMode: boolean;
}) => {
    if (isPassengerMode) return current ?? next ?? null;
    return next ?? current ?? null;
};

const HERO_COUNTDOWN_TITLES: Record<PrayerPeriodKey, string> = {
    Fajr: 'ERTIR NAMAZYNA',
    Sunrise: 'GÜNÜŇ DOGMAGYNA',
    Dhuhr: 'ÖÝLE NAMAZYNA',
    Asr: 'IKINDI NAMAZYNA',
    Maghrib: 'AGŞAM NAMAZYNA',
    Isha: 'ÝASSY NAMAZYNA',
};

const getHeroCountdownTitle = ({
    periodKey,
    fallbackLabel,
}: {
    periodKey: PrayerPeriodKey;
    fallbackLabel?: string | null;
}) => {
    return HERO_COUNTDOWN_TITLES[periodKey] ?? `${(fallbackLabel || '').toUpperCase()} NAMAZYNA`;
};

function PeriodAmbientIcon({
    period,
    color,
    compact,
}: {
    period: PrayerPeriodKey;
    color: string;
    compact: boolean;
}) {
    const baseSize = compact ? 50 : 62;
    const accentSize = compact ? 16 : 20;

    return (
        <View style={styles.periodIconWrap}>
            {period === 'Fajr' ? (
                <>
                    <CrescentIcon size={baseSize} color={color} strokeWidth={1.5} />
                    <View style={styles.periodAccentTop}>
                        <StarIcon size={accentSize} color={color} strokeWidth={1.3} />
                    </View>
                </>
            ) : null}
            {period === 'Sunrise' ? <SunriseIcon size={baseSize} color={color} strokeWidth={1.55} /> : null}
            {period === 'Dhuhr' ? <DhuhrIcon size={baseSize} color={color} strokeWidth={1.45} /> : null}
            {period === 'Asr' ? <AsrIcon size={baseSize} color={color} strokeWidth={1.5} /> : null}
            {period === 'Maghrib' ? <MaghribIcon size={baseSize} color={color} strokeWidth={1.55} /> : null}
            {period === 'Isha' ? (
                <>
                    <IshaIcon size={baseSize} color={color} strokeWidth={1.45} />
                    <View style={styles.periodAccentCluster}>
                        <StarIcon size={16} color={color} strokeWidth={1.2} />
                        <View style={styles.periodAccentOffset}>
                            <StarIcon size={12} color={color} strokeWidth={1.1} />
                        </View>
                    </View>
                </>
            ) : null}
        </View>
    );
}

export const HeroPrayerCard = ({ current, next, remainingMs, progress, delay = 0, isPassengerMode = false, onPress }: HeroProps) => {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const countdown = formatCountdown(remainingMs);
    const entranceStyle = useAnimatedEntrance(delay);
    const { onPressIn, onPressOut, scaleStyle } = useScalePress();
    const hijriDay = React.useMemo(() => getHijriDay(new Date()), []);
    const moonIcon = React.useMemo(() => getMoonIconForDay(hijriDay), [hijriDay]);
    const isRamadanMonth = React.useMemo(() => isRamadan(), []);
    const isNearPrayer = !isPassengerMode && remainingMs < 15 * 60 * 1000 && remainingMs > 0;
    const isCompactLayout = width <= 390;
    const isLargeLayout = width >= 430;
    const targetPrayer = getHeroTargetPrayer({ current, next, isPassengerMode });
    const periodKey = normalizePrayerPeriodKey(targetPrayer?.key) ?? normalizePrayerPeriodKey(current?.key) ?? 'Dhuhr';
    const visual = HERO_VISUALS[periodKey];
    const showDecorativeImage = visual.showDecorativeImage === true;

    let decorativeImageSize = 138;
    let decorativeImageRight = 8;
    let decorativeImageBottom = 38;
    let decorativeImageOpacity = 0.96;
    let decorativeGlowSize = 138;
    let decorativeGlowRight = 18;
    let decorativeGlowTop = 30;
    let decorativeContentPaddingRight = 138;
    let customGlowColor = visual.glowPrimary;

    if (showDecorativeImage) {
        if (periodKey === 'Fajr') {
            decorativeImageSize = isCompactLayout ? 114 : isLargeLayout ? 152 : 136;
            decorativeImageRight = isCompactLayout ? 6 : 8;
            decorativeImageBottom = isCompactLayout ? 42 : isLargeLayout ? 36 : 38;
            decorativeImageOpacity = isCompactLayout ? 0.95 : 0.96;
            decorativeGlowSize = isCompactLayout ? 100 : isLargeLayout ? 140 : 124;
            decorativeGlowRight = isCompactLayout ? 14 : isLargeLayout ? 16 : 14;
            decorativeGlowTop = isCompactLayout ? 38 : isLargeLayout ? 36 : 38;
            decorativeContentPaddingRight = isCompactLayout ? 98 : isLargeLayout ? 148 : 128;
            customGlowColor = 'rgba(185, 202, 216, 0.16)';
        } else if (periodKey === 'Sunrise') {
            decorativeImageSize = isCompactLayout ? 116 : isLargeLayout ? 154 : 138;
            decorativeImageRight = isCompactLayout ? 6 : 8;
            decorativeImageBottom = isCompactLayout ? 42 : isLargeLayout ? 36 : 38;
            decorativeImageOpacity = isCompactLayout ? 0.95 : 0.96;
            decorativeGlowSize = isCompactLayout ? 118 : isLargeLayout ? 148 : 138;
            decorativeGlowRight = isCompactLayout ? 22 : isLargeLayout ? 24 : 18;
            decorativeGlowTop = isCompactLayout ? 30 : isLargeLayout ? 28 : 30;
            decorativeContentPaddingRight = isCompactLayout ? 104 : isLargeLayout ? 158 : 138;
            customGlowColor = 'rgba(230, 180, 90, 0.14)';
        } else if (periodKey === 'Dhuhr') {
            decorativeImageSize = isCompactLayout ? 118 : isLargeLayout ? 156 : 140;
            decorativeImageRight = isCompactLayout ? 4 : 6;
            decorativeImageBottom = isCompactLayout ? 40 : isLargeLayout ? 34 : 36;
            decorativeImageOpacity = isCompactLayout ? 0.95 : 0.97;
            decorativeGlowSize = isCompactLayout ? 108 : isLargeLayout ? 146 : 130;
            decorativeGlowRight = isCompactLayout ? 14 : isLargeLayout ? 20 : 16;
            decorativeGlowTop = isCompactLayout ? 28 : isLargeLayout ? 26 : 28;
            decorativeContentPaddingRight = isCompactLayout ? 108 : isLargeLayout ? 152 : 136;
            customGlowColor = 'rgba(184, 217, 255, 0.16)';
        } else if (periodKey === 'Asr') {
            decorativeImageSize = isCompactLayout ? 118 : isLargeLayout ? 156 : 140;
            decorativeImageRight = isCompactLayout ? 4 : 6;
            decorativeImageBottom = isCompactLayout ? 40 : isLargeLayout ? 34 : 36;
            decorativeImageOpacity = isCompactLayout ? 0.95 : 0.97;
            decorativeGlowSize = isCompactLayout ? 108 : isLargeLayout ? 146 : 130;
            decorativeGlowRight = isCompactLayout ? 14 : isLargeLayout ? 20 : 16;
            decorativeGlowTop = isCompactLayout ? 28 : isLargeLayout ? 26 : 28;
            decorativeContentPaddingRight = isCompactLayout ? 108 : isLargeLayout ? 152 : 136;
            customGlowColor = 'rgba(221, 187, 115, 0.16)';
        } else if (periodKey === 'Maghrib') {
            decorativeImageSize = isCompactLayout ? 124 : isLargeLayout ? 164 : 146;
            decorativeImageRight = isCompactLayout ? 4 : 6;
            decorativeImageBottom = isCompactLayout ? 36 : isLargeLayout ? 30 : 32;
            decorativeImageOpacity = isCompactLayout ? 0.95 : 0.97;
            decorativeGlowSize = isCompactLayout ? 118 : isLargeLayout ? 154 : 138;
            decorativeGlowRight = isCompactLayout ? 12 : isLargeLayout ? 16 : 14;
            decorativeGlowTop = isCompactLayout ? 28 : isLargeLayout ? 24 : 26;
            decorativeContentPaddingRight = isCompactLayout ? 114 : isLargeLayout ? 160 : 142;
            customGlowColor = 'rgba(240, 176, 141, 0.16)';
        } else if (periodKey === 'Isha') {
            decorativeImageSize = isCompactLayout ? 146 : isLargeLayout ? 188 : 168;
            decorativeImageRight = isCompactLayout ? -10 : isLargeLayout ? -6 : -8;
            decorativeImageBottom = isCompactLayout ? 22 : isLargeLayout ? 16 : 18;
            decorativeImageOpacity = isCompactLayout ? 0.95 : 0.97;
            decorativeGlowSize = isCompactLayout ? 136 : isLargeLayout ? 176 : 158;
            decorativeGlowRight = isCompactLayout ? 8 : isLargeLayout ? 10 : 8;
            decorativeGlowTop = isCompactLayout ? 20 : isLargeLayout ? 18 : 20;
            decorativeContentPaddingRight = isCompactLayout ? 108 : isLargeLayout ? 146 : 126;
            customGlowColor = 'rgba(111, 134, 198, 0.16)';
        }
    }

    const decorativeAsset = HERO_ASSETS[periodKey];
    const hasDecorativeImage = showDecorativeImage && Boolean(decorativeAsset);
    const nextLabelText = isPassengerMode
        ? t('common.prayer_times').toUpperCase()
        : getHeroCountdownTitle({
            periodKey,
            fallbackLabel: targetPrayer?.label || t(`prayer.${targetPrayer?.key?.toLowerCase()}`),
        });

    return (
        <Animated.View style={[styles.container, entranceStyle, scaleStyle]}>
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={onPress}
                style={[styles.card, tokens2026.elevation.focused]}
            >
                {Platform.OS === 'ios' ? (
                    <BlurView
                        intensity={tokens2026.glass.blurRadius}
                        tint="dark"
                        style={StyleSheet.absoluteFill}
                    />
                ) : null}
                <View style={styles.surfaceTone} />
                <View pointerEvents="none" style={styles.ambientLayer}>
                    <View
                        style={[
                            styles.primaryGlow,
                            isCompactLayout && styles.primaryGlowCompact,
                            hasDecorativeImage && {
                                right: decorativeGlowRight,
                                top: decorativeGlowTop,
                                width: decorativeGlowSize,
                                height: decorativeGlowSize,
                                opacity: isCompactLayout ? 0.78 : 0.88,
                            },
                            { backgroundColor: customGlowColor },
                        ]}
                    />
                    <View style={[styles.secondaryGlow, isCompactLayout && styles.secondaryGlowCompact, { backgroundColor: visual.glowSecondary }]} />
                    <View
                        style={[
                            styles.heroVisualStage,
                            hasDecorativeImage && styles.heroVisualStageImage,
                            !hasDecorativeImage && styles.heroVisualStageIcon,
                            !hasDecorativeImage && isCompactLayout && styles.heroVisualStageCompact,
                            hasDecorativeImage && isCompactLayout && styles.heroVisualStageImageCompact,
                            hasDecorativeImage && {
                                right: decorativeImageRight,
                                bottom: decorativeImageBottom,
                                width: decorativeImageSize,
                                height: decorativeImageSize,
                                opacity: decorativeImageOpacity,
                            },
                        ]}
                        key={`hero-visual-stage-${periodKey}`}
                    >
                        {hasDecorativeImage ? (
                            <Image
                                key={`hero-visual-image-${periodKey}`}
                                source={decorativeAsset}
                                resizeMode="contain"
                                style={[styles.decorativeImage, isCompactLayout && styles.decorativeImageCompact]}
                            />
                        ) : (
                            <PeriodAmbientIcon period={periodKey} color={visual.iconColor} compact={isCompactLayout} />
                        )}
                    </View>
                </View>

                <View style={[
                    styles.content,
                    isCompactLayout && styles.contentCompact,
                    hasDecorativeImage && { paddingRight: decorativeContentPaddingRight },
                ]}>
                    <View style={[styles.nextChip, { backgroundColor: visual.chipBackground, borderColor: visual.chipBorder }]}>
                        <Text style={styles.nextLabel}>
                            {nextLabelText}
                        </Text>
                    </View>
                    <Text
                        style={styles.timer}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.82}
                    >
                        {isPassengerMode ? (current?.time || '--:--') : countdown}
                    </Text>

                    {!isPassengerMode && (
                        <View style={[styles.progressTrack, { backgroundColor: visual.progressTrack }]}>
                            <Animated.View style={[
                                styles.progressBar,
                                {
                                    width: `${progress * 100}%`,
                                    backgroundColor: visual.accent,
                                    shadowColor: visual.accent,
                                }
                            ]}>
                                <View style={styles.progressShine} />
                            </Animated.View>
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
                            size="SMALL"
                            gradient={isRamadanMonth ? "RAMADAN_MOON" : "PRAYER_GOLD"}
                            interactive
                            onPress={onPress}
                            pulse={isNearPrayer}
                            source="HeroPrayerCard"
                            style={styles.moonIcon}
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
        minHeight: 188,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(216, 181, 106, 0.20)',
        backgroundColor: '#121923',
    },
    surfaceTone: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Platform.OS === 'ios'
            ? 'rgba(10, 13, 20, 0.34)'
            : 'rgba(12, 18, 28, 0.92)',
    },
    ambientLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    heroVisualStage: {
        position: 'absolute',
        right: 18,
        width: 82,
        height: 82,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.94,
    },
    heroVisualStageIcon: {
        top: 26,
    },
    heroVisualStageImage: {
        right: 12,
        bottom: 28,
        width: 168,
        height: 168,
        opacity: 1,
        zIndex: 2,
        elevation: 2,
    },
    heroVisualStageCompact: {
        right: 14,
        top: 24,
        width: 64,
        height: 64,
        opacity: 0.86,
    },
    heroVisualStageImageCompact: {
        right: 10,
        bottom: 34,
        width: 132,
        height: 132,
        opacity: 0.92,
    },
    primaryGlow: {
        position: 'absolute',
        right: -12,
        top: 12,
        width: 124,
        height: 124,
        borderRadius: 999,
        opacity: 0.9,
    },
    primaryGlowCompact: {
        right: -12,
        top: 26,
        width: 92,
        height: 92,
        opacity: 0.72,
    },
    secondaryGlow: {
        position: 'absolute',
        right: 42,
        top: 54,
        width: 72,
        height: 72,
        borderRadius: 999,
        opacity: 0.9,
    },
    secondaryGlowCompact: {
        right: 34,
        top: 56,
        width: 48,
        height: 48,
        opacity: 0.62,
    },
    periodIconWrap: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    decorativeImage: {
        width: '100%',
        height: '100%',
        opacity: 0.98,
        zIndex: 2,
    },
    decorativeImageCompact: {
        opacity: 0.88,
    },
    periodAccentTop: {
        position: 'absolute',
        top: 4,
        right: 6,
    },
    periodAccentCluster: {
        position: 'absolute',
        top: 8,
        right: 10,
    },
    periodAccentOffset: {
        position: 'absolute',
        top: 14,
        right: 18,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 22,
        paddingRight: 112,
        justifyContent: 'center',
        alignItems: 'stretch',
    },
    contentImage: {
        paddingRight: 144,
    },
    contentCompact: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingRight: 82,
    },
    contentImageCompact: {
        paddingRight: 106,
    },
    nextChip: {
        alignSelf: 'flex-start',
        minHeight: 28,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        marginBottom: 12,
    },
    nextLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.86)',
        fontWeight: '800',
        letterSpacing: 1.1,
    },
    timer: {
        fontSize: 42,
        color: tokens2026.colors.text.primary,
        fontWeight: '800',
        letterSpacing: -1,
        fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
        textShadowColor: 'rgba(0,0,0,0.12)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    progressTrack: {
        width: '100%',
        height: 4,
        borderRadius: 999,
        marginTop: 16,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 999,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
    },
    progressShine: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 22,
        backgroundColor: 'rgba(255,255,255,0.24)',
        opacity: 0.55,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: 18,
    },
    footerLeft: {
        flex: 1,
    },
    currentInfo: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.78)',
        fontWeight: '600',
    },
    bold: {
        fontWeight: '700',
        color: tokens2026.colors.text.primary,
    },
    footerTime: {
        fontSize: 13,
        color: tokens2026.colors.text.secondary,
        fontWeight: '600',
        marginTop: 3,
    },
    moonIcon: {
        opacity: 0.88,
        transform: [{ scale: 0.92 }],
    },
});
