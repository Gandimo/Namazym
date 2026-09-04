/**
 * Daily prayer tracking with a running streak.
 *
 * The habit loop this app depends on is the daily return, and a streak is the
 * cheapest honest reason to come back: one tap per prayer, a number that only
 * grows while the days stay unbroken. Everything is stored on the device — no
 * account, no sync, no network.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle, Animated, AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { tokens2026 } from '../theme/tokens2026';
import { DAILY_PRAYER_KEYS } from '../constants/prayerNames';
import { PrayerTrackerService, type StreakSummary } from '../services/PrayerTrackerService';

const PRAYER_LABEL_KEY: Record<string, string> = {
    Fajr: 'prayer.fajr',
    Dhuhr: 'prayer.dhuhr',
    Asr: 'prayer.asr',
    Maghrib: 'prayer.maghrib',
    Isha: 'prayer.isha',
};

const EMPTY_SUMMARY: StreakSummary = { current: 0, best: 0, todayCount: 0, todayComplete: false };

interface Props {
    /**
     * Prayers whose time has arrived today. A prayer cannot be marked before its
     * time, so future ones stay dimmed rather than tappable.
     */
    unlockedKeys?: string[];
    cardStyle?: StyleProp<ViewStyle>;
    layoutStyle?: StyleProp<ViewStyle>;
    entranceStyle?: StyleProp<ViewStyle>;
    textColor?: string;
    secondaryTextColor?: string;
    /** Drives the chip palette so the card stays readable in the daytime theme. */
    isDarkTheme?: boolean;
    /** Bumped by the parent to force a refresh (e.g. on screen focus). */
    refreshToken?: number;
}

