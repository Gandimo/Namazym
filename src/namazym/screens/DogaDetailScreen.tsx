import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import { DOGALAR_LIST, AnyDogaItem } from '../data/dogalar_tm';

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

export default function DogaDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { dogaId } = route.params ?? {};
    const { prayerTimes } = useCity();

    const doga = useMemo(() => DOGALAR_LIST.find(d => d.id === dogaId), [dogaId]);

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    if (!doga) return null;

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
                        <Text style={styles.title}>{doga.title.toUpperCase()}</Text>
                        <Text style={styles.subtitle}>DOGALARYŇ OKALYŞY</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {doga.blocks ? (
                        doga.blocks.map((block: any, i: number) => (
                            <View key={i} style={styles.blockContainer}>
                                {block.type === 'sectionTitle' && <Text style={styles.sectionTitle}>{block.text}</Text>}
                                {block.type === 'subtitle' && <Text style={styles.subtitleText}>{block.text}</Text>}
                                {block.type === 'verse_lines' && block.lines.map((line: string, idx: number) => (
                                    <Text key={idx} style={styles.verseLine}>{line}</Text>
                                ))}
                                {block.type === 'text' && <Text style={styles.tmText}>{block.text}</Text>}
                            </View>
                        ))
                    ) : (
                        <View style={styles.dogaCard}>
                            <Text style={styles.dogaTitle}>{doga.title}</Text>
                            <View style={styles.divider} />
                            <Text style={styles.arabicText}>{doga.text_ar}</Text>
                            <Text style={styles.tmText}>{doga.text_read}</Text>
                        </View>
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const Sheet = StyleSheet;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    titleBox: { alignItems: 'center', flex: 1, paddingHorizontal: 12 },
    title: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1, textAlign: 'center' },
    subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 3, marginTop: 2 },
    content: { padding: 24, paddingTop: 10 },
    dogaCard: { backgroundColor: COLORS.glassCard, borderRadius: 32, padding: 32, marginBottom: 20, shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: COLORS.glassBorder },
    dogaTitle: { fontSize: 17, fontWeight: '900', color: COLORS.gold, marginBottom: 20, textAlign: 'center' },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginBottom: 24 },
    arabicText: { fontSize: 26, color: COLORS.textPrimary, textAlign: 'center', lineHeight: 48, fontWeight: '800', marginBottom: 24, fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'serif' },
    tmText: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24, textAlign: 'center', fontWeight: '600' },
    blockContainer: { backgroundColor: COLORS.glassCard, borderRadius: 24, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: COLORS.glassBorder },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: COLORS.gold, marginBottom: 12, textAlign: 'center' },
    subtitleText: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 8, textAlign: 'center', fontStyle: 'italic' },
    verseLine: { fontSize: 16, color: COLORS.textPrimary, marginBottom: 4, textAlign: 'center', lineHeight: 24 }
});
