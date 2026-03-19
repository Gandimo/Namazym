import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View, Text, StyleSheet, Pressable, StatusBar,
    ScrollView, LayoutAnimation, Platform, UIManager, Animated, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Internal
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';

// Content sources
import parzData from '../data/namaz_kitaby_40_parz.json';
import imanData from '../data/namaz_kitaby_iman_ynanc_esaslary.json';
import tamizlikData from '../data/namaz_kitaby_tamizlik.json';
import taretData from '../data/namaz_kitaby_taret.json';
import gusulData from '../data/namaz_kitaby_gusul.json';
import teyemmumData from '../data/namaz_kitaby_teyemmum.json';
import ybadatData from '../data/namaz_kitaby_ybadat.json';
import namazData from '../data/namaz_kitaby_namaz.json';
import namazHukumleriData from '../data/namaz_kitaby_namaz_hukumleri.json';
import namazRekagatlaryData from '../data/namaz_kitaby_namaz_rekagatlary.json';
import namazOkalysyAdimlerData from '../data/namaz_kitaby_namaz_okalysy_adimler.json';
import besWagtOkalysyData from '../data/namaz_kitaby_bes_wagt_okalysy.json';
import namazDanSonData from '../data/namaz_kitaby_namazdan_son.json';
import jemagatData from '../data/namaz_kitaby_jemagat.json';
import sejdeSawData from '../data/namaz_kitaby_sejde_saw.json';
import sapardaJumaData from '../data/namaz_kitaby_saparda_juma.json';
import bayramTarawaData from '../data/namaz_kitaby_bayram_tarawa.json';
import jynazaData from '../data/namaz_kitaby_jynaza.json';
import nepilNamazlarData from '../data/namaz_kitaby_nepil_namazlar.json';
import bayramPitreData from '../data/namaz_kitaby_bayram_pitre.json';
import nezirYgtykafData from '../data/namaz_kitaby_nezir_ygtykaf.json';

// Localized versions (EN/RU/TR/FR) for translated chapters
import rekagatlaryEn from '../data/namaz_kitaby/namaz_kitaby_namaz_rekagatlary_en.json';
import rekagatlaryRu from '../data/namaz_kitaby/namaz_kitaby_namaz_rekagatlary_ru.json';
import rekagatlaryTr from '../data/namaz_kitaby/namaz_kitaby_namaz_rekagatlary_tr.json';
import rekagatlaryFr from '../data/namaz_kitaby/namaz_kitaby_namaz_rekagatlary_fr.json';

import adimlerEn from '../data/namaz_kitaby/namaz_kitaby_namaz_okalysy_adimler_en.json';
import adimlerRu from '../data/namaz_kitaby/namaz_kitaby_namaz_okalysy_adimler_ru.json';
import adimlerTr from '../data/namaz_kitaby/namaz_kitaby_namaz_okalysy_adimler_tr.json';
import adimlerFr from '../data/namaz_kitaby/namaz_kitaby_namaz_okalysy_adimler_fr.json';

import besWagtEn from '../data/namaz_kitaby/namaz_kitaby_bes_wagt_okalysy_en.json';
import besWagtRu from '../data/namaz_kitaby/namaz_kitaby_bes_wagt_okalysy_ru.json';
import besWagtTr from '../data/namaz_kitaby/namaz_kitaby_bes_wagt_okalysy_tr.json';
import besWagtFr from '../data/namaz_kitaby/namaz_kitaby_bes_wagt_okalysy_fr.json';

// Localized versions — Chapters 1-6 (en, ru, fr, tr)
import parzEn from '../data/namaz_kitaby/namaz_kitaby_40_parz_en.json';
import parzRu from '../data/namaz_kitaby/namaz_kitaby_40_parz_ru.json';
import parzFr from '../data/namaz_kitaby/namaz_kitaby_40_parz_fr.json';

import imanEn from '../data/namaz_kitaby/namaz_kitaby_iman_ynanc_esaslary_en.json';
import imanRu from '../data/namaz_kitaby/namaz_kitaby_iman_ynanc_esaslary_ru.json';
import imanFr from '../data/namaz_kitaby/namaz_kitaby_iman_ynanc_esaslary_fr.json';

import tamizlikEn from '../data/namaz_kitaby/namaz_kitaby_tamizlik_en.json';
import tamizlikRu from '../data/namaz_kitaby/namaz_kitaby_tamizlik_ru.json';
import tamizlikFr from '../data/namaz_kitaby/namaz_kitaby_tamizlik_fr.json';

