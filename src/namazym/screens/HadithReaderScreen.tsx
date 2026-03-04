import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    StatusBar,
    Dimensions,
    Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Internal
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import { shareText, buildHadithShareMessage } from "../utils/shareUtils";
import { DataService } from '../services/DataService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Hadith = {
    id: number;
    text_turkmen: string;
    narrator: string;
    narrator_chain: string;
    source: string;
    number: string;
    reference_display: string;
};

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

export default function HadithReaderScreen({ navigation, route }: any) {
    const { t, i18n } = useTranslation();
    const { prayerTimes } = useCity();
    const hadithData = useMemo(() => DataService.getHadiths(i18n.language), [i18n.language]);
    const hadiths = hadithData.hadiths as Hadith[];

    // Check if we have overrides (e.g. from Verse of the Day context)
    const overrideNarrator = route.params?.overrideNarrator;
    const overrideSource = route.params?.overrideSource;
    const initialIndex = route.params?.hadithId ? hadiths.findIndex((h) => h.id === route.params.hadithId) : 0;

    const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

    const currentHadith = hadiths[currentIndex];
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < hadiths.length - 1;

    const narratorName = (currentIndex === initialIndex && overrideNarrator)
        ? overrideNarrator
        : currentHadith.narrator_chain;

    const sourceName = (currentIndex === initialIndex && overrideSource)
        ? overrideSource
        : currentHadith.source;

    // Theme logic
    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    const handlePrev = () => {
        if (hasPrev) setCurrentIndex(currentIndex - 1);
    };

    const handleNext = () => {
        if (hasNext) setCurrentIndex(currentIndex + 1);
    };

    const onShare = async () => {
        const message = buildHadithShareMessage({
            text: DataService.getHadithText(currentHadith, i18n.language),
            source: sourceName || "",
            number: currentHadith.number
        });
        await shareText({ message });
    };

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
                        <Text style={styles.headerTitle}>{t('common.hadith').toUpperCase()}</Text>
                        <Text style={styles.headerSubtitle}>{currentIndex + 1} / {hadiths.length}</Text>
                    </View>
                    <Pressable onPress={onShare} style={styles.backButton}>
                        <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                    </Pressable>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.hadithCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.numberBadge}>
                                <Text style={styles.hadithNumber}>{t('common.hadith').toUpperCase()} №{currentHadith.number}</Text>
                            </View>
                        </View>

                        <Text style={styles.hadithText}>{DataService.getHadithText(currentHadith, i18n.language)}</Text>

                        <View style={styles.hadithMetaBlock}>
                            <Text style={styles.hadithMetaBold}>
                                {t('common.narrator') || "Hadisi aýdan"}: {currentHadith.narrator || "Hz. Muhammed (s.a.w.)"}
                            </Text>
                            {narratorName ? (
                                <Text style={styles.hadithMetaItalic}>
                                    {t('common.reported_by') || "Riwayet eden"}: {narratorName}
                                </Text>
                            ) : null}
                            {sourceName ? (
                                <Text style={styles.hadithMetaRegular}>
                                    {t('common.source') || "Çeşme"}: {sourceName}
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    <View style={styles.navigationContainer}>
                        <Pressable
                            style={[styles.navButton, !hasPrev && styles.navButtonDisabled]}
                            onPress={handlePrev}
                            disabled={!hasPrev}
                        >
                            <Ionicons name="arrow-back" size={20} color={hasPrev ? COLORS.textPrimary : COLORS.textSecondary} />
                            <Text style={[styles.navButtonText, !hasPrev && styles.navButtonTextDisabled]}>{t('common.previous')}</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.navButton, !hasNext && styles.navButtonDisabled]}
                            onPress={handleNext}
                            disabled={!hasNext}
                        >
                            <Text style={[styles.navButtonText, !hasNext && styles.navButtonTextDisabled]}>{t('common.next')}</Text>
                            <Ionicons name="arrow-forward" size={20} color={hasNext ? COLORS.textPrimary : COLORS.textSecondary} />
                        </Pressable>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
    titleContainer: { alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "800", color: '#FFFFFF', letterSpacing: 2 },
    headerSubtitle: { fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', fontWeight: "700", letterSpacing: 1.5, marginTop: 2 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    hadithCard: { backgroundColor: COLORS.glassCard, borderRadius: 32, padding: 40, marginBottom: 24, elevation: 10, borderWidth: 1, borderColor: COLORS.glassBorder },
    cardHeader: { marginBottom: 24 },
    numberBadge: { backgroundColor: 'rgba(196, 160, 80, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
    hadithNumber: { fontSize: 12, fontWeight: "800", color: COLORS.gold, letterSpacing: 1 },
    hadithText: { fontSize: 18, lineHeight: 32, color: COLORS.textPrimary, fontWeight: '500', marginBottom: 24 },
    hadithMetaBlock: { marginTop: 16 },
    hadithMetaBold: { fontSize: 15, fontWeight: 'bold', color: '#555' },
    hadithMetaItalic: { fontSize: 14, fontStyle: 'italic', color: '#666', marginTop: 4 },
    hadithMetaRegular: { fontSize: 14, color: '#888', marginTop: 4 },
    navigationContainer: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
    navButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 64, borderRadius: 20, backgroundColor: COLORS.glassCard, elevation: 5, borderWidth: 1, borderColor: COLORS.glassBorder, gap: 12 },
    navButtonDisabled: { opacity: 0.5 },
    navButtonText: { fontSize: 15, fontWeight: "800", color: COLORS.textPrimary, textTransform: 'uppercase' },
    navButtonTextDisabled: { color: COLORS.textSecondary },
});
