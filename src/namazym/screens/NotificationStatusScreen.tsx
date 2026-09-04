import React from 'react';
import { AppState, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';
import { PremiumIcon } from '../components/icons/PremiumIcon';
import { useCity } from '../context/CityContext';
import { ExactAlarmService } from '../services/ExactAlarmService';
import { NotificationService } from '../services/NotificationService';
import { AZAN_CHANNEL_ID, AZAN_SOUND_FILE } from '../services/notifications/prayerNotificationTypes';

const COLORS = {
    background: '#F6F1E8',
    card: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B6255',
    gold: '#C4A050',
    ok: '#4A7C59',
    okBg: '#E8F2EC',
    warn: '#B85842',
    warnBg: '#F9E9E4',
    border: 'rgba(0,0,0,0.05)',
};

const NOTIFIABLE_PRAYERS: Array<{ key: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'; i18nKey: string }> = [
    { key: 'Fajr', i18nKey: 'prayer.fajr' },
    { key: 'Dhuhr', i18nKey: 'prayer.dhuhr' },
    { key: 'Asr', i18nKey: 'prayer.asr' },
    { key: 'Maghrib', i18nKey: 'prayer.maghrib' },
    { key: 'Isha', i18nKey: 'prayer.isha' },
];

interface HealthState {
    notificationsGranted: boolean;
    canScheduleExactAlarms: boolean;
    isIgnoringBatteryOptimizations: boolean;
    scheduledCount: number;
}

export function NotificationStatusScreen() {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { prayerTimes, placeKey, placeLabel } = useCity();

    const [health, setHealth] = React.useState<HealthState | null>(null);
    const [message, setMessage] = React.useState<string | null>(null);
    const isAndroid = Platform.OS === 'android';
    const showAndroidRows = isAndroid && ExactAlarmService.isSupported();

    const reload = React.useCallback(async () => {
        try {
            const [permission, alarmStatus, scheduled] = await Promise.all([
                Notifications.getPermissionsAsync(),
                ExactAlarmService.getStatus(),
                Notifications.getAllScheduledNotificationsAsync(),
            ]);
            setHealth({
                notificationsGranted: permission.status === 'granted',
                canScheduleExactAlarms: alarmStatus.canScheduleExactAlarms,
                isIgnoringBatteryOptimizations: alarmStatus.isIgnoringBatteryOptimizations,
                scheduledCount: scheduled.length,
            });
        } catch {
            // Leave previous state in place.
        }
    }, []);

    React.useEffect(() => {
        reload();
        const focusUnsubscribe = navigation.addListener('focus', reload);
        const appStateSubscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') reload();
        });
        return () => {
            focusUnsubscribe();
            appStateSubscription.remove();
        };
    }, [navigation, reload]);

    const nextPrayerText = React.useMemo(() => {
        if (!prayerTimes) return '—';
        const now = new Date();
        for (const prayer of NOTIFIABLE_PRAYERS) {
            const time = prayerTimes.timings[prayer.key];
            if (!time) continue;
            const [hours, minutes] = time.split(':').map(Number);
            const candidate = new Date(now);
            candidate.setHours(hours, minutes, 0, 0);
            if (candidate > now) {
                return `${t(prayer.i18nKey)} — ${time}`;
            }
        }
        const fajr = prayerTimes.timings.Fajr;
        return fajr ? `${t('prayer.fajr')} — ${fajr}` : '—';
    }, [prayerTimes, t]);

    const fixNotificationPermission = async () => {
        const granted = await NotificationService.requestPermissions();
        if (!granted) {
            Linking.openSettings().catch(() => {});
        }
        await reload();
        if (granted && prayerTimes) {
            NotificationService.rescheduleAll(prayerTimes, placeLabel, placeKey).catch(() => {});
        }
    };

    const sendTestNotification = async () => {
        const granted = await NotificationService.requestPermissions();
        if (!granted) {
            Linking.openSettings().catch(() => {});
            return;
        }
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🕌 Namazym',
                body: t('notification_status.test_body'),
                data: { type: 'status_test' },
                sound: AZAN_SOUND_FILE,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 30,
                channelId: AZAN_CHANNEL_ID,
            } as any,
        });
        setMessage(t('notification_status.test_sent'));
        await reload();
    };

    const renderStatusRow = (
        icon: string,
        label: string,
        isOk: boolean,
        okText: string,
        badText: string,
        onFix?: () => void,
        hint?: string,
    ) => (
        <View style={[styles.row, !isOk && styles.rowWarn]}>
            <View style={styles.rowTop}>
                <View style={styles.rowLeft}>
                    <PremiumIcon name={icon as any} size="STANDARD" color={isOk ? COLORS.ok : COLORS.warn} />
                    <Text style={styles.rowLabel}>{label}</Text>
                </View>
                <View style={[styles.statePill, { backgroundColor: isOk ? COLORS.okBg : COLORS.warnBg }]}>
                    <Text style={[styles.stateText, { color: isOk ? COLORS.ok : COLORS.warn }]}>
                        {isOk ? okText : badText}
                    </Text>
                </View>
            </View>
            {!isOk && hint ? <Text style={styles.hint}>{hint}</Text> : null}
            {!isOk && onFix ? (
                <Pressable style={styles.fixButton} onPress={onFix}>
                    <Text style={styles.fixButtonText}>{t('notification_status.fix')}</Text>
                </Pressable>
            ) : null}
        </View>
    );

    const allGood = !!health
        && health.notificationsGranted
        && (!showAndroidRows || (health.canScheduleExactAlarms && health.isIgnoringBatteryOptimizations));

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <PremiumIcon name="chevron-back" size="STANDARD" color={COLORS.textPrimary} interactive onPress={() => navigation.goBack()} />
                </Pressable>
                <View style={styles.titleBox}>
                    <Text style={styles.title}>{t('notification_status.title').toUpperCase()}</Text>
                    <Text style={styles.subtitle}>{t('notification_status.subtitle')}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {allGood ? (
                    <View style={styles.allGoodBox}>
                        <PremiumIcon name="checkmark-circle" size="STANDARD" color={COLORS.ok} />
                        <Text style={styles.allGoodText}>{t('notification_status.all_good')}</Text>
                    </View>
                ) : null}

                <View style={styles.card}>
                    {renderStatusRow(
                        'notifications-outline',
                        t('notification_status.perm_notifications'),
                        health?.notificationsGranted ?? true,
                        t('notification_status.on'),
                        t('notification_status.off'),
                        fixNotificationPermission,
                    )}
                    {showAndroidRows ? renderStatusRow(
                        'alarm-outline',
                        t('notification_status.perm_exact'),
                        health?.canScheduleExactAlarms ?? true,
                        t('notification_status.on'),
                        t('notification_status.off'),
                        () => { ExactAlarmService.openExactAlarmSettings(); },
                        t('notification_status.exact_hint'),
                    ) : null}
                    {showAndroidRows ? renderStatusRow(
                        'battery-half-outline',
                        t('notification_status.perm_battery'),
                        health?.isIgnoringBatteryOptimizations ?? true,
                        t('notification_status.unrestricted'),
                        t('notification_status.optimized'),
                        () => { ExactAlarmService.openBatteryOptimizationSettings(); },
                        t('notification_status.battery_hint'),
                    ) : null}
                </View>

                <View style={styles.card}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('notification_status.next')}</Text>
                        <Text style={styles.infoValue}>{nextPrayerText}</Text>
                    </View>
                    <View style={[styles.infoRow, styles.infoRowLast]}>
                        <Text style={styles.infoLabel}>{t('notification_status.scheduled')}</Text>
                        <Text style={styles.infoValue}>{health ? String(health.scheduledCount) : '—'}</Text>
                    </View>
                </View>

                <Pressable style={styles.testButton} onPress={sendTestNotification}>
                    <PremiumIcon name="paper-plane-outline" size="STANDARD" color="#FFFFFF" />
                    <Text style={styles.testButtonText}>{t('notification_status.test_button')}</Text>
                </Pressable>
                {message ? <Text style={styles.message}>{message}</Text> : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    titleBox: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 15,
        fontWeight: '900',
        letterSpacing: 2,
        color: COLORS.textPrimary,
    },
    subtitle: {
        fontSize: 11,
        marginTop: 2,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    allGoodBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: COLORS.okBg,
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
    },
    allGoodText: {
        flex: 1,
        color: COLORS.ok,
        fontSize: 13,
        fontWeight: '700',
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 4,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    row: {
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.border,
    },
    rowWarn: {},
    rowTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        paddingRight: 10,
    },
    rowLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        flexShrink: 1,
    },
    statePill: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 999,
    },
    stateText: {
        fontSize: 12,
        fontWeight: '800',
    },
    hint: {
        marginTop: 10,
        fontSize: 12,
        lineHeight: 17,
        color: COLORS.textSecondary,
    },
    fixButton: {
        marginTop: 10,
        alignSelf: 'flex-start',
        backgroundColor: COLORS.gold,
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 12,
    },
    fixButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.border,
    },
    infoRowLast: {
        borderBottomWidth: 0,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.gold,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#7A5A12',
        borderRadius: 16,
        paddingVertical: 15,
    },
    testButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    message: {
        marginTop: 12,
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});
