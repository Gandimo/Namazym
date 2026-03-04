import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, Pressable, StatusBar,
    FlatList, LayoutAnimation, Platform, UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PremiumIcon } from '../components/icons/PremiumIcon';

// Data
import { ContentLoaderService } from '../services/ContentLoaderService';
import { DataService } from '../services/DataService';
import { useTranslation } from 'react-i18next';
import arabicData from '../data/quran_ar_full.json';
import { SURAH_NAMES, TURKMEN_SURAH_NAMES } from '../constants/surahNames';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const THEMES = {
    light: { background: '#FFFFFF', text: '#1A1A1A', arabic: '#2D3436', card: '#F8F9FA', border: '#EEEEEE', secondary: '#636E72' },
    sepia: { background: '#F4ECD8', text: '#5B4636', arabic: '#3D3028', card: '#EBE3CF', border: '#DCCEB0', secondary: '#5D4A3A' },
    dark: { background: '#121212', text: '#E0E0E0', arabic: '#C4A050', card: '#1E1E1E', border: '#333333', secondary: '#999999' }
};

const BASMALAH_TRANSLATIONS: Record<string, string> = {
    tk: "Rahymly we Şepagatly Allanyň ady bilen",
    ru: "Во имя Аллаха, Милостивого, Милосердного",
    en: "In the name of Allah, the Most Gracious, the Most Merciful",
    tr: "Rahman ve Rahim olan Allah'ın adıyla",
    fr: "Au nom d'Allah, le Très Miséricordieux, le Tout Miséricordieux",
};

const BasmalahHeader = ({ surahId, theme }: { surahId: number; theme: any }) => {
    const { i18n } = useTranslation();
    // Show for all Surahs except 1 (Fatiha) and 9 (At-Tawbah)
    if (surahId === 1 || surahId === 9) return null;
    const basmalahText = BASMALAH_TRANSLATIONS[i18n.language] || BASMALAH_TRANSLATIONS.tk;
    return (
        <View style={[styles.basmalahContainer, { borderBottomColor: theme.border }]}>
            <Text style={[styles.basmalahArabic, { color: theme.arabic }]}>
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </Text>
            <Text style={[styles.basmalahTurkmen, { color: theme.secondary }]}>
                {basmalahText}
            </Text>
        </View>
    );
};

