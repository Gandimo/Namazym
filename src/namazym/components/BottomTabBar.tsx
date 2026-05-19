/**
 * BottomTabBar — Spiritual Quiet Luxury Navigation
 *
 * 4 Tabs: Kybla ugruny tap · Kuran · Dogalar · Namaz Kitaby
 *
 * Design Spec:
 *  - Warm off-white frosted panel (no expo-blur dependency)
 *  - Active tab: 10% gold background pill + gold label + indicator dot
 *  - Inactive tab: muted icon only
 *  - Press: spring 0.88 scale (Sacred Interaction Model)
 *  - 420ms fade-up entry animation on mount
 */
import React, { useRef, useEffect } from 'react';
import {
    View, Text, Pressable, StyleSheet, Animated, Platform, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QiblaIcon, BookIcon, BeadsIcon, CrescentIcon } from './icons';

// ─── Colors ───────────────────────────────────────────────────────────────────
const GOLD = '#C4A050';
const MUTED = 'rgba(60, 50, 30, 0.32)';
const ACTIVE_PILL = 'rgba(196, 160, 80, 0.10)';
const BAR_BG = Platform.select({
    ios: 'rgba(253, 250, 244, 0.88)',
    android: 'rgba(253, 250, 244, 0.97)',
    default: 'rgba(253, 250, 244, 0.97)',
});

// ─── Tab Definitions ──────────────────────────────────────────────────────────
const TABS = [
    {
        key: 'Kybla',
        label: 'Kybla ugruny tap',
        Icon: QiblaIcon,
    },
    {
        key: 'QuranReader',
        label: 'Kuran',
        Icon: CrescentIcon,
    },
    {
        key: 'Dogalar',
        label: 'Dogalar',
        Icon: BeadsIcon,
    },
    {
        key: 'NamazKitaby',
        label: 'Namaz Kitaby',
        Icon: BookIcon,
    },
] as const;

// ─── Tab Item ─────────────────────────────────────────────────────────────────
function TabItem({
    tab,
    isActive,
    onPress,
}: {
    tab: typeof TABS[number];
    isActive: boolean;
    onPress: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const activeAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(activeAnim, {
            toValue: isActive ? 1 : 0,
            duration: 420,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
        }).start();
    }, [isActive]);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.88,
            useNativeDriver: true,
            speed: 14,
            bounciness: 0,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 12,
            bounciness: 5,
        }).start();
    };

    const iconColor = isActive ? GOLD : MUTED;

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.tabPressable}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
        >
            <Animated.View style={[styles.tabItem, { transform: [{ scale: scaleAnim }] }]}>
                {/* Active Glow Pill */}
                <Animated.View
                    style={[
                        styles.activePill,
                        {
                            backgroundColor: ACTIVE_PILL,
                            opacity: activeAnim,
                        },
                    ]}
                />

                {/* Icon */}
                <View style={styles.iconWrap}>
                    <tab.Icon size={22} color={iconColor} />
                </View>

                {/* Label — fades in when active */}
                <Animated.Text
                    numberOfLines={1}
                    style={[styles.tabLabel, { color: GOLD, opacity: activeAnim }]}
                >
                    {tab.label}
                </Animated.Text>

                {/* Active Indicator Dot */}
                <Animated.View style={[styles.indicatorDot, { opacity: activeAnim }]} />
            </Animated.View>
        </Pressable>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface BottomTabBarProps {
    navigation: any;
    activeRoute?: string;
}

export function BottomTabBar({ navigation, activeRoute }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const mountAnim = useRef(new Animated.Value(0)).current;

    // Sacred Interaction: deliberate entry animation (300ms delay)
    useEffect(() => {
        Animated.timing(mountAnim, {
            toValue: 1,
            duration: 500,
            delay: 300,
            easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            useNativeDriver: true,
        }).start();
    }, []);

    const translateY = mountAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [24, 0],
    });

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    paddingBottom: insets.bottom,
                    opacity: mountAnim,
                    transform: [{ translateY }],
                },
            ]}
            pointerEvents="box-none"
        >
            {/* Frosted glass separator */}
            <View style={styles.separatorLine} />

            {/* Tab Items */}
            <View style={styles.inner}>
                {TABS.map((tab) => (
                    <TabItem
                        key={tab.key}
                        tab={tab}
                        isActive={activeRoute === tab.key}
                        onPress={() => navigation.navigate(tab.key)}
                    />
                ))}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: BAR_BG,
        shadowColor: '#8B7340',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -4 },
        elevation: 8,
    },
    separatorLine: {
        height: 0.5,
        backgroundColor: 'rgba(196, 160, 80, 0.22)',
        marginHorizontal: 24,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        height: 58,
    },
    tabPressable: {
        flex: 1,
        alignItems: 'center',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        minHeight: 46,
        gap: 3,
    },
    activePill: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 14,
    },
    iconWrap: {
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabLabel: {
        fontSize: 9.5,
        fontWeight: '600',
        letterSpacing: 0.3,
        textAlign: 'center',
        marginTop: 1,
    },
    indicatorDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: GOLD,
        marginTop: 2,
    },
});
