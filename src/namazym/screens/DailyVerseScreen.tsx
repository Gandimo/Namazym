import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    StatusBar,
    Platform,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Internal
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import dailyCards from '../data/daily_cards.json';
import { shareText } from '../utils/shareUtils';



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

export default function DailyVerseScreen() {
    const navigation = useNavigation();
    const { prayerTimes } = useCity();

    // Get today's content based on day of year
    const content = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);
        const index = day % dailyCards.cards.length;
        return dailyCards.cards[index];
    }, []);

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    const onShare = async () => {
        const message = `GÜNÜŇ AYATY\n\n${content.ayat.text_tm}\n\n${content.ayat.reference}\n\nNamazym App`;
        await shareText({ message });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>GÜNÜŇ AYATY</Text>
                        <Text style={styles.headerSubtitle}>MUKADDES GURHANDAN</Text>
                    </View>
                    <Pressable onPress={onShare} style={styles.backButton}>
                        <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                    </Pressable>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.contentColumn}>
                        <View style={styles.mainCard}>
                            <Text style={styles.turkmenText}>{content.ayat.text_tm}</Text>

                            <View style={styles.divider} />

                            <View style={styles.referenceContainer}>
                                <Ionicons name="bookmark" size={16} color={COLORS.gold} />
                                <Text style={styles.referenceText}>{content.ayat.reference}</Text>
                            </View>
                        </View>

                        <View style={styles.hadithSmallCard}>
                            <Text style={styles.smallCardTitle}>GÜNÜŇ HADYŞY</Text>
                            <Text numberOfLines={6} style={styles.smallCardText}>{content.hadith.text_tm}</Text>
                            <Text style={styles.smallCardRef}>{content.hadith.source}</Text>
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
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center', alignItems: 'center'
    },
    titleContainer: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: 2 },
    headerSubtitle: { fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '700', letterSpacing: 3, marginTop: 2 },
    scrollContent: { padding: 24, paddingTop: 10, alignItems: 'center' },
    contentColumn: {
        width: '100%',
        maxWidth: TABLET_MAX_WIDTH,
        alignSelf: 'center',
    },
    mainCard: {
        backgroundColor: COLORS.glassCard,
        borderRadius: 32,
        padding: 40,
        marginBottom: 20,
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    arabicContainer: { marginBottom: 32, alignItems: 'center' },
    arabicText: {
        fontSize: 30, color: COLORS.textPrimary, textAlign: 'center',
        lineHeight: 52, fontWeight: '800',
        fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'serif',
    },
    divider: { height: 1, backgroundColor: 'rgba(0, 0, 0, 0.05)', marginBottom: 32 },
    turkmenText: {
        fontSize: 18, color: COLORS.textPrimary, lineHeight: 30,
        textAlign: 'center', fontWeight: '500', marginBottom: 24,
    },
    referenceContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    referenceText: { fontSize: 14, fontWeight: '800', color: COLORS.gold, marginLeft: 8, letterSpacing: 1 },
    hadithSmallCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 24,
        padding: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    smallCardTitle: { fontSize: 11, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, marginBottom: 16, textAlign: 'center', opacity: 0.8 },
    smallCardText: { fontSize: 15, color: '#FFFFFF', lineHeight: 24, textAlign: 'center', fontWeight: '500', marginBottom: 16 },
    smallCardRef: { fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', fontWeight: '700', letterSpacing: 1 },
});
