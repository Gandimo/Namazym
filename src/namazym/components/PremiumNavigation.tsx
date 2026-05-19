import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
    CrescentIcon,
    QiblaIcon,
    BeadsIcon,
} from './icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NavigationItem {
    id: string;
    label: string;
    icon: string;
    destination: string;
    action: 'navigateTo' | 'openCompass' | 'openDhikr';
    haptic?: Haptics.ImpactFeedbackStyle;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
    {
        id: 'gurhan',
        label: 'Gurhan',
        icon: 'quran_icon',
        destination: 'QuranListScreen',
        action: 'navigateTo',
    },
    {
        id: 'kybla',
        label: 'Kybla',
        icon: 'compass_icon',
        destination: 'QiblaScreen',
        action: 'openCompass',
    },
    {
        id: 'tesbih',
        label: 'Tesbih',
        icon: 'beads_icon',
        destination: 'TasbihScreen',
        action: 'openDhikr',
        haptic: Haptics.ImpactFeedbackStyle.Light,
    },
];

export function PremiumNavigation({ navigation, activeId = 'home' }: { navigation: any, activeId?: string }) {
    const insets = useSafeAreaInsets();
    const popAnim = useRef(new Animated.Value(0)).current;

    const handlePress = (item: NavigationItem) => {
        if (item.haptic) {
            Haptics.impactAsync(item.haptic);
        }

        // premium_pop_animation 300ms
        Animated.sequence([
            Animated.timing(popAnim, {
                toValue: -12,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(popAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();

        navigation.navigate(item.destination);
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    bottom: insets.bottom + 30,
                    transform: [{ translateY: popAnim }],
                },
            ]}
        >
            <View style={styles.inner}>
                {NAVIGATION_ITEMS.map((item) => {
                    const isActive = activeId === item.id;
                    const color = 'rgba(255, 255, 255, 0.9)';

                    return (
                        <Pressable
                            key={item.id}
                            onPress={() => handlePress(item)}
                            style={styles.item}
                        >
                            <View style={styles.iconWrapper}>
                                {item.id === 'gurhan' && <CrescentIcon size={26} color={color} />}
                                {item.id === 'kybla' && <QiblaIcon size={26} color={color} />}
                                {item.id === 'tesbih' && <BeadsIcon size={26} color={color} />}
                            </View>
                            <Text style={[styles.label, { color }]}>
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignSelf: 'center',
        width: '92%',
        maxWidth: 400,
        height: 75,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        zIndex: 1000,
        overflow: 'hidden',
    },
    inner: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    item: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    iconWrapper: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
});
