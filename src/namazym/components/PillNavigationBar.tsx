import React from 'react';
import { View, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { tokens2026 } from '../theme/tokens2026';
import { BookIcon, BeadsIcon, MosqueIcon } from './icons';

const { width } = Dimensions.get('window');

interface NavItem {
    id: string;
    icon: string;
    library: 'Feather' | 'Ionicons';
    label: string;
    customIcon?: React.ComponentType<any>;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'Home', icon: 'home', library: 'Feather', label: 'Ana' },
    { id: 'QuranMain', icon: 'book', library: 'Feather', label: 'Gurhan', customIcon: BookIcon },
    { id: 'TasbihScreen', icon: 'activity', library: 'Feather', label: 'Tasbih', customIcon: BeadsIcon },
    { id: 'Metjitler', icon: 'business-outline', library: 'Ionicons', label: 'Metjit', customIcon: MosqueIcon },
];

export const PillNavigationBar = ({ navigation, activeRoute = 'Home' }: any) => {
    return (
        <View style={[styles.container, tokens2026.elevation.soft]}>
            <BlurView
                intensity={tokens2026.glass.blurRadius}
                tint="dark"
                style={StyleSheet.absoluteFill}
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: tokens2026.colors.surface.glass }]} />

            <View style={styles.navContent}>
                {NAV_ITEMS.map((item) => {
                    const isActive = activeRoute === item.id;
                    const IconComponent = item.library === 'Feather' ? Feather : Ionicons;

                    return (
                        <Pressable
                            key={item.id}
                            onPress={() => {
                                Haptics.selectionAsync();
                                navigation.navigate(item.id);
                            }}
                            style={styles.navItem}
                        >
                            {isActive && <View style={styles.activeIndicator} />}
                            {item.customIcon ? (
                                <item.customIcon
                                    size={24}
                                    color={isActive ? tokens2026.colors.accent : tokens2026.colors.text.secondary}
                                />
                            ) : (
                                <IconComponent
                                    name={item.icon as any}
                                    size={24}
                                    color={isActive ? tokens2026.colors.accent : tokens2026.colors.text.secondary}
                                />
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 30,
        left: 20,
        right: 20,
        height: 70,
        borderRadius: 35,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        zIndex: 50,
    },
    navContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '100%',
        paddingHorizontal: 10,
    },
    navItem: {
        width: 60,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
    },
    activeIndicator: {
        position: 'absolute',
        width: 48,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(111, 168, 255, 0.08)', // Accent Glass
    }
});
