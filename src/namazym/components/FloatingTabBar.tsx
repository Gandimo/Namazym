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
import {
    CrescentIcon,
    QiblaIcon,
    BeadsIcon,
} from './icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ACTIVE_COLOR = '#3D341E';

interface TabItem {
    id: string;
    label: string;
    icon: string;
    onTap: {
        action: string;
        destination: string;
        params?: any;
    };
}

const ITEMS: TabItem[] = [
    {
        id: 'gurhan_item',
        label: 'Gurhan',
        icon: 'moon-outline',
        onTap: {
            action: 'navigateTo',
            destination: 'QuranMain',
            params: { screen: 'Index' },
        },
    },
    {
        id: 'kybla_item',
        label: 'Kybla',
        icon: 'compass-outline',
        onTap: {
            action: 'navigateTo',
            destination: 'QiblaScreen',
        },
    },
    {
        id: 'tesbih_item',
        label: 'Tesbih',
        icon: 'beads-custom',
        onTap: {
            action: 'navigateTo',
            destination: 'TasbihScreen',
        },
    },
];

export function FloatingTabBar({ navigation, activeId = 'home' }: { navigation: any, activeId?: string }) {
    const insets = useSafeAreaInsets();
    const popAnim = useRef(new Animated.Value(0)).current;

    const handlePress = (item: TabItem) => {
        // animate_pop_up 300ms
        Animated.sequence([
            Animated.timing(popAnim, {
                toValue: -15,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(popAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();

        if (item.onTap.action === 'navigateTo') {
            navigation.navigate(item.onTap.destination, item.onTap.params);
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    bottom: insets.bottom + 24,
                    transform: [{ translateY: popAnim }],
                },
            ]}
        >
            <View style={styles.inner}>
                {ITEMS.map((item) => {
                    const isActive = activeId === item.id;

                    return (
                        <Pressable
                            key={item.id}
                            onPress={() => handlePress(item)}
                            style={styles.item}
                        >
                            <View style={styles.iconWrapper}>
                                {item.id === 'gurhan_item' && <CrescentIcon size={26} color={ACTIVE_COLOR} />}
                                {item.id === 'kybla_item' && <QiblaIcon size={26} color={ACTIVE_COLOR} />}
                                {item.id === 'tesbih_item' && <BeadsIcon size={26} color={ACTIVE_COLOR} />}
                            </View>
                            <Text style={[styles.label, { color: ACTIVE_COLOR }]}>
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
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 38,
        borderWidth: 1.2,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
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
