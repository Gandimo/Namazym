import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { tokens2026 } from '../theme/tokens2026';
import { useAnimatedEntrance } from '../hooks/useAnimatedEntrance';
import { useTranslation } from 'react-i18next';

interface KerahatBannerProps {
    /** Maghrib time as "HH:MM" — displayed in the subtitle */
    maghribTime: string;
    /** true when within the severe kerahat window (Maghrib − 15 min) */
    isSevere: boolean;
    /** matches sky theme so tint adapts to dark / light backgrounds */
    isDarkTheme: boolean;
}

/**
 * KerahatBanner
 *
 * Shown between HeroPrayerCard and DailyPrayersList only when the active
 * evening kerahat window is in effect. Purely informational — no interaction.
 *
 * Kerahat logic lives exclusively in mekruh.ts. This component only handles
 * display. It never re-derives timing.
 */
export const KerahatBanner = ({ maghribTime, isSevere, isDarkTheme }: KerahatBannerProps) => {
    const { t } = useTranslation();
    const entranceStyle = useAnimatedEntrance(80);

    // Calm amber surface — slightly warmer in severe mode, never alarming
    const surfaceColor = isSevere
        ? 'rgba(200, 130, 40, 0.22)'
        : 'rgba(180, 115, 30, 0.14)';

    const borderColor = isSevere
        ? 'rgba(210, 145, 60, 0.38)'
        : 'rgba(190, 130, 50, 0.24)';

    const labelColor = isDarkTheme
        ? 'rgba(255, 220, 150, 0.95)'
        : 'rgba(160, 90, 10, 0.92)';

    const subColor = isDarkTheme
        ? 'rgba(255, 210, 130, 0.72)'
        : 'rgba(140, 75, 5, 0.72)';

    const maghribLabel = t('kerahat.maghrib_starts', { time: maghribTime });
    const bannerLabel  = isSevere ? t('kerahat.severe_label') : t('kerahat.label');

    return (
        <Animated.View style={[styles.wrapper, entranceStyle]}>
            <View style={[styles.card, { borderColor }]}>
                <BlurView
                    intensity={8}
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                />
                <View style={[StyleSheet.absoluteFill, styles.surface, { backgroundColor: surfaceColor }]} />

                <View style={styles.content}>
                    {/* Left: icon + label */}
                    <View style={styles.left}>
                        <Text style={[styles.icon, { color: labelColor }]}>☽</Text>
                        <View style={styles.textBlock}>
                            <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
                                {bannerLabel}
                            </Text>
                            <Text style={[styles.sub, { color: subColor }]} numberOfLines={1}>
                                {maghribLabel}
                            </Text>
                        </View>
                    </View>

                    {/* Right: subtle time pill */}
                    <View style={[styles.timePill, { borderColor }]}>
                        <Text style={[styles.timeText, { color: labelColor }]}>{maghribTime}</Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: tokens2026.layout.screenPadding,
        marginTop: 4,
        marginBottom: 4,
    },
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    surface: {
        borderRadius: 16,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 13,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 8,
    },
    icon: {
        fontSize: 15,
        marginRight: 10,
        opacity: 0.88,
    },
    textBlock: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.3,
        marginBottom: 2,
    },
    sub: {
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 0.1,
    },
    timePill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.12)',
    },
    timeText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
