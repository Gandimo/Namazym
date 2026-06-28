import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import sacredData from '../data/sacred_places_tm.json';

// Ana sayfa (HomeScreen) ile birebir aynı yumuşak palet.
const SKY_THEMES = {
    Fajr: ['#B9CAD8', '#E8EFF4'],
    Sunrise: ['#E4C8AE', '#F6E6D4'],
    Dhuhr: ['#D5E0E7', '#F3EFE8'],
    Asr: ['#E0C9B0', '#F2E1CF'],
    Maghrib: ['#9A756C', '#DEC0AE'],
    Isha: ['#222A3A', '#151B26'],
};

const DARK_PRAYERS = ['Isha', 'Maghrib'];

const COLORS = {
    white: '#FFFFFF',
    glassCard: 'rgba(255, 255, 255, 0.95)',
    textPrimary: '#1A1A1A',
    textSecondary: '#555555',
    gold: '#C4A050',
    glassBorder: 'rgba(0,0,0,0.02)',
};

export default function SacredPlaceDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { placeId } = route.params ?? {};
    const { prayerTimes } = useCity();

    const place = useMemo(() => sacredData.places.find(p => p.id === placeId), [placeId]);

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;
    const isDark = DARK_PRAYERS.includes(currentPrayer);
    const headerColor = isDark ? '#FFFFFF' : '#2D2D35';
    const subColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(45,45,53,0.55)';
    const backBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)';

    if (!place) return null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <LinearGradient colors={theme as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: backBg }]}>
                        <Ionicons name="chevron-back" size={24} color={headerColor} />
                    </Pressable>
                    <View style={styles.titleBox}>
                        <Text style={[styles.title, { color: headerColor }]}>{place.name.toUpperCase()}</Text>
                        <Text style={[styles.subtitle, { color: subColor }]}>KEREMLI ÝER</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.contentColumn}>
                        <View style={styles.mainCard}>
                            <View style={styles.section}>
                                <Ionicons name="location" size={20} color={COLORS.gold} />
                                <Text style={styles.locationText}>{place.location}</Text>
                            </View>

                            <View style={styles.divider} />

                            {place.short_desc ? (
                                <Text style={styles.description}>{place.short_desc}</Text>
                            ) : null}

                            {place.full_desc ? (
                                <View style={styles.historyBox}>
                                    <Text style={styles.historyTitle}>GIŇIŞLEÝIN</Text>
                                    <Text style={styles.historyText}>{place.full_desc}</Text>
                                </View>
                            ) : null}
                        </View>
                        <View style={{ height: 40 }} />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const TABLET_MAX_WIDTH = 680;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    titleBox: { alignItems: 'center', flex: 1, paddingHorizontal: 12 },
    title: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1, textAlign: 'center' },
    subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 3, marginTop: 2 },
    content: { padding: 24, alignItems: 'center' },
    contentColumn: { width: '100%', maxWidth: TABLET_MAX_WIDTH, alignSelf: 'center' },
    mainCard: { backgroundColor: COLORS.glassCard, borderRadius: 32, padding: 32, shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: COLORS.glassBorder },
    section: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'center' },
    locationText: { fontSize: 14, fontWeight: '800', color: COLORS.gold, marginLeft: 8, letterSpacing: 0.5 },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 24 },
    description: { fontSize: 16, color: COLORS.textPrimary, lineHeight: 28, fontWeight: '500', marginBottom: 32 },
    historyBox: { backgroundColor: 'rgba(0,0,0,0.02)', padding: 24, borderRadius: 20 },
    historyTitle: { fontSize: 11, fontWeight: '900', color: COLORS.textSecondary, letterSpacing: 2, marginBottom: 12 },
    historyText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 24, fontWeight: '600' }
});
