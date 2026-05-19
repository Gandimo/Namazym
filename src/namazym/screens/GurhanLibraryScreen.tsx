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

const BACKGROUND_GRADIENT = ['#F4ECDD', '#EFE5D4'] as const;

const COLORS = {
    background: '#F1E8D8',
    surface: 'rgba(252, 247, 238, 0.96)',
    surfaceBorder: 'rgba(112, 86, 52, 0.10)',
    surfaceBorderSoft: 'rgba(255,255,255,0.50)',
    textPrimary: '#32281F',
    textSecondary: '#7E6C59',
    textTertiary: '#A3927F',
    gold: '#B89254',
    goldSoft: 'rgba(184, 146, 84, 0.12)',
    iconSurface: 'rgba(255, 251, 245, 0.68)',
};

export default function GurhanLibraryScreen() {
    const navigation = useNavigation<any>();
    const { prayerTimes } = useCity();

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

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
            <StatusBar barStyle="dark-content" />
            <LinearGradient colors={BACKGROUND_GRADIENT} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <PremiumIcon
                            name="chevron-back"
                            size="STANDARD"
                            color={COLORS.textPrimary}
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
    container: { flex: 1, backgroundColor: COLORS.background },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 14,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.iconSurface,
        borderWidth: 1,
        borderColor: COLORS.surfaceBorderSoft,
    },
    titleContainer: { alignItems: 'center' },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: 1.2,
    },
    headerSubtitle: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginTop: 3,
        textTransform: 'uppercase',
    },
    list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 44 },
    surahCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 17,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: COLORS.surfaceBorder,
        shadowColor: '#8A7358',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    surahNumberBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLORS.goldSoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(184, 146, 84, 0.10)',
    },
    surahNumber: { fontSize: 13, fontWeight: '800', color: COLORS.gold },
    surahInfo: { flex: 1 },
    surahName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: 0.2 },
    surahMeta: {
        fontSize: 11,
        color: COLORS.textSecondary,
        fontWeight: '700',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    arabicInfo: { alignItems: 'flex-end', marginRight: 12 },
    arabicName: {
        fontSize: 21,
        color: '#6C563C',
        fontWeight: '500',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'serif'
    },
});
