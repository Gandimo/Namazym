import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import { HapticService } from '../services/HapticService';
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

// Ana sayfadaki gibi: yalnız Isha/Maghrib koyu kabul edilir → beyaz metin.
const DARK_PRAYERS = ['Isha', 'Maghrib'];

const COLORS = {
    white: '#FFFFFF',
    glassCard: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B6B6B',
    gold: '#C4A050',
    glassBorder: 'rgba(0,0,0,0.04)',
};

// Her kategori için karakteristik gradyan + emoji + etiket.
// Gerçek fotoğraf olmadığından kartlar bu görsel kimlikle ayrışıyor.
const CATEGORY_STYLES: Record<string, { gradient: [string, string]; emoji: string; label: string; accent: string }> = {
    turbeler: { gradient: ['#C9A227', '#E7C766'], emoji: '🕌', label: 'TÜRBE', accent: '#9A7B1E' },
    ziyarat: { gradient: ['#2E7D6B', '#4FB89F'], emoji: '⛰️', label: 'ZYÝARAT', accent: '#1F5C4E' },
    tarihi: { gradient: ['#3F51B5', '#7C8BDC'], emoji: '🏛️', label: 'TARYHY', accent: '#2C3A8A' },
};

const DEFAULT_CATEGORY = { gradient: ['#C9A227', '#E7C766'] as [string, string], emoji: '🕌', label: 'KEREMLI ÝER', accent: '#9A7B1E' };

function PlaceCard({ item, onPress }: { item: any; onPress: () => void }) {
    const scale = useRef(new Animated.Value(1)).current;
    const cat = CATEGORY_STYLES[item.category_id as string] ?? DEFAULT_CATEGORY;

    const pressIn = () => {
        HapticService.softImpact?.();
        Animated.timing(scale, { toValue: 0.97, duration: 110, useNativeDriver: true }).start();
    };
    const pressOut = () => {
        Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    };

    return (
        <View style={styles.itemWrapper}>
            <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
                <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
                    <LinearGradient
                        colors={cat.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.imageBox}
                    >
                        <Text style={styles.emoji}>{cat.emoji}</Text>
                    </LinearGradient>

                    <View style={styles.info}>
                        <View style={[styles.badge, { backgroundColor: cat.gradient[0] + '1F' }]}>
                            <Text style={[styles.badgeText, { color: cat.accent }]}>{cat.label}</Text>
                        </View>
                        <Text style={styles.placeName} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-sharp" size={12} color={COLORS.gold} />
                            <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
                        </View>
                    </View>

                    <View style={styles.chevronCircle}>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.gold} />
                    </View>
                </Animated.View>
            </Pressable>
        </View>
    );
}

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
    const isDark = DARK_PRAYERS.includes(currentPrayer);

    const headerColor = isDark ? '#FFFFFF' : '#2D2D35';
    const subColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(45,45,53,0.55)';
    const backBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)';

    const renderItem = ({ item }: any) => (
        <PlaceCard
            item={item}
            onPress={() => navigation.navigate('SacredPlaceDetail', { placeId: item.id })}
        />
    );

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
                        <Text style={[styles.title, { color: headerColor }]}>ZYÝARAT ÝERLERI</Text>
                        <Text style={[styles.subtitle, { color: subColor }]}>RUHY WE TARYHY ÝERLER</Text>
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
    list: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },
    itemWrapper: { width: '100%', maxWidth: TABLET_MAX_WIDTH, alignSelf: 'center' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.glassCard,
        borderRadius: 22,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        shadowColor: '#1A1036',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
        elevation: 6,
    },
    imageBox: {
        width: 62,
        height: 62,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 3,
    },
    emoji: { fontSize: 28, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    info: { flex: 1, justifyContent: 'center' },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
    badgeText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 1 },
    placeName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.2, lineHeight: 20 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
    location: { flex: 1, fontSize: 12.5, color: COLORS.textSecondary, fontWeight: '600' },
    chevronCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(196,160,80,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
});
