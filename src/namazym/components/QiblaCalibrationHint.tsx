/**
 * Figure-8 calibration prompt for the Qibla compass.
 *
 * Sweeping the phone through a figure 8 is what lets the platform re-estimate
 * the magnetometer's hard-iron offset. Almost nobody has been asked to do this
 * before, so the motion is drawn rather than described — a sentence alone does
 * not teach a gesture.
 *
 * Fully offline: a parametric curve and one looping transform. No image asset,
 * no network, nothing to load.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/** Points sampled along the curve; enough for a smooth path and interpolation. */
const SAMPLE_COUNT = 48;
const SWEEP_DURATION_MS = 2600;

interface Props {
    width?: number;
    height?: number;
    /** Colour of the traced path. */
    trackColor?: string;
    /** Colour of the travelling marker. */
    markerColor?: string;
}

export const QiblaCalibrationHint = React.memo(function QiblaCalibrationHint({
    width = 92,
    height = 40,
    trackColor = 'rgba(197, 162, 101, 0.34)',
    markerColor = '#E3C58D',
}: Props) {
    const progress = useRef(new Animated.Value(0)).current;

    // Gerono lemniscate — a true figure 8, centred on the origin.
    const points = useMemo(() => {
        const amplitudeX = width / 2 - 4;
        const amplitudeY = height / 2 - 4;
        return Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) => {
            const t = (index / SAMPLE_COUNT) * Math.PI * 2;
            return {
                x: Math.cos(t) * amplitudeX,
                y: (Math.sin(2 * t) / 2) * amplitudeY * 2,
            };
        });
    }, [height, width]);

    const pathData = useMemo(() => {
        const centreX = width / 2;
        const centreY = height / 2;
        return points
            .map((point, index) =>
                `${index === 0 ? 'M' : 'L'}${(centreX + point.x).toFixed(2)} ${(centreY + point.y).toFixed(2)}`,
            )
            .join(' ');
    }, [height, points, width]);

    useEffect(() => {
        const sweep = Animated.loop(
            Animated.timing(progress, {
                toValue: 1,
                duration: SWEEP_DURATION_MS,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        );
        sweep.start();
        return () => sweep.stop();
    }, [progress]);

    const inputRange = useMemo(
        () => points.map((_, index) => index / SAMPLE_COUNT),
        [points],
    );

    const translateX = progress.interpolate({
        inputRange,
        outputRange: points.map(point => point.x),
    });
    const translateY = progress.interpolate({
        inputRange,
        outputRange: points.map(point => point.y),
    });

    return (
        <View
            style={[styles.container, { width, height }]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Svg width={width} height={height}>
                <Path
                    d={pathData}
                    stroke={trackColor}
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    fill="none"
                />
            </Svg>
            <Animated.View
                style={[
                    styles.marker,
                    {
                        backgroundColor: markerColor,
                        transform: [{ translateX }, { translateY }],
                    },
                ]}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    marker: {
        position: 'absolute',
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
});
