import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    StatusBar,
    Dimensions,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Internal
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import namesData from '../data/asmaul_husna_tm.json';

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

export default function AsmaulHusnaScreen() {
    const navigation = useNavigation();
    const { prayerTimes } = useCity();
    const names = namesData;

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

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>ASMAUL-HUSNA</Text>
                        <Text style={styles.headerSubtitle}>99 MÜBÄREK ATLAR</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {names.map((item: any) => (
                        <View key={item.id} style={styles.nameCard}>
                            <View style={styles.cardHeader}>
                                <View style={styles.numberBadge}>
                                    <Text style={styles.numberText}>{item.id}</Text>
                                </View>
                                <Text style={styles.arabicName}>{item.arabic}</Text>
                            </View>

                            <View style={styles.infoContainer}>
                                <Text style={styles.nameTurkmen}>{item.latin_tr.toUpperCase()}</Text>
                                <Text style={styles.meaningText}>{item.latin_tr}</Text>
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
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    titleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '700',
        letterSpacing: 3,
        marginTop: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 10,
    },
    nameCard: {
        backgroundColor: COLORS.glassCard,
        borderRadius: 28,
        padding: 32,
        marginBottom: 16,
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    numberBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(196, 160, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    numberText: {
        fontSize: 14,
        fontWeight: '900',
        color: COLORS.gold,
    },
    arabicName: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.textPrimary,
        fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'serif',
    },
    infoContainer: {
        alignItems: 'flex-start',
    },
    nameTurkmen: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.gold,
        marginBottom: 10,
        letterSpacing: 1,
    },
    meaningText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        lineHeight: 22,
        fontWeight: '600',
    },
});