export default function QuranReaderScreen() {
    const { t, i18n } = useTranslation();
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { surahId, scrollToAyah } = route.params || { surahId: 1 };
    const flatListRef = React.useRef<FlatList>(null);

    const [quranData, setQuranData] = useState<any>(null);
    const [themeKey, setThemeKey] = useState<'light' | 'sepia' | 'dark'>('light');
    const [fontSize, setFontSize] = useState(18);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const loadContent = async () => {
            const data = await ContentLoaderService.loadQuran(i18n.language);
            setQuranData(data);

            const savedSize = await AsyncStorage.getItem('quran_font_size');
            const savedTheme = await AsyncStorage.getItem('quran_theme');
            if (savedSize) setFontSize(Number(savedSize));
            if (savedTheme) setThemeKey(savedTheme as any);
        };
        loadContent();
    }, [i18n.language]);

    const toggleSettings = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowSettings(!showSettings);
    };

    const saveSize = async (change: number) => {
        const newSize = Math.max(14, Math.min(32, fontSize + change));
        setFontSize(newSize);
        await AsyncStorage.setItem('quran_font_size', newSize.toString());
    };

    const saveTheme = async (theme: 'light' | 'sepia' | 'dark') => {
        setThemeKey(theme);
        await AsyncStorage.setItem('quran_theme', theme);
    };

    const surah = useMemo(() => {
        if (!quranData) return null;
        return quranData.surahs.find((s: any) => s.number === surahId) || quranData.surahs[0];
    }, [surahId, quranData]);

    const ayahs = useMemo(() => {
        if (!surah) return [];
        const lang = i18n.language;
        return surah.ayahs.map((ayah: any) => ({
            number: ayah.number,
            translation: DataService.getVerseText(ayah, lang),
            text_ar: (arabicData as any)[`${surahId}:${ayah.number}`] || ''
        }));
    }, [surah, surahId, i18n.language]);

    useEffect(() => {
        if (scrollToAyah && ayahs.length > 0) {
            const index = ayahs.findIndex((a: any) => a.number === scrollToAyah);
            if (index !== -1) {
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                        index,
                        animated: true,
                        viewPosition: 0.2
                    });
                }, 800);
            }
        }
    }, [scrollToAyah, ayahs]);

    const theme = THEMES[themeKey];

    const renderItem = ({ item }: any) => (
        <View style={[styles.ayahCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.ayahHeader}>
                <View style={styles.ayahBadge}>
                    <Text style={styles.ayahNumber}>{item.number}</Text>
                </View>
                <Pressable style={styles.actionButton}>
                    <PremiumIcon
                        name="share-outline"
                        size="SMALL"
                        color={theme.secondary}
                        gradient="QURAN_BOOK"
                        interactive
                    />
                </Pressable>
            </View>
            <Text style={[styles.arabicText, { color: theme.arabic, fontSize: fontSize + 10 }]}>
                {item.text_ar}
            </Text>
            <Text style={[styles.translationText, { color: theme.text, fontSize }]}>
                {item.translation}
            </Text>
        </View>
    );

    if (!quranData || !surah) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={themeKey === 'dark' ? 'light-content' : 'dark-content'} />
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <PremiumIcon
                            name="chevron-back"
                            size="STANDARD"
                            color={theme.text}
                            interactive
                            onPress={() => navigation.goBack()}
                        />
                    </Pressable>
                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.headerSurahName, { color: theme.text }]}>
                            {TURKMEN_SURAH_NAMES[surahId - 1] || surah.name_turkmen || surah.name}
                        </Text>
                        <Text style={styles.headerSurahMeta}>{surah.revelation_type} • {surah.ayah_count} {t('common.verse').toUpperCase()}</Text>
                    </View>
                    <Pressable onPress={toggleSettings} style={styles.headerBtn}>
                        <PremiumIcon
                            name="options-outline"
                            size="STANDARD"
                            color={theme.text}
                            interactive
                            onPress={toggleSettings}
                        />
                    </Pressable>
                </View>

                {showSettings && (
                    <View style={[styles.settingsPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.settingRow}>
                            <Text style={[styles.settingLabel, { color: theme.secondary }]}>TEMA</Text>
                            <View style={styles.themeToggle}>
                                {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((k) => (
                                    <Pressable
                                        key={k}
                                        onPress={() => saveTheme(k)}
                                        style={[
                                            styles.themeOption,
                                            { backgroundColor: THEMES[k].background, borderColor: themeKey === k ? '#C4A050' : 'rgba(0,0,0,0.1)' }
                                        ]}
                                    />
                                ))}
                            </View>
                        </View>
                        <View style={styles.settingRow}>
                            <Text style={[styles.settingLabel, { color: theme.secondary }]}>HARP ÖLÇEGI</Text>
                            <View style={styles.sizeToggle}>
                                <Pressable onPress={() => saveSize(-2)} style={styles.sizeBtn}>
                                    <PremiumIcon name="remove" size="SMALL" color={theme.text} interactive onPress={() => saveSize(-2)} />
                                </Pressable>
                                <Text style={[styles.fontSizeVal, { color: theme.text }]}>{fontSize}</Text>
                                <Pressable onPress={() => saveSize(2)} style={styles.sizeBtn}>
                                    <PremiumIcon name="add" size="SMALL" color={theme.text} interactive onPress={() => saveSize(2)} />
                                </Pressable>
                            </View>
                        </View>
                    </View>
                )}

                <FlatList
                    ref={flatListRef}
                    data={ayahs}
                    keyExtractor={(item) => item.number.toString()}
                    ListHeaderComponent={<BasmalahHeader surahId={surahId} theme={theme} />}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    getItemLayout={(data, index) => ({
                        length: 220,
                        offset: 220 * index,
                        index,
                    })}
                    onScrollToIndexFailed={(info) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                            try {
                                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                            } catch (e) {
                                console.warn("Scroll failed, redirecting to safe state", e);
                                navigation.navigate('QuranMain' as never);
                            }
                        });
                    }}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: 1
    },
    headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitleContainer: { alignItems: 'center' },
    headerSurahName: { fontSize: 17, fontWeight: '800' },
    headerSurahMeta: { fontSize: 9, color: '#999', fontWeight: '800', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },
    settingsPanel: {
        padding: 16,
        margin: 16,
        borderRadius: 20,
        borderWidth: 1,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12
    },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    settingLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
    themeToggle: { flexDirection: 'row' },
    themeOption: { width: 34, height: 34, borderRadius: 17, marginLeft: 10, borderWidth: 2 },
    sizeToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 4 },
    sizeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    fontSizeVal: { marginHorizontal: 12, fontWeight: 'bold', fontSize: 14 },
    list: { padding: 16, paddingBottom: 60 },
    basmalahContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        marginBottom: 16,
    },
    basmalahArabic: {
        fontSize: 28,
        fontFamily: 'Amiri-Regular',
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: '500',
    },
    basmalahTurkmen: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        opacity: 0.8,
    },
    ayahCard: {
        padding: 24,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1
    },
    ayahHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    ayahBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(196,160,80,0.1)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    ayahNumber: { fontSize: 11, fontWeight: '800', color: '#C4A050' },
    actionButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    arabicText: {
        textAlign: 'right',
        lineHeight: 52,
        marginBottom: 20,
        fontFamily: 'Amiri-Regular',
        fontWeight: '500'
    },
    translationText: { lineHeight: 28, fontWeight: '400', opacity: 0.9 }
});
