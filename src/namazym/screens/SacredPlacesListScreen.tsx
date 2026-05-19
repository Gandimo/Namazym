import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import sacredData from '../data/sacred_places_tm.json';

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

export default function SacredPlacesListScreen() {
    const navigation = useNavigation<any>();
    const { prayerTimes } = useCity();
    const places = sacredData.places;

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    const renderItem = ({ item }: any) => (
        <View style={styles.itemWrapper}>
            <Pressable
                onPress={() => navigation.navigate('SacredPlaceDetail', { placeId: item.id })}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
                <View style={styles.imageBox}>
                    <Ionicons name="image-outline" size={24} color={COLORS.gold} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.placeName}>{item.name.toUpperCase()}</Text>
                    <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.gold} />
            </Pressable>
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
                        <Text style={styles.title}>KEREMLI ÝERLER</Text>
                        <Text style={styles.subtitle}>ZIÝARATGAHLAR</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <FlatList
                    data={places}
                    keyExtractor={(item, index) => (item?.id || index).toString()}
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    titleBox: { alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 4, marginTop: 2 },
    list: { padding: 24, paddingTop: 10, alignItems: 'center' },
    itemWrapper: { width: '100%', maxWidth: TABLET_MAX_WIDTH, alignSelf: 'center' },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassCard, borderRadius: 24, padding: 20, marginBottom: 16, shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: COLORS.glassBorder },
    pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    imageBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(196,160,80,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 20 },
    info: { flex: 1 },
    placeName: { fontSize: 15, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 4, letterSpacing: 0.5 },
    location: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '700' }
});
