import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { tokens2026 } from '../theme/tokens2026';
import { useAnimatedEntrance } from '../hooks/useAnimatedEntrance';
import { PremiumIcon } from './icons/PremiumIcon';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ARABIC_NAMES: Record<string, string> = {
    Fajr: 'الفجر',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء',
};

interface PrayerItemProps {
    item: { key: string; label: string };
    time: string;
    isCurrent: boolean;
    isNext: boolean;
    isPast?: boolean;
    progress?: number;
}

const PrayerRow = ({ item, time, isCurrent, isPast }: PrayerItemProps) => {
    // Secondary Card Spec: radius: 20, elevation: soft, glass: false
    const secondaryColors = tokens2026.colors.text.secondary;
    const primaryColors = tokens2026.colors.text.primary;

    return (
        <View style={styles.rowWrapper}>
            <View style={[
                styles.card,
                isCurrent ? styles.activeCard : styles.inactiveCard,
                tokens2026.elevation.soft
            ]}>

                <Text style={styles.arabicWatermark}>{ARABIC_NAMES[item.key]}</Text>

                <View style={styles.content}>
                    <View style={styles.nameGroup}>
                        <PremiumIcon
                            name={isPast ? "checkmark-circle" : (isCurrent ? "ellipse" : "ellipse-outline")}
                            size="SMALL"
                            gradient={isPast || isCurrent ? "PRAYER_GOLD" : undefined}
                            color={isCurrent ? tokens2026.colors.brandGold : tokens2026.colors.text.secondary}
                            pulse={isCurrent}
                            style={{ marginRight: 10 }}
                        />
                        <Text style={[
                            styles.prayerName,
                            { color: isCurrent ? tokens2026.colors.brandGold : primaryColors }
                        ]}>
                            {item.label}
                        </Text>
                    </View>
                    <Text style={[
                        styles.prayerTime,
                        { color: isCurrent ? tokens2026.colors.brandGold : primaryColors }
                    ]}>
                        {time}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export const DailyPrayersList = ({ prayerTimes, current, next, progress, delay = 0 }: any) => {
    const { t } = useTranslation();
    const entranceStyle = useAnimatedEntrance(delay);
    const ORDER = [
        { key: 'Fajr', label: t('prayer.fajr') },
        { key: 'Dhuhr', label: t('prayer.dhuhr') },
        { key: 'Asr', label: t('prayer.asr') },
        { key: 'Maghrib', label: t('prayer.maghrib') },
        { key: 'Isha', label: t('prayer.isha') },
    ];

    const currentIndex = ORDER.findIndex(o => o.key === current?.key);

    return (
        <Animated.View style={[styles.container, entranceStyle]}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('common.prayer_times').toUpperCase()}</Text>
            </View>
            {ORDER.map((item, index) => (
                <PrayerRow
                    key={item.key}
                    item={item}
                    time={prayerTimes?.timings?.[item.key] || '--:--'}
                    isCurrent={current?.key === item.key}
                    isNext={next?.key === item.key}
                    isPast={index < currentIndex}
                    progress={current?.key === item.key ? progress : 0}
                />
            ))}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: tokens2026.layout.screenPadding,
        marginTop: 20,
    },
    sectionHeader: {
        marginBottom: 16,
        marginLeft: 4,
    },
    sectionTitle: {
        fontSize: tokens2026.typography.caption,
        fontWeight: '900',
        color: tokens2026.colors.text.secondary,
        letterSpacing: 2,
    },
    rowWrapper: {
        marginBottom: tokens2026.layout.spacing,
    },
    card: {
        height: 70,
        borderRadius: 20, // Secondary Card Radius
        overflow: 'hidden',
        justifyContent: 'center',
        paddingHorizontal: tokens2026.layout.componentPadding,
    },
    activeCard: {
        backgroundColor: tokens2026.colors.surface.default,
        borderWidth: 1,
        borderColor: tokens2026.colors.brandGold,
    },
    inactiveCard: {
        backgroundColor: tokens2026.colors.surface.default,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 2,
    },
    nameGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prayerName: {
        fontSize: tokens2026.typography.body,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    prayerTime: {
        fontSize: tokens2026.typography.body + 1,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    arabicWatermark: {
        position: 'absolute',
        right: -15,
        bottom: -15,
        fontSize: 70,
        fontFamily: 'Amiri_400Regular',
        color: 'rgba(255, 255, 255, 0.04)',
        zIndex: 1,
    },
});
