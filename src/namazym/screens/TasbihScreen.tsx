import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Animated, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '../components/icons/PremiumIcon';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import { TasbihStorageService } from '../services/TasbihStorageService';
import { HapticService } from '../services/HapticService';
import { getBoundedContentWidth, getResponsiveLayoutMetrics } from '../utils/responsiveLayout';

const SKY_THEMES = {
    Fajr: ['#B9CAD8', '#E8EFF4'],
    Sunrise: ['#E4C8AE', '#F6E6D4'],
    Dhuhr: ['#D5E0E7', '#F3EFE8'],
    Asr: ['#E0C9B0', '#F2E1CF'],
    Maghrib: ['#9A756C', '#DEC0AE'],
    Isha: ['#222A3A', '#151B26'],
};

const COLORS = {
    white: '#FFFFFF',
    glassCard: 'rgba(255, 255, 255, 0.95)',
    textPrimary: '#1A1A1A',
    textSecondary: '#555555',
    gold: '#C4A050',
    glassBorder: 'rgba(0,0,0,0.02)',
};

export default function TasbihScreen() {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();
    const { prayerTimes } = useCity();
    const responsiveLayout = useMemo(() => getResponsiveLayoutMetrics(width), [width]);
    const contentWidth = useMemo(
        () => getBoundedContentWidth(width, responsiveLayout.horizontalPadding, responsiveLayout.compactContentMaxWidth),
        [responsiveLayout.compactContentMaxWidth, responsiveLayout.horizontalPadding, width],
    );
    const interactionWidth = useMemo(
        () => Math.min(contentWidth, responsiveLayout.isTablet ? 520 : contentWidth),
        [contentWidth, responsiveLayout.isTablet],
    );
    const counterShellSize = useMemo(
        () => Math.min(
            responsiveLayout.isTablet ? interactionWidth * 0.82 : width * 0.8,
            responsiveLayout.isTablet ? 440 : 360,
        ),
        [interactionWidth, responsiveLayout.isTablet, width],
    );
    const counterCircleSize = useMemo(
        () => Math.min(counterShellSize * 0.9, responsiveLayout.isTablet ? 390 : 320),
        [counterShellSize, responsiveLayout.isTablet],
    );

    const [count, setCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [limit, setLimit] = useState(33);

    const pressScale = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const load = async () => {
            const { count: c, total: t, limit: l } = await TasbihStorageService.getState();
            setCount(c);
            setTotalCount(t);
            setLimit(l);
        };
        load();
    }, []);

    useEffect(() => {
        const save = async () => {
            await TasbihStorageService.saveState({ count, total: totalCount, limit });
        };
        save();
    }, [count, totalCount, limit]);

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;
    const isDark = currentPrayer === 'Isha' || currentPrayer === 'Maghrib';
    const fg = isDark ? '#FFFFFF' : '#2D2D35';
    const fgSoft = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(45,45,53,0.55)';
    const fgMedium = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(45,45,53,0.65)';
    const glassBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)';
    const glassBorder = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)';
    const dotInactive = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)';
    const cycleProgress = useMemo(() => Math.max(0, Math.min(1, limit > 0 ? count / limit : 0)), [count, limit]);
    const progressDots = useMemo(() => {
        const dotCount = Math.min(limit, 11);
        const activeDots = Math.round(cycleProgress * dotCount);
        return Array.from({ length: dotCount }, (_, index) => index < activeDots);
    }, [cycleProgress, limit]);

    const animatePress = () => {
        pressScale.stopAnimation();
        Animated.sequence([
            Animated.timing(pressScale, {
                toValue: 0.975,
                duration: 55,
                useNativeDriver: true,
            }),
            Animated.spring(pressScale, {
                toValue: 1,
                friction: 8,
                tension: 110,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const animateCompletion = () => {
        glowAnim.setValue(0);
        Animated.sequence([
            Animated.timing(glowAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
                toValue: 0,
                duration: 420,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const increment = () => {
        HapticService.softImpact();
        animatePress();

        const nextCount = count + 1;
        if (nextCount > limit) {
            setCount(1);
            HapticService.success();
            animateCompletion();
        } else {
            setCount(nextCount);
        }
        setTotalCount(prev => prev + 1);
    };

    const resetCurrent = () => {
        setCount(0);
    };

    const toggleLimit = () => {
        setLimit(limit === 33 ? 99 : 33);
        setCount(0);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <LinearGradient colors={theme as any} style={Sheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={[styles.header, { width: contentWidth, alignSelf: 'center' }]}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <PremiumIcon
                            name="chevron-back"
                            size="STANDARD"
                            color={fg}
                            interactive
                            onPress={() => navigation.goBack()}
                            source="TasbihScreen"
                        />
                    </Pressable>
                    <View style={styles.titleBox}>
                        <Text style={[styles.title, { color: fg }]}>TESBIH</Text>
                        <Text style={[styles.subtitle, { color: fgSoft }]}>ZIKIR HASAPLAÝYŞ</Text>
                    </View>
                    <Pressable onPress={toggleLimit} style={styles.limitBox}>
                        <Text style={styles.limitText}>{limit}</Text>
                    </Pressable>
                </View>

                <View style={[styles.content, { paddingHorizontal: responsiveLayout.horizontalPadding }]}>
                    <View style={[styles.contentColumn, { width: contentWidth }]}>
                    <View style={[styles.statsRow, { width: interactionWidth, alignSelf: 'center' }]}>
                        <View style={[styles.statBox, { backgroundColor: glassBg }]}>
                            <Text style={[styles.statLabel, { color: fgSoft }]}>UMUMY</Text>
                            <Text style={[styles.statValue, { color: fg }]}>{totalCount}</Text>
                        </View>
                        <Pressable onPress={resetCurrent} style={[styles.resetBtn, { backgroundColor: glassBg }]}>
                            <PremiumIcon
                                name="refresh"
                                size="SMALL"
                                color={fg}
                                interactive
                                onPress={resetCurrent}
                            />
                        </Pressable>
                    </View>

                    <Pressable onPress={increment} style={[styles.mainArea, { width: interactionWidth, alignSelf: 'center' }]}>
                        <Animated.View
                            style={[
                                styles.counterShell,
                                {
                                    width: counterShellSize,
                                    height: counterShellSize,
                                },
                                {
                                    opacity: glowAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 0.985],
                                    }),
                                },
                            ]}
                        >
                            <Animated.View
                            style={[
                                styles.counterCircle,
                                {
                                    width: counterCircleSize,
                                    height: counterCircleSize,
                                    borderRadius: counterCircleSize / 2,
                                    transform: [{ scale: pressScale }],
                                    borderColor: glowAnim.interpolate({
                                        inputRange: [0, 1],
                                            outputRange: ['rgba(255,255,255,0.12)', 'rgba(196,160,80,0.45)'],
                                        }),
                                    },
                                ]}
                            >
                                <View style={styles.beadHighlight} />
                                <View style={styles.beadInnerShadow} />
                                <Text style={styles.countText}>{count}</Text>
                                <Text style={styles.limitSubText}>/ {limit}</Text>
                                <Text style={styles.beadLabel}>Zikir sany</Text>
                            </Animated.View>
                        </Animated.View>
                        <View style={[styles.beadProgressCard, { width: interactionWidth, backgroundColor: glassBg, borderColor: glassBorder }]}>
                            <View style={styles.beadProgressHeader}>
                                <Text style={[styles.beadProgressTitle, { color: fgMedium }]}>Agyzbir halka</Text>
                                <Text style={[styles.beadProgressValue, { color: fg }]}>{count}/{limit}</Text>
                            </View>
                            <View style={styles.beadRow}>
                                {progressDots.map((isActive, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.beadDot,
                                            isActive ? styles.beadDotActive : [styles.beadDotInactive, { backgroundColor: dotInactive }],
                                            index === progressDots.length - 1 && styles.beadDotLast,
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                        <Text style={[styles.tapTip, { color: fgSoft }]}>EKRANA BASYŇ</Text>
                    </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const Sheet = StyleSheet;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    titleBox: { alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 4, marginTop: 2 },
    limitBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
    limitText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
    content: { flex: 1, paddingVertical: 32, justifyContent: 'space-between' },
    contentColumn: { flex: 1, width: '100%', alignSelf: 'center', justifyContent: 'space-between' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statBox: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
    statLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
    statValue: { fontSize: 18, fontWeight: '800', color: '#FFF', marginTop: 2 },
    resetBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    mainArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    counterShell: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    counterCircle: {
        backgroundColor: COLORS.glassCard,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)',
        shadowColor: '#0B0B0F',
        shadowOpacity: 0.16,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 16 },
        overflow: 'hidden',
    },
    beadHighlight: {
        position: 'absolute',
        top: 18,
        width: '72%',
        height: '24%',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    beadInnerShadow: {
        position: 'absolute',
        bottom: 14,
        width: '78%',
        height: '22%',
        borderRadius: 999,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    countText: { fontSize: 80, fontWeight: '900', color: COLORS.textPrimary },
    limitSubText: { fontSize: 16, fontWeight: '800', color: COLORS.gold, marginTop: 8 },
    beadLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.textSecondary,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginTop: 12,
    },
    beadProgressCard: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.14)',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        marginBottom: 18,
    },
    beadProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    beadProgressTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.72)',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    beadProgressValue: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFF',
    },
    beadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    beadDot: {
        height: 10,
        borderRadius: 999,
        marginRight: 6,
    },
    beadDotActive: {
        flex: 1.05,
        backgroundColor: COLORS.gold,
    },
    beadDotInactive: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    beadDotLast: {
        marginRight: 0,
    },
    tapTip: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 3, marginTop: 18 }
});
