import React from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, paper, tokens } from "../theme/colors";
import { spacing, borderRadius } from "../theme/spacing";
import { HapticService } from "../services/HapticService";

export interface HomeActionCardProps {
    variant?: 'hero' | 'compact' | 'wide';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    onPress: () => void;
    style?: any;
}

export function HomeActionCard({
    variant = 'compact',
    title,
    subtitle,
    icon,
    onPress,
    style,
}: HomeActionCardProps) {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        HapticService.softImpact(); // Premium tactile feedback
        Animated.timing(scaleAnim, {
            toValue: 0.97, // Slightly deeper press for tactile feel
            duration: 120, // Fast but perceptible
            easing: (t) => t * (2 - t), // Ease-out quad manually or import Easing
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200, // Gentle recovery
            easing: (t) => t * (2 - t),
            useNativeDriver: true,
        }).start();
    };

    // Render Hero Variant (Large, centerpiece)
    if (variant === 'hero') {
        return (
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.container, style]}
            >
                <Animated.View style={[styles.heroCard, { transform: [{ scale: scaleAnim }] }]}>
                    <LinearGradient
                        colors={[paper.card, paper.bg]}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Icon Chip */}
                    <View style={styles.iconChipHero}>
                        {icon}
                    </View>

                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>{title}</Text>
                        {subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}
                    </View>

                    <View style={styles.arrowContainer}>
                        <Text style={styles.arrow}>→</Text>
                    </View>
                </Animated.View>
            </Pressable>
        );
    }

    // Render Wide Variant (Full width, horizontal)
    if (variant === 'wide') {
        return (
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.container, style]}
            >
                <Animated.View style={[styles.wideCard, { transform: [{ scale: scaleAnim }] }]}>
                    <View style={styles.wideLeft}>
                        <View style={styles.iconChip}>
                            {icon}
                        </View>
                        <View style={styles.wideTextContainer}>
                            <Text style={styles.cardTitle}>{title}</Text>
                            {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
                        </View>
                    </View>
                    <Text style={styles.arrow}>→</Text>
                </Animated.View>
            </Pressable>
        );
    }

    // Render Compact Variant (Half width, vertical)
    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[styles.container, style]}
        >
            <Animated.View style={[styles.compactCard, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.compactHeader}>
                    <View style={styles.iconChip}>
                        {icon}
                    </View>
                </View>
                <View style={styles.compactContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
                    {subtitle && <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>}
                </View>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    // Hero Variant Styles
    heroCard: {
        height: 140,
        borderRadius: borderRadius.kart,
        paddingVertical: spacing.kart_dikey,
        paddingHorizontal: spacing.kart_yatay,
        backgroundColor: tokens.renkler.arka_plan.kartSaydam,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 0,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: spacing.md,
        zIndex: 10,
    },
    heroContent: {
        flex: 1,
        marginLeft: spacing.lg,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '800', // Heavy bold for premium feel
        color: paper.title,
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    heroSubtitle: {
        fontSize: tokens.tipografi.boyutlar.sm,
        fontWeight: tokens.tipografi.agirliklar.orta,
        color: tokens.renkler.metin.ikincil,
        opacity: 0.8,
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(196, 160, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrow: {
        fontSize: 16,
        color: paper.title,
        fontWeight: '300',
    },

    // Wide Variant Styles
    wideCard: {
        borderRadius: borderRadius.kart,
        paddingVertical: spacing.kart_yatay,
        paddingHorizontal: spacing.kart_yatay,
        backgroundColor: tokens.renkler.arka_plan.kartSaydam,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 0,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        zIndex: 10,
    },
    wideLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    wideTextContainer: {
        justifyContent: 'center',
    },

    // Compact Variant Styles
    compactCard: {
        borderRadius: borderRadius.kart,
        paddingVertical: spacing.kart_yatay,
        paddingHorizontal: spacing.kart_yatay,
        backgroundColor: tokens.renkler.arka_plan.kartSaydam,
        height: 124,
        justifyContent: 'space-between',
        borderWidth: 0,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        zIndex: 10,
    },
    compactHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    compactContent: {
        marginTop: spacing.sm,
    },
    cardTitle: {
        fontSize: 15, // Slightly refined calculation
        fontWeight: '700',
        color: paper.title,
        letterSpacing: -0.3,
        lineHeight: 20,
    },
    cardSubtitle: {
        fontSize: 12,
        color: paper.muted,
        marginTop: 2,
    },

    // Shared Styles
    iconChip: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(196, 160, 80, 0.08)', // Ambient gold bg
        borderWidth: 0.5,
        borderColor: 'rgba(196, 160, 80, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconChipHero: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(196, 160, 80, 0.12)',
        borderWidth: 0.5,
        borderColor: 'rgba(196, 160, 80, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
