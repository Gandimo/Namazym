import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { tokens2026 } from '../theme/tokens2026';
import { useAnimatedEntrance } from '../hooks/useAnimatedEntrance';
import { PremiumIcon } from './icons/PremiumIcon';
import { useTranslation } from 'react-i18next';

const ARABIC_NAMES: Record<string, string> = {
    Fajr: 'الفجر',
    Sunrise: 'الشروق',
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
    isDarkTheme?: boolean;
}

const PrayerRow = ({ item, time, isCurrent, isNext, isPast, isDarkTheme = true }: PrayerItemProps) => {
    const palette = isDarkTheme ? tokens2026.colors.prayerList.dark : tokens2026.colors.prayerList.light;
    const isCompleted = Boolean(isPast);

    const cardTone = isCurrent
        ? styles.currentCard
        : isNext
            ? styles.nextCard
        : isCompleted
            ? styles.completedCard
            : styles.defaultCard;

    const dynamicCardStyle = isCurrent
        ? { backgroundColor: palette.cardCurrent, borderColor: palette.borderCurrent }
        : isNext
            ? { backgroundColor: palette.cardNext, borderColor: palette.borderNext }
        : isCompleted
            ? { backgroundColor: palette.cardCompleted, borderColor: palette.borderCompleted }
            : { backgroundColor: palette.cardDefault, borderColor: palette.borderDefault };

    const primaryColor = isCurrent ? palette.accentText : isCompleted ? palette.textSecondary : palette.textPrimary;
    const iconColor = isCurrent ? palette.accentText : isCompleted ? palette.textMuted : isNext ? tokens2026.colors.brandGold : palette.textSecondary;

    return (
        <View style={styles.rowWrapper}>
            <View style={[
                styles.card,
                cardTone,
                dynamicCardStyle,
                tokens2026.elevation.soft
            ]}>

                <Text style={[styles.arabicWatermark, { color: palette.watermark }]}>{ARABIC_NAMES[item.key]}</Text>

                <View style={styles.content}>
                    <View style={styles.nameGroup}>
                        <PremiumIcon
                            name={isPast ? "checkmark-circle" : (isCurrent ? "ellipse" : "ellipse-outline")}
                            size="SMALL"
                            gradient={isCurrent ? "PRAYER_GOLD" : undefined}
                            color={iconColor}
                            pulse={isCurrent}
                            style={{ marginRight: 10 }}
                        />
                        <Text style={[
                            styles.prayerName,
                            { color: primaryColor }
                        ]}>
                            {item.label}
                        </Text>
                    </View>
                    <Text style={[
                        styles.prayerTime,
                        { color: isCurrent ? palette.accentText : isCompleted ? palette.textSecondary : palette.textPrimary }
                    ]}>
                        {time}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export const DailyPrayersList = ({ prayerTimes, current, next, progress, delay = 0, isDarkTheme = true }: any) => {
    const { t } = useTranslation();
    const entranceStyle = useAnimatedEntrance(delay);
    const ORDER = [
        { key: 'Fajr', label: t('prayer.fajr') },
        { key: 'Sunrise', label: t('prayer.sunrise') },
        { key: 'Dhuhr', label: t('prayer.dhuhr') },
        { key: 'Asr', label: t('prayer.asr') },
        { key: 'Maghrib', label: t('prayer.maghrib') },
        { key: 'Isha', label: t('prayer.isha') },
    ];
    const currentIndex = ORDER.findIndex(o => o.key === current?.key);
    const palette = isDarkTheme ? tokens2026.colors.prayerList.dark : tokens2026.colors.prayerList.light;

    return (
        <Animated.View style={[styles.container, entranceStyle]}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>{t('common.prayer_times').toUpperCase()}</Text>
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
                    isDarkTheme={isDarkTheme}
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
        fontWeight: '800',
        color: 'rgba(255,255,255,0.76)',
        letterSpacing: 1.65,
    },
    rowWrapper: {
        marginBottom: 10,
    },
    card: {
        height: 74,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        paddingHorizontal: tokens2026.layout.componentPadding,
        borderWidth: 1,
    },
    currentCard: {
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 6,
    },
    completedCard: {
        shadowOpacity: 0.05,
    },
    defaultCard: {
        shadowOpacity: 0.08,
    },
    nextCard: {
        shadowOpacity: 0.09,
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
        flex: 1,
        paddingRight: 12,
    },
    prayerName: {
        fontSize: tokens2026.typography.body,
        fontWeight: '700',
        letterSpacing: 0.2,
        flexShrink: 1,
    },
    prayerTime: {
        fontSize: tokens2026.typography.body + 1,
        fontWeight: '700',
        letterSpacing: 0.45,
        marginLeft: 12,
    },
    arabicWatermark: {
        position: 'absolute',
        right: -15,
        bottom: -15,
        fontSize: 70,
        fontFamily: 'Amiri_400Regular',
        zIndex: 1,
    },
});