import taretEn from '../data/namaz_kitaby/namaz_kitaby_taret_en.json';
import taretRu from '../data/namaz_kitaby/namaz_kitaby_taret_ru.json';
import taretFr from '../data/namaz_kitaby/namaz_kitaby_taret_fr.json';
import taretTr from '../data/namaz_kitaby/namaz_kitaby_taret_tr.json';
import parzTr from '../data/namaz_kitaby/namaz_kitaby_40_parz_tr.json';
import imanTr from '../data/namaz_kitaby/namaz_kitaby_iman_ynanc_esaslary_tr.json';
import tamizlikTr from '../data/namaz_kitaby/namaz_kitaby_tamizlik_tr.json';
import gusulTr from '../data/namaz_kitaby/namaz_kitaby_gusul_tr.json';
import teyemmumTr from '../data/namaz_kitaby/namaz_kitaby_teyemmum_tr.json';

import gusulEn from '../data/namaz_kitaby/namaz_kitaby_gusul_en.json';
import gusulRu from '../data/namaz_kitaby/namaz_kitaby_gusul_ru.json';
import gusulFr from '../data/namaz_kitaby/namaz_kitaby_gusul_fr.json';

import teyemmumEn from '../data/namaz_kitaby/namaz_kitaby_teyemmum_en.json';
import teyemmumRu from '../data/namaz_kitaby/namaz_kitaby_teyemmum_ru.json';
import teyemmumFr from '../data/namaz_kitaby/namaz_kitaby_teyemmum_fr.json';

const CONTENT_MAP: Record<string, any> = {
    namaz_kitaby_40_parz: parzData,
    namaz_kitaby_iman_ynanc_esaslary: imanData,
    namaz_kitaby_tamizlik: tamizlikData,
    namaz_kitaby_taret: taretData,
    namaz_kitaby_gusul: gusulData,
    namaz_kitaby_teyemmum: teyemmumData,
    namaz_kitaby_ybadat: ybadatData,
    namaz_kitaby_namaz: namazData,
    namaz_kitaby_namaz_hukumleri: namazHukumleriData,
    namaz_kitaby_namaz_rekagatlary: namazRekagatlaryData,
    namaz_kitaby_namaz_okalysy_adimler: namazOkalysyAdimlerData,
    namaz_kitaby_bes_wagt_okalysy: besWagtOkalysyData,
    namaz_kitaby_namazdan_son: namazDanSonData,
    namaz_kitaby_jemagat: jemagatData,
    namaz_kitaby_sejde_saw: sejdeSawData,
    namaz_kitaby_saparda_juma: sapardaJumaData,
    namaz_kitaby_bayram_tarawa: bayramTarawaData,
    namaz_kitaby_jynaza: jynazaData,
    namaz_kitaby_nepil_namazlar: nepilNamazlarData,
    namaz_kitaby_bayram_pitre: bayramPitreData,
    namaz_kitaby_nezir_ygtykaf: nezirYgtykafData,
};

const LOCALIZED_CONTENT_MAP: Record<string, Record<string, any>> = {
    namaz_kitaby_40_parz: { tk: parzData, en: parzEn, ru: parzRu, tr: parzTr, fr: parzFr },
    namaz_kitaby_iman_ynanc_esaslary: { tk: imanData, en: imanEn, ru: imanRu, tr: imanTr, fr: imanFr },
    namaz_kitaby_tamizlik: { tk: tamizlikData, en: tamizlikEn, ru: tamizlikRu, tr: tamizlikTr, fr: tamizlikFr },
    namaz_kitaby_taret: { tk: taretData, en: taretEn, ru: taretRu, tr: taretTr, fr: taretFr },
    namaz_kitaby_gusul: { tk: gusulData, en: gusulEn, ru: gusulRu, tr: gusulTr, fr: gusulFr },
    namaz_kitaby_teyemmum: { tk: teyemmumData, en: teyemmumEn, ru: teyemmumRu, tr: teyemmumTr, fr: teyemmumFr },
    namaz_kitaby_namaz_rekagatlary: { en: rekagatlaryEn, ru: rekagatlaryRu, tr: rekagatlaryTr, fr: rekagatlaryFr },
    namaz_kitaby_namaz_okalysy_adimler: { en: adimlerEn, ru: adimlerRu, tr: adimlerTr, fr: adimlerFr },
    namaz_kitaby_bes_wagt_okalysy: { en: besWagtEn, ru: besWagtRu, tr: besWagtTr, fr: besWagtFr },
};

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

