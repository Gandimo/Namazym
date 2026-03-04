import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';

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

export default function LegalScreen() {
    const navigation = useNavigation();
    const { prayerTimes } = useCity();

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
                        <Text style={styles.title}>ULANUŞ ŞERTLERI</Text>
                        <Text style={styles.subtitle}>GAZET WE DÜZGÜNLER</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.glassCard}>
                        <Text style={styles.legalTitle}>Privacy Policy</Text>
                        <Text style={styles.legalText}>
                            {"We value your privacy. This application does not collect any personal data without your explicit consent. All prayer calculation data is processed locally on your device based on your selected city.\n\n"}
                            {"Namazym App operates strictly as a religious utility tool and does not share your location data with third parties."}
                        </Text>

                        <View style={styles.divider} />

                        <Text style={styles.legalTitle}>Terms of Use</Text>
                        <Text style={styles.legalText}>
                            {"By using this app, you agree to the terms listed here. All content is for educational and religious purposes only.\n\n"}
                            {"While we strive for 100% accuracy in prayer times, please verify crucial timings with your local mosque or authority."}
                        </Text>
                    </View>
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
    titleBox: { alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 4, marginTop: 2 },
    content: { padding: 24 },
    glassCard: { backgroundColor: COLORS.glassCard, borderRadius: 32, padding: 32, shadowOpacity: 0, elevation: 0, borderWidth: 1, borderColor: COLORS.glassBorder },
    legalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 16 },
    legalText: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 24, fontWeight: '600' },
    divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 32 }
});
