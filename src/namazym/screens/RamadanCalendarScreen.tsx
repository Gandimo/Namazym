import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
// ✅ YENİ: ramadan_2026_tm.json'u ekle
import ramadanData from '../data/ramadan_2026_tm.json';
import { useTranslation } from 'react-i18next';

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

export default function RamadanCalendarScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { prayerTimes, placeKey, placeLabel } = useCity();
    const currentYear = useMemo(() => TimeService.now().getFullYear().toString(), []);

    // ✅ YENİ: ramadan_2026_tm.json'dan veri çek
    const imsakiye = useMemo(() => {
        const regionData = (ramadanData.tables as any)[placeKey];
        if (!regionData || !regionData.days) {
            console.warn(`Ramazan verisi bulunamadı: ${placeKey}`);
            return [];
        }
        return regionData.days;
    }, [placeKey]);

    // ✅ YENİ: Bölge adını da al
    const regionName = useMemo(() => {
        const regionData = (ramadanData.tables as any)[placeKey];
        return regionData ? regionData.region : placeLabel;
    }, [placeKey, placeLabel]);

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    const renderItem = ({ item, index }: any) => (
        <View style={styles.itemWrapper}>
            <View style={styles.card}>
                <View style={styles.dayBadge}>
                    <Text style={styles.dayText}>{item.day || (index + 1)}</Text>
                </View>
                <View style={styles.timeInfo}>
                    <View style={styles.timeItem}>
                        <Text style={styles.timeLabel}>{t('ramadan.sahur').toUpperCase()}</Text>
                        <Text style={styles.timeValue}>{item.imsak}</Text>
                    </View>
                    <View style={styles.vDivider} />
                    <View style={styles.timeItem}>
                        <Text style={styles.timeLabel}>{t('ramadan.iftar').toUpperCase()}</Text>
                        <Text style={styles.timeValue}>{item.iftar}</Text>
                    </View>
                </View>
                <Text style={styles.dateText}>{item.date}</Text>
                {item.note && (
                    <View style={styles.noteContainer}>
                        <Text style={styles.noteText}>{item.note}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    <View style={styles.titleBox}>
                        <Text style={styles.title}>{t('common.ramadan').toUpperCase()}-{currentYear}</Text>
                        <Text style={styles.subtitle}>IMSAKIÝE</Text>
                        {/* ✅ YENİ: Bölge adını göster */}
                        <Text style={styles.regionName}>{regionName}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
                <FlatList
                    data={imsakiye}
                    keyExtractor={(item, i) => `${item.date || i}`}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </View>
    );
}

const TABLET_MAX_WIDTH = 680;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    titleBox: { alignItems: 'center' },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 2
    },
    subtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '800',
        letterSpacing: 4,
        marginTop: 2
    },
    // ✅ YENİ: Bölge adı stili
    regionName: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
        marginTop: 4
    },
    list: { padding: 24, paddingTop: 10, alignItems: 'center' },
    itemWrapper: { width: '100%', maxWidth: TABLET_MAX_WIDTH, alignSelf: 'center' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.glassCard,
        borderRadius: 24,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.glassBorder
    },
    dayBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(196,160,80,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16
    },
    dayText: { fontSize: 14, fontWeight: '900', color: COLORS.gold },
    timeInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    timeItem: { alignItems: 'center', flex: 1 },
    timeLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: COLORS.textSecondary,
        letterSpacing: 1,
        marginBottom: 4
    },
    timeValue: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
    vDivider: { width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.05)' },
    dateText: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '700',
        marginLeft: 12
    },
    // ✅ YENİ: Özel not stili (Kadir Gecesi, Bayram)
    noteContainer: {
        backgroundColor: 'rgba(196,160,80,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8
    },
    noteText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.gold
    }
});
