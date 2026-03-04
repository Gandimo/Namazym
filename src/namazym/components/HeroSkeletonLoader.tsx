import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens2026 } from '../theme/tokens2026';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ShimmerBox = ({ width, height, borderRadius = 4, style }: any) => {
    const translateX = useRef(new Animated.Value(-width)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(translateX, {
                toValue: width,
                duration: 1500,
                useNativeDriver: true,
            })
        ).start();
    }, [width]);

    return (
        <View style={[styles.baseBox, { width, height, borderRadius }, style]}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.12)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

export const HeroSkeletonLoader = () => {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: tokens2026.colors.surface.glass }]} />
                <View style={styles.content}>
                    <ShimmerBox width={80} height={12} style={{ marginBottom: 16 }} />
                    <ShimmerBox width={140} height={42} style={{ marginBottom: 24 }} />
                    <ShimmerBox width="100%" height={3} style={{ borderRadius: 2 }} />
                    <View style={styles.footer}>
                        <ShimmerBox width={60} height={10} />
                        <ShimmerBox width={40} height={10} />
                    </View>
                </View>
            </View>
        </View>
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
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    baseBox: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        overflow: 'hidden',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
    },
});