const THEMES = {
    light: {
        id: 'light',
        bg: 'rgba(255, 255, 255, 0.92)',
        text: '#1A1A1A',
        title: '#111111',
        muted: '#555555',
        gold: '#C4A050',
        divider: 'rgba(0, 0, 0, 0.05)',
        quoteBg: 'rgba(196, 160, 80, 0.05)',
        quoteBorder: '#C4A050',
    },
    sepia: {
        id: 'sepia',
        bg: 'rgba(244, 235, 210, 0.95)',
        text: '#3b3228',
        title: '#2c241b',
        muted: '#6a5a4a',
        gold: '#8f7238',
        divider: 'rgba(143, 114, 56, 0.1)',
        quoteBg: 'rgba(143, 114, 56, 0.05)',
        quoteBorder: '#8f7238',
    },
    dark: {
        id: 'dark',
        bg: 'rgba(28, 26, 24, 0.98)',
        text: '#EAE2D6',
        title: '#F6F1E7',
        muted: 'rgba(234, 226, 214, 0.6)',
        gold: '#C4A050',
        divider: 'rgba(196, 160, 80, 0.1)',
        quoteBg: 'rgba(196, 160, 80, 0.05)',
        quoteBorder: '#C4A050',
    },
};

const STORAGE_KEY = 'namaz_reader_settings';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function NamazKitabyReaderScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { contentId } = route.params ?? {};
    const { i18n } = useTranslation();
    const { prayerTimes } = useCity();

    const [fontSize, setFontSize] = useState(18);
    const [lineHeightMult, setLineHeightMult] = useState(1.8);
    const [themeMode, setThemeMode] = useState<'light' | 'sepia' | 'dark'>('light');
    const [controlsVisible, setControlsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const theme = THEMES[themeMode];
    const scrollY = useRef(new Animated.Value(0)).current;
    const [contentHeight, setContentHeight] = useState(1);
    const [layoutHeight, setLayoutHeight] = useState(1);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const bgTheme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    const progress = scrollY.interpolate({
        inputRange: [0, Math.max(1, contentHeight - layoutHeight)],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    const bookEntry = useMemo(() => {
        if (!contentId) return null;
        const lang = i18n.language;
        const localized = LOCALIZED_CONTENT_MAP[contentId];
        if (localized && localized[lang]) {
            return localized[lang];
        }
        return CONTENT_MAP[contentId] ?? null;
    }, [contentId, i18n.language]);

    useEffect(() => {
        const load = async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY);
                if (saved) {
                    const p = JSON.parse(saved);
                    if (p.fontSize) setFontSize(p.fontSize);
                    if (p.themeMode) setThemeMode(p.themeMode);
                    if (p.lineHeightMult) setLineHeightMult(p.lineHeightMult);
                }
            } catch (_) {
            } finally {
                setIsLoaded(true);
                Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        const t = setTimeout(async () => {
            try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ fontSize, themeMode, lineHeightMult })); } catch (_) { }
        }, 500);
        return () => clearTimeout(t);
    }, [fontSize, themeMode, lineHeightMult, isLoaded]);

    const changeTheme = (m: 'light' | 'sepia' | 'dark') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setThemeMode(m);
    };
    const changeFontSize = (d: number) => setFontSize(p => Math.min(Math.max(14, p + d), 28));
    const toggleControls = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setControlsVisible(v => !v);
    };

    if (!bookEntry) return null;

    const renderBlock = (block: any, key: string | number) => {
        if (block.type === 'paragraph') {
            return (
                <Text key={key} style={[styles.paragraph, { color: theme.text, fontSize, lineHeight: fontSize * lineHeightMult }]}>
                    {block.text}
                </Text>
            );
        }
        if (block.type === 'quote') {
            return (
                <View key={key} style={[styles.quoteBox, { backgroundColor: theme.quoteBg, borderLeftColor: theme.quoteBorder }]}>
                    <Text style={[styles.quoteText, { color: theme.text, fontSize: fontSize - 1, lineHeight: (fontSize - 1) * lineHeightMult }]}>
                        {block.text}
                    </Text>
                </View>
            );
        }
        if (block.type === 'subheading') {
            return (
                <Text key={key} style={[styles.subheading, { color: theme.gold, fontSize: fontSize + 2 }]}>
                    {block.text}
                </Text>
            );
        }
        return null;
    };

    const renderBookEntry = () => {
        const nodes = bookEntry.content as any[];
        return nodes.map((node: any, i: number) => {
            if (node.type === 'heading') {
                return (
                    <View key={i} style={styles.headingBox}>
                        <Text style={[styles.mainHeading, { color: theme.gold }]}>{node.text.toUpperCase()}</Text>
                    </View>
                );
            }
            if (node.type === 'subheading') {
                return (
                    <View key={i} style={styles.subheadingBox}>
                        <Text style={[styles.centeredSubheading, { color: theme.title, fontSize: fontSize + 6 }]}>{node.text}</Text>
                        <View style={[styles.titleDivider, { backgroundColor: theme.gold }]} />
                    </View>
                );
            }
            if (node.type === 'section_heading') {
                return (
                    <View key={i} style={styles.sectionHeadingContainer}>
                        <Text style={[styles.sectionHeadingText, { color: theme.title, fontSize: fontSize + 4 }]}>
                            {node.text}
                        </Text>
                        <View style={[styles.sectionUnderline, { backgroundColor: theme.gold }]} />
                    </View>
                );
            }
            if (node.type === 'subsection_heading') {
                return (
                    <Text key={i} style={[styles.subsectionHeadingText, { color: theme.title, fontSize: fontSize + 2 }]}>
                        {node.text}
                    </Text>
                );
            }
            if (node.type === 'h4') {
                return (
                    <Text key={i} style={[styles.subsectionHeadingText, { color: theme.gold, fontSize: fontSize + 1 }]}>
                        {node.text}
                    </Text>
                );
            }
            if (node.type === 'divider') {
                return (
                    <View key={i} style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
                );
            }
            if (node.type === 'lines') {
                return (
                    <View key={i} style={styles.linesBlock}>
                        {(node.lines as string[]).map((line: string, j: number) =>
                            line === '' ? (
                                <View key={j} style={{ height: 10 }} />
                            ) : (
                                <Text key={j} style={[styles.lineText, { color: theme.text, fontSize }]}>
                                    {line}
                                </Text>
                            )
                        )}
                    </View>
                );
            }
            if (node.type === 'paragraph') {
                return (
                    <Text key={i} style={[styles.paragraph, { color: theme.text, fontSize, lineHeight: fontSize * lineHeightMult }]}>
                        {node.text}
                    </Text>
                );
            }
            if (node.type === 'quote') {
                return (
                    <View key={i} style={[styles.quoteBox, { backgroundColor: theme.quoteBg, borderLeftColor: theme.quoteBorder }]}>
                        <Text style={[styles.quoteText, { color: theme.text, fontSize: fontSize - 1, lineHeight: (fontSize - 1) * lineHeightMult }]}>
                            {node.text}
                        </Text>
                    </View>
                );
            }
            if (node.type === 'ordered_list') {
                return (
                    <View key={i} style={styles.listContainer}>
                        {(node.items as string[]).map((item: string, j: number) => (
                            <View key={j} style={styles.listRow}>
                                <Text style={[styles.listBullet, { color: theme.gold }]}>{j + 1}.</Text>
                                <Text style={[styles.listItemText, { color: theme.text, fontSize, lineHeight: fontSize * lineHeightMult }]}>{item}</Text>
                            </View>
                        ))}
                    </View>
                );
            }
            if (node.type === 'unordered_list') {
                return (
                    <View key={i} style={styles.listContainer}>
                        {(node.items as string[]).map((item: string, j: number) => (
                            <View key={j} style={styles.listRow}>
                                <Text style={[styles.listBullet, { color: theme.gold }]}>•</Text>
                                <Text style={[styles.listItemText, { color: theme.text, fontSize, lineHeight: fontSize * lineHeightMult }]}>{item}</Text>
                            </View>
                        ))}
                    </View>
                );
            }
            if (node.type === 'section') {
                return (
                    <View key={i} style={styles.sectionContainer}>
                        <Text style={[styles.sectionHeadingText, { color: theme.title, fontSize: fontSize + 2 }]}>
                            {node.title}
                        </Text>
                        <View style={[styles.sectionUnderline, { backgroundColor: theme.divider }]} />
                        {node.blocks?.map((block: any, j: number) => renderBlock(block, `b${i}_${j}`))}
                        {node.items?.map((item: string, j: number) => (
                            <Text key={j} style={[styles.listItem, { color: theme.text, fontSize, lineHeight: fontSize * lineHeightMult }]}>
                                {item}
                            </Text>
                        ))}
                    </View>
                );
            }
            return null;
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={bgTheme as any} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {bookEntry ? bookEntry.listTitle.toUpperCase() : 'NAMAZ KITABY'}
                        </Text>
                    </View>
                    <Pressable onPress={toggleControls} style={styles.controlTrigger}>
                        <Ionicons name="text-outline" size={20} color="#FFFFFF" />
                    </Pressable>
                </View>

                <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBarFill, { width: progress, backgroundColor: COLORS.gold }]} />
                </View>

                {controlsVisible && (
                    <View style={styles.controlsPanel}>
                        <View style={styles.themeRow}>
                            {(['light', 'sepia', 'dark'] as const).map((m) => (
                                <Pressable
                                    key={m}
                                    onPress={() => changeTheme(m)}
                                    style={[styles.themeOption, {
                                        backgroundColor: THEMES[m].bg,
                                        borderColor: themeMode === m ? COLORS.gold : 'transparent',
                                        borderWidth: 2,
                                    }]}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: THEMES[m].title }}>A</Text>
                                </Pressable>
                            ))}
                        </View>
                        <View style={styles.controlDivider} />
                        <View style={styles.controlRow}>
                            <Text style={styles.settingLabel}>TEXT BÖLEGI</Text>
                            <View style={styles.stepper}>
                                <Pressable onPress={() => changeFontSize(-1)} style={styles.stepBtn}><Ionicons name="remove" size={16} color={COLORS.gold} /></Pressable>
                                <Text style={styles.stepValue}>{fontSize}</Text>
                                <Pressable onPress={() => changeFontSize(1)} style={styles.stepBtn}><Ionicons name="add" size={16} color={COLORS.gold} /></Pressable>
                            </View>
                        </View>
                    </View>
                )}

                <Animated.View
                    style={[
                        styles.paperContainer,
                        {
                            backgroundColor: theme.bg,
                            opacity: fadeAnim,
                        }
                    ]}
                >
                    <Animated.ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={true}
                        scrollEventThrottle={16}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        onContentSizeChange={(_, h) => setContentHeight(h)}
                        onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}
                    >
                        {renderBookEntry()}
                        <View style={{ height: 100 }} />
                    </Animated.ScrollView>
                </Animated.View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, height: 64,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center', alignItems: 'center'
    },
    titleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
    headerTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 1.5, color: '#FFFFFF' },
    controlTrigger: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center', alignItems: 'center'
    },
    progressBarContainer: { height: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
    progressBarFill: { height: 2 },
    controlsPanel: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        marginHorizontal: 16, marginBottom: 8,
        borderRadius: 16, padding: 16,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    },
    themeRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
    themeOption: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    controlDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 12 },
    controlRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    settingLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#888' },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    stepBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(196,160,80,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    stepValue: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', minWidth: 24, textAlign: 'center' },
    paperContainer: {
        flex: 1, marginHorizontal: 12, marginBottom: 8,
        borderRadius: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    },
    scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },
    headingBox: { alignItems: 'center', marginBottom: 8 },
    mainHeading: { fontSize: 13, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
    subheadingBox: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
    centeredSubheading: { fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 },
    titleDivider: { height: 2, width: 48, borderRadius: 1, marginTop: 12 },
    sectionHeadingContainer: { marginTop: 28, marginBottom: 8 },
    sectionHeadingText: { fontWeight: '800', letterSpacing: 0.3 },
    sectionUnderline: { height: 1.5, width: 40, borderRadius: 1, marginTop: 6, marginBottom: 12 },
    subsectionHeadingText: { fontWeight: '700', marginTop: 20, marginBottom: 6 },
    dividerLine: { height: 1, marginVertical: 24, borderRadius: 1 },
    linesBlock: { marginVertical: 8 },
    lineText: { lineHeight: 28 },
    paragraph: { marginBottom: 16 },
    quoteBox: {
        borderLeftWidth: 3, paddingLeft: 16, paddingVertical: 12,
        paddingRight: 8, marginVertical: 12, borderRadius: 4,
    },
    quoteText: { fontStyle: 'italic' },
    subheading: { fontWeight: '700', marginTop: 20, marginBottom: 8 },
    listContainer: { marginVertical: 8 },
    listRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
    listBullet: { fontWeight: '700', marginRight: 10, marginTop: 2, minWidth: 20 },
    listItemText: { flex: 1 },
    listItem: { marginBottom: 8, paddingLeft: 8 },
    sectionContainer: { marginBottom: 20 },
});