export const PrayerStreakCard = React.memo(function PrayerStreakCard({
    unlockedKeys,
    cardStyle,
    layoutStyle,
    entranceStyle,
    textColor = '#FFFFFF',
    secondaryTextColor = 'rgba(255,255,255,0.7)',
    isDarkTheme = true,
    refreshToken = 0,
}: Props) {
    const { t } = useTranslation();
    // Same palette the prayer rows above use, so the card reads correctly in both
    // the daytime and night themes instead of assuming a dark background.
    const palette = isDarkTheme
        ? tokens2026.colors.prayerList.dark
        : tokens2026.colors.prayerList.light;
    const [marked, setMarked] = useState<Record<string, boolean>>({});
    const [summary, setSummary] = useState<StreakSummary>(EMPTY_SUMMARY);

    const load = useCallback(async (isActive: () => boolean = () => true) => {
        const [progress, streak] = await Promise.all([
            PrayerTrackerService.getProgress(),
            PrayerTrackerService.getStreakSummary(),
        ]);
        if (!isActive()) return;
        setMarked(progress as Record<string, boolean>);
        setSummary(streak);
    }, []);

    useEffect(() => {
        let active = true;
        void load(() => active);
        return () => { active = false; };
    }, [load, refreshToken]);

    // The "Okadym" notification action writes while the app sits in the
    // background, so the card has to re-read on the way back in — otherwise a
    // prayer marked from the notification looks like it was never recorded.
    useEffect(() => {
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') void load();
        });
        return () => subscription.remove();
    }, [load]);

    const unlocked = useMemo(
        () => (unlockedKeys ? new Set(unlockedKeys) : null),
        [unlockedKeys],
    );

    const handleToggle = useCallback(async (prayerKey: string) => {
        const next = !marked[prayerKey];
        // Answer the tap immediately; storage catches up behind it.
        setMarked(previous => ({ ...previous, [prayerKey]: next }));
        void Haptics.impactAsync(
            next ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
        );
        await PrayerTrackerService.setPrayer(prayerKey, next);
        await load();
    }, [load, marked]);

    const doneToday = summary.todayCount;
    const streakDays = summary.current;

    const headline = streakDays > 0
        ? t('streak.days', { days: streakDays, defaultValue: `${streakDays} gün` })
        : t('streak.start', 'Şu günden başla');

    const subtitle = summary.todayComplete
        ? t('streak.today_complete', 'Bu günki bäş wagt doly')
        : t('streak.today_progress', {
            done: doneToday,
            total: DAILY_PRAYER_KEYS.length,
            defaultValue: `Bu gün ${doneToday}/${DAILY_PRAYER_KEYS.length}`,
        });

    return (
        <Animated.View style={[styles.wrapper, layoutStyle, entranceStyle]}>
            <View style={[styles.card, cardStyle]}>
                <View style={styles.topRow}>
                    <View style={styles.copy}>
                        <Text style={[styles.title, { color: textColor }]}>
                            {t('streak.title', 'Yzygiderlik')}
                        </Text>
                        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
                            {subtitle}
                        </Text>
                    </View>

                    <View style={[
                        styles.badge,
                        {
                            backgroundColor: palette.cardDefault,
                            borderColor: palette.borderDefault,
                        },
                        streakDays > 0 && styles.badgeActive,
                    ]}>
                        <Ionicons
                            name="flame"
                            size={15}
                            color={streakDays > 0 ? tokens2026.colors.brandGold : palette.textMuted}
                        />
                        <Text style={[
                            styles.badgeText,
                            { color: streakDays > 0 ? tokens2026.colors.brandGold : palette.textSecondary },
                        ]}>
                            {headline}
                        </Text>
                    </View>
                </View>

                <View style={styles.chipRow}>
                    {DAILY_PRAYER_KEYS.map(prayerKey => {
                        const isMarked = Boolean(marked[prayerKey]);
                        const isUnlocked = unlocked ? unlocked.has(prayerKey) : true;
                        const label = t(PRAYER_LABEL_KEY[prayerKey], prayerKey);

                        return (
                            <Pressable
                                key={prayerKey}
                                onPress={() => handleToggle(prayerKey)}
                                disabled={!isUnlocked}
                                hitSlop={6}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: isMarked, disabled: !isUnlocked }}
                                accessibilityLabel={label}
                                style={({ pressed }) => [
                                    styles.chip,
                                    {
                                        backgroundColor: palette.cardDefault,
                                        borderColor: palette.borderDefault,
                                    },
                                    isMarked && styles.chipMarked,
                                    !isUnlocked && styles.chipLocked,
                                    pressed && styles.chipPressed,
                                ]}
                            >
                                <Ionicons
                                    name={isMarked ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={17}
                                    color={
                                        isMarked
                                            ? tokens2026.colors.brandGold
                                            : isUnlocked
                                                ? palette.textSecondary
                                                : palette.textMuted
                                    }
                                />
                                <Text
                                    numberOfLines={1}
                                    style={[
                                        styles.chipLabel,
                                        {
                                            color: isMarked
                                                ? tokens2026.colors.brandGold
                                                : isUnlocked
                                                    ? palette.textPrimary
                                                    : palette.textMuted,
                                        },
                                    ]}
                                >
                                    {label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    wrapper: {
        alignSelf: 'center',
    },
    card: {
        borderRadius: 24,
        padding: 18,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    copy: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        letterSpacing: 0.2,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        minHeight: 30,
        paddingHorizontal: 11,
        borderRadius: 15,
        marginLeft: 14,
        borderWidth: 1,
    },
    badgeActive: {
        backgroundColor: 'rgba(201,168,76,0.10)',
        borderColor: 'rgba(201,168,76,0.22)',
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    chipRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 6,
    },
    chip: {
        flex: 1,
        alignItems: 'center',
        gap: 5,
        paddingVertical: 10,
        paddingHorizontal: 2,
        borderRadius: 14,
        borderWidth: 1,
    },
    chipMarked: {
        backgroundColor: 'rgba(201,168,76,0.10)',
        borderColor: 'rgba(201,168,76,0.22)',
    },
    chipLocked: {
        opacity: 0.45,
    },
    chipPressed: {
        opacity: 0.7,
    },
    chipLabel: {
        fontSize: 10.5,
        fontWeight: '700',
        letterSpacing: 0.1,
    },
});
