import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import sacredData from '../data/sacred_places_tm.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

    if (!place) return null;

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
                        <Text style={styles.title}>{place.name.toUpperCase()}</Text>
                        <Text style={styles.subtitle}>KEREMLI ÝER</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.mainCard}>
                        <View style={styles.section}>
                            <Ionicons name="location" size={20} color={COLORS.gold} />
                            <Text style={styles.locationText}>{place.location}</Text>
                        </View>

                        <View style={styles.divider} />

                        <Text style={styles.description}>{place.description}</Text>

                        {place.history && (
                            <View style={styles.historyBox}>
                                <Text style={styles.historyTitle}>TARYHY</Text>
                                <Text style={styles.historyText}>{place.history}</Text>
                            </View>
                        )}
                    </View>
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
    titleBox: { alignItems: 'center', flex: 1, paddingHorizontal: 12 },
    title: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1, textAlign: 'center' },
    subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 3, marginTop: 2 },
    content: { padding: 24 },
    mainCard: { backgroundColor: COLORS.glassCard, borderRadius: 32, padding: 32, shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: COLORS.glassBorder },
    section: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'center' },
    locationText: { fontSize: 14, fontWeight: '800', color: COLORS.gold, marginLeft: 8, letterSpacing: 0.5 },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 24 },
    description: { fontSize: 16, color: COLORS.textPrimary, lineHeight: 28, fontWeight: '500', marginBottom: 32 },
    historyBox: { backgroundColor: 'rgba(0,0,0,0.02)', padding: 24, borderRadius: 20 },
    historyTitle: { fontSize: 11, fontWeight: '900', color: COLORS.textSecondary, letterSpacing: 2, marginBottom: 12 },
    historyText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 24, fontWeight: '600' }
});
