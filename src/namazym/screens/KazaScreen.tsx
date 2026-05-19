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
import type { KazaPrayerItem } from '../types/kaza';
import { kazaTokens } from '../theme/kazaTokens';
import KazaPrayerCard from '../components/kaza/KazaPrayerCard';

const SKY_THEMES = {
    Fajr: ['#4A90E2', '#B8D8F4'],
    Sunrise: ['#FF9E80', '#FBE9E7'],
    Dhuhr: ['#1e90ff', '#c8eaff'],
    Asr: ['#F57C00', '#FFF3E0'],
    Maghrib: ['#311B92', '#FF8A65'],
    Isha: ['#1A237E', '#121212'],
};

const PRAYERS: KazaPrayerItem[] = [
    { key: 'irden', title: 'Ertir namazy', storageKey: 'Fajr' },
    { key: 'oyle', title: 'Öýle namazy', storageKey: 'Dhuhr' },
    { key: 'ikindi', title: 'Ikindi namazy', storageKey: 'Asr' },
    { key: 'agsam', title: 'Agşam namazy', storageKey: 'Maghrib' },
    { key: 'yatsy', title: 'Ýatsy namazy', storageKey: 'Isha' },
    { key: 'witir', title: 'Witir namazy', storageKey: 'Witr' },
];

export default function KazaScreen() {
    const navigation = useNavigation<any>();
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

    const totalCount = useMemo(
        () => PRAYERS.reduce((sum, item) => sum + (counts[item.storageKey] || 0), 0),
        [counts]
    );

    const activePrayerCount = useMemo(
        () => PRAYERS.filter((item) => (counts[item.storageKey] || 0) > 0).length,
        [counts]
    );

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
                        <Text style={styles.title}>Kaza namazlary</Text>
                        <Text style={styles.subtitle}>Az-azdan dowam et</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryBlock}>
                            <Text style={styles.summaryLabel}>Jemi galan</Text>
                            <Text style={styles.summaryValue}>{totalCount} gezek</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryBlock}>
                            <Text style={styles.summaryLabel}>Işjeň ýazgy</Text>
                            <Text style={styles.summaryValue}>{activePrayerCount}</Text>
                        </View>
                    </View>

                    {PRAYERS.map((prayer) => (
                        <KazaPrayerCard
                            key={prayer.key}
                            title={prayer.title}
                            count={counts[prayer.storageKey] || 0}
                            onIncrement={() => updateCount(prayer.storageKey, 1)}
                            onDecrement={() => updateCount(prayer.storageKey, -1)}
                            style={styles.cardSpacing}
                            testID={`kaza-card-${prayer.key}`}
                        />
                    ))}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleBox: { alignItems: 'center' },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 0.4,
    },
    subtitle: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.72)',
        fontWeight: '700',
        letterSpacing: 1.2,
        marginTop: 3,
    },
    list: {
        padding: kazaTokens.spacing.screen,
    },
    summaryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        marginBottom: 16,
    },
    summaryBlock: {
        flex: 1,
    },
    summaryDivider: {
        width: 1,
        height: 34,
        backgroundColor: 'rgba(255,255,255,0.14)',
        marginHorizontal: 16,
    },
    summaryLabel: {
        fontSize: kazaTokens.typography.summaryLabel,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.68)',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    summaryValue: {
        fontSize: kazaTokens.typography.summaryValue,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 4,
    },
    cardSpacing: {
        marginBottom: kazaTokens.spacing.stackGap,
    },
});
