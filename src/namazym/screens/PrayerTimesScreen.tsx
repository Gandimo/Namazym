import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer, ORDER } from '../utils/prayerUtils';

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

export default function PrayerTimesScreen() {
    const navigation = useNavigation<any>();
    const { prayerTimes, placeLabel } = useCity();

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={Sheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    <View style={styles.titleBox}>
                        <Text style={styles.title}>{placeLabel.toUpperCase()}</Text>
                        <Text style={styles.subtitle}>GÜNDELIK WAGTLAR</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.contentColumn}>
                        <View style={styles.glassCard}>
                            {ORDER.map((item, index) => {
                                const time = (prayerTimes?.timings as any)[item.key];
                                const isLast = index === ORDER.length - 1;
                                return (
                                    <Pressable
                                        key={item.key}
                                        style={[styles.row, !isLast && styles.rowBorder]}
                                        onPress={() => navigation.navigate('NamazDetail', { prayerKey: item.key })}
                                    >
                                        <Text style={styles.label}>{item.label}</Text>
                                        <View style={styles.right}>
                                            <Text style={styles.time}>{time}</Text>
                                            <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.2)" />
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const Sheet = StyleSheet;

const TABLET_MAX_WIDTH = 640;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    titleBox: { alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 4, marginTop: 2 },
    content: { padding: 24, alignItems: 'center' },
    contentColumn: { width: '100%', maxWidth: TABLET_MAX_WIDTH, alignSelf: 'center' },
    glassCard: { backgroundColor: COLORS.glassCard, borderRadius: 28, overflow: 'hidden', shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: COLORS.glassBorder },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    label: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
    time: { fontSize: 17, fontWeight: '900', color: COLORS.gold, marginRight: 8 },
    right: { flexDirection: 'row', alignItems: 'center' }
});
