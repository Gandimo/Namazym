import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VAKIT_PALETTES, VAKIT_TO_PALETTE } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GOLD = '#C9A84C';
const INACTIVE_LIGHT = 'rgba(0,0,0,0.35)';
const INACTIVE_DARK = 'rgba(255,255,255,0.40)';

interface NavigationItem {
    id: string;
    label: string;
    icon: string;
    destination: string;
    params?: any;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
    {
        id: 'gurhan_btn',
        label: 'Gurhan',
        icon: 'book',
        destination: 'QuranMain',
    },
    {
        id: 'kybla_btn',
        label: 'Kybla',
        icon: 'compass',
        destination: 'QiblaScreen',
    },
    {
        id: 'home',
        label: 'Ana',
        icon: 'home',
        destination: 'Home',
    },
    {
        id: 'tesbih_btn',
        label: 'Tesbih',
        icon: 'disc', // Using disc to represent Tesbih/Circle
        destination: 'TasbihScreen',
    },
    {
        id: 'profil_btn',
        label: 'Profil',
        icon: 'person',
        destination: 'Settings',
    },
];

export function BottomNavigation({
    navigation,
    activeId = 'home',
    next,
}: {
    navigation: any,
    activeId?: string,
    next?: any,
}) {
    const insets = useSafeAreaInsets();

    // Check if it's night mode based on next prayer
    const isNight = next?.key === 'Fajr' || next?.key === 'Isha' || next?.key === 'Sunrise';

    return (
        <View style={styles.outerContainer}>
            <View
                style={[
                    styles.container,
                    isNight ? styles.containerNight : styles.containerLight
                ]}
            >
                {NAVIGATION_ITEMS.map((item) => (
                    <NavItem
                        key={item.id}
                        item={item}
                        isActive={activeId === item.id}
                        onPress={() => navigation.navigate(item.destination, item.params)}
                        isNight={isNight}
                    />
                ))}
            </View>
        </View>
    );
}

function NavItem({ item, isActive, onPress, isNight }: {
    item: NavigationItem,
    isActive: boolean,
    onPress: () => void,
    isNight: boolean
}) {
    const iconColor = isActive ? GOLD : (isNight ? INACTIVE_DARK : INACTIVE_LIGHT);

    return (
        <Pressable onPress={onPress} style={styles.navItem}>
            <View style={{ alignItems: 'center' }}>
                <View style={styles.iconWrapper}>
                    <Ionicons
                        name={isActive ? (item.icon as any) : (`${item.icon}-outline` as any)}
                        size={24}
                        color={iconColor}
                    />
                </View>

                {isActive && (
                    <View style={styles.activeIndicator} />
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        position: 'absolute',
        bottom: 24, // 24px gap from bottom edge
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 1000,
    },
    container: {
        width: '85%', // Pill width
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        borderWidth: 1,
        // Glassmorphism shadows (Strong shadow spec)
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
        elevation: 10,
    },
    containerLight: {
        backgroundColor: "rgba(255,255,255,0.90)",
        borderColor: "rgba(255,255,255,0.60)",
    },
    containerNight: {
        backgroundColor: "rgba(15,15,25,0.80)",
        borderColor: "rgba(255,255,255,0.10)",
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    iconWrapper: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: GOLD,
        marginTop: 2,
    },
});
