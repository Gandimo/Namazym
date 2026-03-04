import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import mosquesData from '../data/metjitler_tm.json';

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

export default function MetjitlerScreen() {
    const navigation = useNavigation();
    const { prayerTimes, placeLabel } = useCity();
    const mosques = useMemo(() => mosquesData.filter((m: any) => m.city === placeLabel || m.region === placeLabel), [placeLabel]);

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    const openMap = (lat: number, lon: number, name: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
        Linking.openURL(url);
    };

    const renderItem = ({ item }: any) => (
        <Pressable onPress={() => openMap(item.lat, item.lng, item.name)} style={styles.card}>
            <View style={styles.iconBox}>
                <Ionicons name="location" size={24} color={COLORS.gold} />
            </View>
            <View style={styles.info}>
                <Text style={styles.mosqueName}>{item.name}</Text>
                <Text style={styles.address}>{item.address}</Text>
            </View>
            <Ionicons name="navigate-circle" size={28} color={COLORS.gold} />
        </Pressable>
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
                        <Text style={styles.title}>METJITLER</Text>
                        <Text style={styles.subtitle}>{mosques.length} SANY TAPYLDY</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
                <FlatList
                    data={mosques}
                    keyExtractor={(item, i) => i.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="search" size={48} color="rgba(255,255,255,0.4)" />
                            <Text style={styles.emptyText}>Bu şäher üçin maglumat tapylmady</Text>
                        </View>
                    }
                />
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
    subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 3, marginTop: 2 },
    list: { padding: 24 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassCard, borderRadius: 24, padding: 24, marginBottom: 12, shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: COLORS.glassBorder },
    iconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(196,160,80,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    info: { flex: 1 },
    mosqueName: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 4 },
    address: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600', lineHeight: 18 },
    empty: { marginTop: 100, alignItems: 'center' },
    emptyText: { color: '#FFF', marginTop: 16, fontSize: 15, fontWeight: '600', opacity: 0.8 }
});
