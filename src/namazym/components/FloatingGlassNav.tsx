/**
 * FloatingGlassNav — Expandable Sacred Menu
 *
 * Behaviour:
 *  - COLLAPSED: small pill with menu icon + dot indicator (minimally intrusive)
 *  - EXPANDED: spring-animates wider to show 3 tabs with labels
 *  - Auto-collapse after navigation (400ms grace)
 *  - Tap outside (backdrop press) collapses it
 *  - prayer-aware color palettes (0=Fajr … 4=Isha)
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    View, Text, Pressable, StyleSheet,
    Animated, Easing, Platform, TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QiblaIcon, BookIcon, BeadsIcon } from './icons';

// ─── Types ────────────────────────────────────────────────────────────────────
export type PrayerIndex = 0 | 1 | 2 | 3 | 4;

interface PrayerPalette {
    active: string;
    muted: string;
    pillBg: string;
    pillBorder: string;
    glow: string;
    dot: string;
    sep: string;
    shadow: string;
    menuIcon: string;
}

// ─── Prayer Palettes ──────────────────────────────────────────────────────────
const PALETTES: Record<PrayerIndex, PrayerPalette> = {
    0: { // Fajr — lavender-blue dawn
        active: '#A8C0E8', muted: 'rgba(140,160,210,0.35)',
        pillBg: 'rgba(210,220,245,0.52)', pillBorder: 'rgba(160,185,230,0.45)',
        glow: 'rgba(140,165,220,0.18)', dot: '#A8C0E8',
        sep: 'rgba(140,170,220,0.30)', shadow: '#2A3A70',
        menuIcon: '#A8C0E8',
    },
    1: { // Dhuhr — warm gold
        active: '#C4A050', muted: 'rgba(100,80,30,0.32)',
        pillBg: 'rgba(255,250,238,0.55)', pillBorder: 'rgba(196,160,80,0.38)',
        glow: 'rgba(196,160,80,0.15)', dot: '#C4A050',
        sep: 'rgba(196,160,80,0.28)', shadow: '#6A4A08',
        menuIcon: '#C4A050',
    },
    2: { // Asr — amber orange
        active: '#D4873A', muted: 'rgba(140,80,20,0.32)',
        pillBg: 'rgba(255,238,215,0.52)', pillBorder: 'rgba(210,130,50,0.38)',
        glow: 'rgba(210,130,50,0.15)', dot: '#D4873A',
        sep: 'rgba(210,130,50,0.28)', shadow: '#6B3808',
        menuIcon: '#D4873A',
    },
    3: { // Maghrib — rose gold
        active: '#D4806A', muted: 'rgba(140,60,55,0.32)',
        pillBg: 'rgba(255,228,220,0.52)', pillBorder: 'rgba(210,110,90,0.38)',
        glow: 'rgba(210,110,90,0.15)', dot: '#D4806A',
        sep: 'rgba(200,100,85,0.28)', shadow: '#6A1810',
        menuIcon: '#D4806A',
    },
    4: { // Isha — moonlight silver on dark
        active: '#B8CCEE', muted: 'rgba(140,160,200,0.35)',
        pillBg: 'rgba(12,16,36,0.62)', pillBorder: 'rgba(160,190,240,0.30)',
        glow: 'rgba(140,170,230,0.14)', dot: '#B8CCEE',
        sep: 'rgba(140,175,230,0.22)', shadow: '#000510',
        menuIcon: '#B8CCEE',
    },
};

const TABS = [
    { key: 'Kybla', label: 'Pusula', Icon: QiblaIcon },
    { key: 'Dogalar', label: 'Dogalar', Icon: BeadsIcon },
    { key: 'NamazKitaby', label: 'Namaz Kitaby', Icon: BookIcon },
] as const;

const PILL_H = 52;
const COLLAPSED_W = 58;   // just the toggle button
const EXPANDED_W_PCT = 0.82; // fraction of screen
const FLOAT_BOTTOM = 20;

// ─── Menu Icon (3 dots) ───────────────────────────────────────────────────────
function MenuDots({ color }: { color: string }) {
    return (
        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
                <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
            ))}
        </View>
    );
}

// ─── Single Tab Button ────────────────────────────────────────────────────────
function TabBtn({
    tab, palette, isActive, isLast, onPress,
}: {
    tab: typeof TABS[number];
    palette: PrayerPalette;
    isActive: boolean;
    isLast: boolean;
    onPress: () => void;
}) {
    const scaleA = useRef(new Animated.Value(1)).current;
    const activeA = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(activeA, {
            toValue: isActive ? 1 : 0,
            duration: 280,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
        }).start();
    }, [isActive]);

    const onIn = () => Animated.spring(scaleA, { toValue: 0.86, useNativeDriver: true, speed: 16, bounciness: 0 }).start();
    const onOut = () => Animated.spring(scaleA, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 5 }).start();

    const iconScale = activeA.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

    return (
        <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut}
            hitSlop={10} style={styles.tabBtn} accessibilityRole="button" accessibilityLabel={tab.label}>
            {!isLast && <View style={[styles.sep, { backgroundColor: palette.sep }]} />}
            <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleA }] }]}>
                <Animated.View style={[styles.glow, { backgroundColor: palette.glow, opacity: activeA }]} />
                <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                    <tab.Icon size={20} color={isActive ? palette.active : palette.muted} />
                </Animated.View>
                <Animated.Text numberOfLines={1}
                    style={[styles.tabLabel, { color: palette.active, opacity: activeA }]}>
                    {tab.label}
                </Animated.Text>
                <Animated.View style={[styles.dot, { backgroundColor: palette.dot, opacity: activeA }]} />
            </Animated.View>
        </Pressable>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface FloatingGlassNavProps {
    navigation: any;
    activeRoute?: string;
    prayerIndex?: PrayerIndex;
    screenWidth?: number;
}

export function FloatingGlassNav({ navigation, activeRoute, prayerIndex = 1, screenWidth = 390 }: FloatingGlassNavProps) {
    const insets = useSafeAreaInsets();
    const palette = PALETTES[prayerIndex];

    const [expanded, setExpanded] = useState(false);

    // Anim refs
    const mountA = useRef(new Animated.Value(0)).current;
    const widthA = useRef(new Animated.Value(COLLAPSED_W)).current;
    const tabsOpA = useRef(new Animated.Value(0)).current;
    const menuOpA = useRef(new Animated.Value(1)).current;
    const rotA = useRef(new Animated.Value(0)).current;

    const expandedW = screenWidth * EXPANDED_W_PCT;

    // Entry on mount
    useEffect(() => {
        Animated.timing(mountA, {
            toValue: 1, duration: 500, delay: 400,
            easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true,
        }).start();
    }, []);

    const expand = useCallback(() => {
        setExpanded(true);
        Animated.parallel([
            Animated.spring(widthA, {
                toValue: expandedW, useNativeDriver: false,
                speed: 14, bounciness: 6,
            }),
            Animated.timing(tabsOpA, {
                toValue: 1, duration: 220, delay: 100,
                easing: Easing.out(Easing.ease), useNativeDriver: true,
            }),
            Animated.timing(menuOpA, {
                toValue: 0, duration: 100,
                easing: Easing.in(Easing.ease), useNativeDriver: true,
            }),
            Animated.timing(rotA, {
                toValue: 1, duration: 280,
                easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true,
            }),
        ]).start();
    }, [expandedW]);

    const collapse = useCallback(() => {
        Animated.parallel([
            Animated.spring(widthA, {
                toValue: COLLAPSED_W, useNativeDriver: false,
                speed: 16, bounciness: 5,
            }),
            Animated.timing(tabsOpA, {
                toValue: 0, duration: 120,
                easing: Easing.in(Easing.ease), useNativeDriver: true,
            }),
            Animated.timing(menuOpA, {
                toValue: 1, duration: 200, delay: 100,
                easing: Easing.out(Easing.ease), useNativeDriver: true,
            }),
            Animated.timing(rotA, {
                toValue: 0, duration: 280,
                easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true,
            }),
        ]).start(() => setExpanded(false));
    }, []);

    const toggle = () => (expanded ? collapse() : expand());

    const handleNav = (key: string) => {
        navigation.navigate(key);
        setTimeout(collapse, 180);
    };

    const translateY = mountA.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
    const menuRot = rotA.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

    return (
        <>
            {/* Invisible backdrop to collapse on outside tap */}
            {expanded && (
                <TouchableWithoutFeedback onPress={collapse}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>
            )}

            <Animated.View
                style={[styles.floatWrap, {
                    bottom: insets.bottom + FLOAT_BOTTOM,
                    opacity: mountA,
                    transform: [{ translateY }],
                }]}
                pointerEvents="box-none"
            >
                <Animated.View style={[
                    styles.pill,
                    {
                        width: widthA,
                        backgroundColor: palette.pillBg,
                        borderColor: palette.pillBorder,
                        shadowColor: palette.shadow,
                    },
                ]}>
                    {/* Toggle Button */}
                    <Pressable onPress={toggle} style={styles.toggleBtn}
                        accessibilityRole="button" accessibilityLabel={expanded ? 'Menüyü kapat' : 'Menüyü aç'}>
                        <Animated.View style={{ transform: [{ rotate: menuRot }], opacity: menuOpA }}>
                            <MenuDots color={palette.menuIcon} />
                        </Animated.View>
                        {expanded && (
                            <Animated.View style={{ position: 'absolute', opacity: tabsOpA }}>
                                {/* Close "×" when expanded: small symbol */}
                                <Text style={[styles.closeX, { color: palette.muted }]}>×</Text>
                            </Animated.View>
                        )}
                    </Pressable>

                    {/* Separator between toggle and tabs */}
                    {expanded && (
                        <View style={[styles.sep, { backgroundColor: palette.sep, marginHorizontal: 0 }]} />
                    )}

                    {/* Tab Items — visible when expanded */}
                    <Animated.View style={[styles.tabsRow, { opacity: tabsOpA }]}
                        pointerEvents={expanded ? 'auto' : 'none'}>
                        {TABS.map((tab, i) => (
                            <TabBtn
                                key={tab.key}
                                tab={tab}
                                palette={palette}
                                isActive={activeRoute === tab.key}
                                isLast={i === TABS.length - 1}
                                onPress={() => handleNav(tab.key)}
                            />
                        ))}
                    </Animated.View>
                </Animated.View>
            </Animated.View>
        </>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    floatWrap: {
        position: 'absolute',
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    pill: {
        height: PILL_H,
        borderRadius: PILL_H / 2,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        shadowOpacity: 0.22,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 10 },
        elevation: 16,
    },
    toggleBtn: {
        width: COLLAPSED_W,
        height: PILL_H,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    closeX: {
        fontSize: 22,
        fontWeight: '200',
        lineHeight: 24,
    },
    tabsRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: PILL_H,
    },
    tabInner: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        gap: 2,
    },
    glow: {
        position: 'absolute',
        inset: 0,
        borderRadius: 20,
    },
    tabLabel: {
        fontSize: 8.5,
        fontWeight: '600',
        letterSpacing: 0.3,
        textAlign: 'center',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    sep: {
        width: 0.5,
        height: 28,
        alignSelf: 'center',
        marginHorizontal: 2,
    },
});
