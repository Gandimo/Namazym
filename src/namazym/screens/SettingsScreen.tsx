import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Switch, Platform, Modal, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '../components/icons/PremiumIcon';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import { NotificationStorage, NotificationPreferences } from '../utils/notificationStorage';
import { NotificationService } from '../services/NotificationService';
import { ContentLoaderService } from '../services/ContentLoaderService';

const SKY_THEMES = {
    Fajr: ['#4A90E2', '#B8D8F4'],
    Sunrise: ['#FF9E80', '#FBE9E7'],
    Dhuhr: ['#1e90ff', '#c8eaff'],
    Asr: ['#F57C00', '#FFF3E0'],
    Maghrib: ['#311B92', '#FF8A65'],
    Isha: ['#1A237E', '#121212'],
};

const COLORS = {
    white: '#FFFFFF',
    glassCard: 'rgba(255, 255, 255, 0.95)',
    textPrimary: '#1A1A1A',
    textSecondary: '#555555',
    gold: '#C4A050',
    glassBorder: 'rgba(0,0,0,0.02)',
};

const LANGUAGES = [
    { code: 'tk', label: 'Türkmençe', flag: '🇹🇲' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

/** Preset hourly times available in the daily-content time picker (06:00 – 22:00). */
const TIME_OPTIONS = Array.from({ length: 17 }, (_, i) => {
    const h = String(i + 6).padStart(2, '0');
    return `${h}:00`;
});

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { t, i18n } = useTranslation();
    const { prayerTimes, isAutoLocation, toggleAutoLocation } = useCity();

    const [lang, setLang] = useState(i18n.language);
    const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
    const [langModalVisible, setLangModalVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);

    React.useEffect(() => {
        NotificationStorage.getPreferences().then(setPrefs);
    }, []);

    const changeLanguage = async (newLang: string) => {
        await AsyncStorage.setItem('user_language', newLang);
        await i18n.changeLanguage(newLang);
        ContentLoaderService.clearCache();
        setLang(newLang);
        setLangModalVisible(false);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: t('common.prayer_times') + ' - Namazym App',
                url: 'https://namazym.app',
            });
        } catch (e) { }
    };

    const handleRate = async () => {
        const url = Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/idYOUR_APP_ID'
            : 'https://play.google.com/store/apps/details?id=YOUR_PACKAGE_NAME';
        const { Linking } = require('react-native');
        await Linking.openURL(url);
    };

    const togglePrayerReminders = async () => {
        if (!prefs) return;
        const updated = await NotificationStorage.savePreferences({
            pre_prayer_alert: { ...prefs.pre_prayer_alert, enabled: !prefs.pre_prayer_alert.enabled }
        });
        if (updated) {
            setPrefs(updated);
            if (prayerTimes) NotificationService.rescheduleAll(prayerTimes);
        }
    };

    const toggleDailyContent = async () => {
        if (!prefs) return;
        const updated = await NotificationStorage.savePreferences({
            daily_content: { ...prefs.daily_content, enabled: !prefs.daily_content.enabled }
        });
        if (updated) {
            setPrefs(updated);
            if (prayerTimes) NotificationService.rescheduleAll(prayerTimes);
        }
    };

    const handleTimeChange = async (newTime: string) => {
        if (!prefs) return;
        setTimeModalVisible(false);
        const updated = await NotificationStorage.savePreferences({
            daily_content: { ...prefs.daily_content, time: newTime }
        });
        if (updated) {
            setPrefs(updated);
            if (prayerTimes) NotificationService.rescheduleAll(prayerTimes);
        }
    };

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;
    const currentLangLabel = LANGUAGES.find(l => l.code === lang);

    const renderOption = (icon: any, label: string, value: string, onPress: () => void, gradient?: any, isLast = false) => (
        <Pressable onPress={onPress} style={[styles.option, !isLast && styles.optionBorder]}>
            <View style={styles.optionLeft}>
                <PremiumIcon name={icon} size="STANDARD" gradient={gradient} color={COLORS.gold} interactive onPress={onPress} />
                <Text style={styles.optionLabel}>{label}</Text>
            </View>
            <View style={styles.optionRight}>
                <Text style={styles.optionValue}>{value}</Text>
                <PremiumIcon name="chevron-forward" size="SMALL" color="rgba(0,0,0,0.3)" />
            </View>
        </Pressable>
    );

    const renderSwitchOption = (icon: any, label: string, value: boolean, onToggle: () => void, gradient?: any, isLast = false) => (
        <View style={[styles.option, !isLast && styles.optionBorder]}>
            <View style={styles.optionLeft}>
                <PremiumIcon name={icon} size="STANDARD" gradient={gradient} color={COLORS.gold} />
                <Text style={styles.optionLabel}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: 'rgba(0,0,0,0.1)', true: COLORS.gold }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (value ? COLORS.gold : '#f4f3f4')}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <PremiumIcon name="chevron-back" size="STANDARD" color="#FFFFFF" interactive onPress={() => navigation.goBack()} />
                    </Pressable>
                    <View style={styles.titleBox}>
                        <Text style={styles.title}>{t('common.settings').toUpperCase()}</Text>
                        <Text style={styles.subtitle}>TERTIPLER WE MAGLUMAT</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* GENEL */}
                    <View style={styles.glassCard}>
                        {renderOption('location-sharp', t('common.auto_location'), isAutoLocation ? 'On' : 'Off', toggleAutoLocation, 'PRAYER_GOLD')}
                        {renderOption('globe-outline', t('common.language'),
                            `${currentLangLabel?.flag} ${currentLangLabel?.label}`,
                            () => setLangModalVisible(true),
                            'PRAYER_GOLD', true
                        )}
                    </View>

                    {/* BİLDİRİMLER */}
                    <Text style={styles.sectionTitle}>{t('settings.notifications').toUpperCase()}</Text>
                    <View style={styles.glassCard}>
                        {renderSwitchOption('notifications-outline', t('settings.prayer_reminder'), prefs?.pre_prayer_alert.enabled || false, togglePrayerReminders, 'PRAYER_GOLD')}
                        <Pressable
                            onPress={() => {
                                if (!prefs) return;
                                const types: NotificationPreferences['pre_prayer_alert']['sound_type'][] = ['azan_short', 'standard', 'silent'];
                                const currentIdx = types.indexOf(prefs.pre_prayer_alert.sound_type);
                                const next = types[(currentIdx + 1) % types.length];
                                NotificationStorage.savePreferences({
                                    pre_prayer_alert: { ...prefs.pre_prayer_alert, sound_type: next }
                                }).then(updated => updated && setPrefs(updated));
                            }}
                            style={[styles.option, styles.optionBorder]}
                        >
                            <View style={styles.optionLeft}>
                                <PremiumIcon name="musical-notes-outline" size="STANDARD" color={COLORS.gold} gradient="PRAYER_GOLD" />
                                <Text style={styles.optionLabel}>{t('settings.sound_preference')}</Text>
                            </View>
                            <View style={styles.optionRight}>
                                <Text style={styles.optionValue}>
                                    {prefs?.pre_prayer_alert.sound_type === 'azan_short' ? 'Azan' :
                                        prefs?.pre_prayer_alert.sound_type === 'standard' ? 'Standard' : 'Silent'}
                                </Text>
                                <PremiumIcon name="chevron-forward" size="SMALL" color="rgba(0,0,0,0.3)" />
                            </View>
                        </Pressable>
                        {renderSwitchOption('book-outline', t('settings.daily_content'), prefs?.daily_content.enabled || false, toggleDailyContent, 'TIME_CALENDAR')}
                        {renderOption(
                            'time-outline',
                            'Günüň mazmuny sagady',
                            prefs?.daily_content.time || '09:00',
                            () => setTimeModalVisible(true),
                            'TIME_CALENDAR',
                            true
                        )}
                    </View>

                    {/* EKSTRALAR */}
                    <Text style={styles.sectionTitle}>{t('settings.extras').toUpperCase()}</Text>
                    <View style={styles.glassCard}>
                        {renderOption('share-social-outline', t('settings.share'), '', handleShare, 'TIME_CALENDAR')}
                        {renderOption('star-outline', t('settings.rate'), '', handleRate, 'TIME_CALENDAR')}
                        {renderOption('document-text-outline', t('settings.terms'), '', () => navigation.navigate('Legal'), 'TIME_CALENDAR', true)}
                    </View>

                    <View style={styles.versionBox}>
                        <Text style={styles.versionText}>NAMAZYM APP V1.1.0</Text>
                        <Text style={styles.copyrightText}>{t('settings.copyright')}</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* DİL SEÇİM MODALI */}
            <Modal visible={langModalVisible} transparent animationType="fade" onRequestClose={() => setLangModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangModalVisible(false)}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{t('common.language')}</Text>
                        {LANGUAGES.map((l) => (
                            <TouchableOpacity
                                key={l.code}
                                style={[styles.langOption, lang === l.code && styles.langOptionActive]}
                                onPress={() => changeLanguage(l.code)}
                            >
                                <Text style={styles.langFlag}>{l.flag}</Text>
                                <Text style={[styles.langLabel, lang === l.code && styles.langLabelActive]}>{l.label}</Text>
                                {lang === l.code && <PremiumIcon name="checkmark" size="SMALL" color={COLORS.gold} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* SAGAT SEÇİM MODALI — günüň mazmuny */}
            <Modal visible={timeModalVisible} transparent animationType="fade" onRequestClose={() => setTimeModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setTimeModalVisible(false)}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Bildiriş sagady</Text>
                        {TIME_OPTIONS.map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.langOption, prefs?.daily_content.time === t && styles.langOptionActive]}
                                onPress={() => handleTimeChange(t)}
                            >
                                <Text style={[styles.langLabel, prefs?.daily_content.time === t && styles.langLabelActive]}>{t}</Text>
                                {prefs?.daily_content.time === t && <PremiumIcon name="checkmark" size="SMALL" color={COLORS.gold} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    titleBox: { alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 4, marginTop: 2 },
    content: { padding: 24 },
    glassCard: { backgroundColor: COLORS.glassCard, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 32 },
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    optionBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    optionLeft: { flexDirection: 'row', alignItems: 'center' },
    optionLabel: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 16 },
    optionRight: { flexDirection: 'row', alignItems: 'center' },
    optionValue: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600', marginRight: 8 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.8)', letterSpacing: 3, marginLeft: 12, marginBottom: 12 },
    versionBox: { alignItems: 'center', marginTop: 24 },
    versionText: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 2 },
    copyrightText: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '80%' },
    modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 16, textAlign: 'center' },
    langOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 6 },
    langOptionActive: { backgroundColor: 'rgba(196,160,80,0.12)' },
    langFlag: { fontSize: 24, marginRight: 12 },
    langLabel: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
    langLabelActive: { color: COLORS.gold, fontWeight: '800' },
});
