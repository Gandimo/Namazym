import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import { PrayerTrackerService } from '../services/PrayerTrackerService';

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

const PRAYERS = [
    { key: 'Fajr', label: 'Bomdat' },
    { key: 'Dhuhr', label: 'Öýle' },
    { key: 'Asr', label: 'Ikindi' },
    { key: 'Maghrib', label: 'Agşam' },
    { key: 'Isha', label: 'Ýassy' },
    { key: 'Witr', label: 'Witr' },
];

export default function KazaScreen() {
    const navigation = useNavigation();
    const { prayerTimes } = useCity();
    const [counts, setCounts] = React.useState<Record<string, number>>({});

    React.useEffect(() => {
        const load = async () => {
            const data = await PrayerTrackerService.getKazaCounts();
            setCounts(data);
        };
        load();
    }, []);

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    const updateCount = async (key: string, delta: number) => {
        const newCounts = { ...counts, [key]: Math.max(0, (counts[key] || 0) + delta) };
        setCounts(newCounts);
        await PrayerTrackerService.saveKazaCounts(newCounts);
    };

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
                        <Text style={styles.title}>KAZA NAMAZLARY</Text>
                        <Text style={styles.subtitle}>HASAPLAÝYŞ</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {PRAYERS.map((p) => (
                        <View key={p.key} style={styles.card}>
                            <View style={styles.info}>
                                <Text style={styles.prayerLabel}>{p.label.toUpperCase()}</Text>
                                <Text style={styles.countText}>{counts[p.key] || 0}</Text>
                            </View>
                            <View style={styles.stepper}>
                                <Pressable onPress={() => updateCount(p.key, -1)} style={styles.stepBtn}>
                                    <Ionicons name="remove" size={24} color={COLORS.textSecondary} />
                                </Pressable>
                                <View style={styles.vDivider} />
                                <Pressable onPress={() => updateCount(p.key, 1)} style={styles.stepBtn}>
                                    <Ionicons name="add" size={24} color={COLORS.gold} />
                                </Pressable>
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
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassCard, borderRadius: 28, padding: 24, marginBottom: 12, shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: COLORS.glassBorder },
    info: { flex: 1 },
    prayerLabel: { fontSize: 12, fontWeight: '900', color: COLORS.textSecondary, letterSpacing: 1.5, marginBottom: 4 },
    countText: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary },
    stepper: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 16, overflow: 'hidden' },
    stepBtn: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
    vDivider: { width: 1, height: 30, backgroundColor: 'rgba(0,0,0,0.05)', alignSelf: 'center' }
});
