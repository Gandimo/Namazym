import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
    progress: Animated.Value | Animated.AnimatedInterpolation<number>;
    size?: number;
    strokeWidth?: number;
    color?: string;
    glow?: boolean;
    glowColor?: string;
    glowOpacity?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    progress,
    size = 260,
    strokeWidth = 6,
    color = '#D4AF37', // Premium Gold
    glow = true,
    glowColor = '#D4AF37',
    glowOpacity = 0.3,
}) => {
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = radius * 2 * Math.PI;

    const strokeDashoffset = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
    });

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
                <Defs>
                    <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
                        <Stop offset="0%" stopColor={glowColor} stopOpacity={glowOpacity} />
                        <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
                    </RadialGradient>
                </Defs>

                {/* Glow Ring (Simulated with multiple paths or gradient) */}
                {glow && (
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius + 4}
                        fill="url(#glow)"
                    />
                )}

                {/* Background Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(0, 0, 0, 0.05)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* Progress Circle */}
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                />
            </Svg>
        </View>
    );
};
