import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens2026 } from '../theme/tokens2026';

const ShimmerBox = ({ width, height, borderRadius = 4, style }: any) => {
    // `width` also arrives as a percentage string (e.g. "100%"), which cannot seed
    // a numeric Animated.Value — `-"100%"` is NaN, and a NaN transform handed to
    // the native driver is rejected on the native side. Measure the rendered box
    // instead and keep the shimmer idle until a real pixel width is known.
    const [trackWidth, setTrackWidth] = useState(typeof width === 'number' ? width : 0);
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!Number.isFinite(trackWidth) || trackWidth <= 0) return;

        translateX.setValue(-trackWidth);
        const shimmer = Animated.loop(
            Animated.timing(translateX, {
                toValue: trackWidth,
                duration: 1500,
                useNativeDriver: true,
            })
        );
        shimmer.start();

        // The skeleton unmounts as soon as prayer times resolve. Without this the
        // native-driven loop keeps animating a node that no longer exists.
        return () => shimmer.stop();
    }, [trackWidth, translateX]);

    const handleLayout = (event: LayoutChangeEvent) => {
        const next = Math.round(event.nativeEvent.layout.width);
        setTrackWidth(previous => (previous === next ? previous : next));
    };

    return (
        <View style={[styles.baseBox, { width, height, borderRadius }, style]} onLayout={handleLayout}>
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
