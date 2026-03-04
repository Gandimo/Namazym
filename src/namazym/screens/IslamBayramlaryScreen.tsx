import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';

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

const BAYRAMLAR = [
    { date: '27-28 Mart', title: 'Leýletül-kadr gijesi', type: 'Mübärek gije' },
    { date: '30 Mart', title: 'Oraza baýramy', type: 'Baýram' },
    { date: '5 Iýun', title: 'Arafa güni', type: 'Baýram' },
    { date: '6-7-8 Iýun', title: 'Gurban baýramy', type: 'Baýram' },
    { date: '26 Iýun', title: 'Hijri täze ýyl', type: 'Mübärek gün' },
    { date: '5 Iýul', title: 'Aşura güni', type: 'Mübärek gün' },
];

export default function IslamBayramlaryScreen() {
    const navigation = useNavigation();
    const { prayerTimes } = useCity();

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

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
                        <Text style={styles.title}>MÜBÄREK GÜNLER</Text>
                        <Text style={styles.subtitle}>2026 ÝYL SENENAMASY</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {BAYRAMLAR.map((item, i) => (
                        <View key={i} style={styles.card}>
                            <View style={styles.dateBox}>
                                <Text style={styles.dateText}>{item.date}</Text>
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardType}>{item.type.toUpperCase()}</Text>
                            </View>
                        </View>
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
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
    list: { padding: 24 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassCard, borderRadius: 24, padding: 24, marginBottom: 16, shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: COLORS.glassBorder },
    dateBox: { width: 90, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(196,160,80,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 20 },
    dateText: { fontSize: 13, fontWeight: '900', color: COLORS.gold, textAlign: 'center' },
    info: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
    cardType: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '800', letterSpacing: 1 }
});
