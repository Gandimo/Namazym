import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '../components/icons/PremiumIcon';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import quranData from '../data/quran_tm.json';
import { SURAH_NAMES, TURKMEN_SURAH_NAMES } from '../constants/surahNames';

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

export default function GurhanLibraryScreen() {
    const navigation = useNavigation<any>();
    const { prayerTimes } = useCity();

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    const surahs = useMemo(() => {
        return quranData.surahs.map(s => ({
            ...s,
            name_turkmen_localized: TURKMEN_SURAH_NAMES[s.number - 1] || s.name_turkmen,
            arabic_name: SURAH_NAMES[s.number]?.ar || ''
        }));
    }, []);

    const renderItem = ({ item }: any) => (
        <Pressable
            onPress={() => navigation.navigate('QuranReader', { surahId: item.number })}
            style={styles.surahCard}
        >
            <View style={styles.surahNumberBox}>
                <Text style={styles.surahNumber}>{item.number}</Text>
            </View>
            <View style={styles.surahInfo}>
                <Text style={styles.surahName}>{item.name_turkmen_localized}</Text>
                <Text style={styles.surahMeta}>
                    {item.revelation_type} • {item.ayah_count} AÝAT
                </Text>
            </View>
            <View style={styles.arabicInfo}>
                <Text style={styles.arabicName}>{item.arabic_name}</Text>
            </View>
            <PremiumIcon name="chevron-forward" size="SMALL" color={COLORS.gold} style={{ opacity: 0.5 }} />
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <PremiumIcon
                            name="chevron-back"
                            size="STANDARD"
                            color="#FFFFFF"
                            interactive
                            onPress={() => navigation.goBack()}
                        />
                    </Pressable>
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>GURHAN</Text>
                        <Text style={styles.headerSubtitle}>114 SÜRE</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <FlatList
                    data={surahs}
                    keyExtractor={(item) => item.number.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    titleContainer: { alignItems: 'center' },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '700',
        letterSpacing: 1.5,
        marginTop: 2,
    },
    list: { padding: 16, paddingBottom: 40 },
    surahCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    surahNumberBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(196, 160, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    surahNumber: { fontSize: 13, fontWeight: '800', color: COLORS.gold },
    surahInfo: { flex: 1 },
    surahName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    surahMeta: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '800',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    arabicInfo: { alignItems: 'flex-end', marginRight: 12 },
    arabicName: {
        fontSize: 20,
        color: COLORS.gold,
        fontWeight: '500',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'serif'
    },
});
