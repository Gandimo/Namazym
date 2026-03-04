import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Animated,
    Dimensions,
    StatusBar,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Internal Services & Utils
import { TimeService } from '../services/TimeService';
import { getDailyIndex } from '../utils/localizationUtils';
import { useTranslation } from 'react-i18next';
import { TURKMEN_SURAH_NAMES } from '../constants/surahNames';
import { useCity } from '../context/CityContext';
import { getNextPrayer, getCurrentPrayer } from '../utils/prayerUtils';
import { PrayerTimesService } from '../services/PrayerTimesService';
import globalVakitler from '../data/global_vakitler_v3.json';
import { DataService } from '../services/DataService';
import quranAr from '../data/quran_ar_full.json';
import { CitySelectorModal } from '../components/CitySelectorModal';
import { useAnimatedEntrance } from '../hooks/useAnimatedEntrance';
import { useScalePress } from '../hooks/useScalePress';

import { HeroPrayerCard } from '../components/HeroPrayerCard';
import { DailyPrayersList } from '../components/DailyPrayersList';
import { PillNavigationBar } from '../components/PillNavigationBar';
import { HeroSkeletonLoader } from '../components/HeroSkeletonLoader';
import { PremiumIcon } from '../components/icons/PremiumIcon';
import { DateStrip } from '../components/DateStrip';
import { ICON_SIZES, ICON_GRADIENTS } from '../theme/iconConstants';
import { tokens2026 } from '../theme/tokens2026';
import AudioPlayerService from '../services/AudioPlayerService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Premium Design Tokens V1.1
const SKY_THEMES = {
    Fajr: ['#4A90E2', '#B8D8F4'],
    Sunrise: ['#FF9E80', '#FBE9E7'],
    Dhuhr: ['#1e90ff', '#c8eaff'],
    Asr: ['#F57C00', '#FFF3E0'],
    Maghrib: ['#311B92', '#FF8A65'],
    Isha: ['#1A237E', '#121212'],
};

const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
    </View>
);

const DEEP_SPACE_GRADIENT = ['#0A0A0F', '#1A1A2E'];

export default function HomeScreen({ navigation }: any) {
    const { t, i18n } = useTranslation();
    const insets = useSafeAreaInsets();
    const { placeLabel, prayerTimes, isLoading, placeKey, setPlace } = useCity();
    const [now, setNow] = useState(TimeService.now());
    const [selectedDate, setSelectedDate] = useState(TimeService.getTodayDateString());
    const [isCityModalVisible, setCityModalVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setInterval(() => setNow(TimeService.now()), 1000);
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        return () => clearInterval(timer);
    }, [fadeAnim]);

    const current = useMemo(() => prayerTimes ? getCurrentPrayer(now, prayerTimes.timings as any) : null, [prayerTimes, now]);
    const next = useMemo(() => prayerTimes ? getNextPrayer(now, prayerTimes.timings as any) : null, [prayerTimes, now]);

    // Passenger Mode Data Lookup
    const selectedPrayerTimes = useMemo(() => {
        return PrayerTimesService.getPrayerTimes(selectedDate, placeKey);
    }, [selectedDate, placeKey]);

    const remainingMs = useMemo(() => next ? next.dateObj.getTime() - now.getTime() : 0, [next, now]);

    const progress = useMemo(() => {
        if (!current || !next) return 0;
        const total = next.dateObj.getTime() - current.dateObj.getTime();
        const passed = now.getTime() - current.dateObj.getTime();
        return Math.max(0, Math.min(1, passed / total));
    }, [current, next, now]);

    // Selection Haptics
    const prevCurrentKey = useRef<string | null>(null);
    useEffect(() => {
        if (current?.key && current.key !== prevCurrentKey.current) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            prevCurrentKey.current = current.key;
        }
    }, [current]);

    const activeSky = useMemo(() => {
        const sky = (SKY_THEMES as any)[current?.key || 'Dhuhr'];
        return sky || DEEP_SPACE_GRADIENT;
    }, [current]);

    const isDarkTheme = useMemo(() => {
        return current?.key === 'Isha' || current?.key === 'Fajr';
    }, [current]);

    // Ramadan Logic
    const currentYear = useMemo(() => now.getFullYear().toString(), [now]);
    const todayStr = useMemo(() => TimeService.getTodayDateString(), [now]);
    const ramadanConfig = useMemo(() => (globalVakitler.years as any)[currentYear]?.ramadan, [currentYear]);

    const isRamadanActive = useMemo(() => (selectedPrayerTimes as any)?.ir || false, [selectedPrayerTimes]);

    // Dynamic Dataset Selection
    const quranData = useMemo(() => DataService.getQuran(t('i18n.language')), [t('i18n.language')]);
    const currentLang = i18n.language;
    const hadithData = useMemo(() => DataService.getHadiths(currentLang), [currentLang]);
    const dailyCards = useMemo(() => require('../data/daily_cards.json'), []); // Base structure

    const versesPool = useMemo(() => {
        const pool = [];
        const lang = i18n.language;
        if (!quranData?.surahs) return [];

        for (const surah of quranData.surahs) {
            if (!surah.ayahs) continue;
            for (const ayah of surah.ayahs) {
                const key = `${surah.number}:${ayah.number}`;
                pool.push({
                    surah: surah.number,
                    ayah: ayah.number,
                    text_localized: DataService.getVerseText(ayah, lang),
                    text_ar: (quranAr as Record<string, string>)[key] || "",
                });
            }
        }
        return pool;
    }, [quranData, t('i18n.language')]);

    const dailyContent = useMemo(() => {
        try {
            const curatedIndex = getDailyIndex(now, dailyCards.cards.length);
            const content = { ...dailyCards.cards[curatedIndex] };
            const verseIndex = getDailyIndex(now, versesPool.length);
            const fullVerse = versesPool[verseIndex];

            if (fullVerse) {
                const surahName = lang === 'tk' && TURKMEN_SURAH_NAMES[fullVerse.surah - 1] ? TURKMEN_SURAH_NAMES[fullVerse.surah - 1] : `Surah ${fullVerse.surah}`;
                content.ayat = {
                    type: 'verse',
                    surah: fullVerse.surah,
                    ayah: fullVerse.ayah,
                    text_ar: fullVerse.text_ar,
                    text_localized: fullVerse.text_localized,
                    reference: `${surahName}, ${fullVerse.ayah}`
                };
            }

            // Localized Hadith
            const hIdx = getDailyIndex(now, hadithData.hadiths.length);
            const localizedHadith = hadithData.hadiths[hIdx];
            if (localizedHadith) {
                content.hadith = {
                    ...content.hadith,
                    text_localized: currentLang === 'ru' ? (localizedHadith.text_ru || localizedHadith.text_en || localizedHadith.text_tm) :
                        currentLang === 'en' ? (localizedHadith.text_en || localizedHadith.text_tm) :
                            currentLang === 'tr' ? (localizedHadith.text_tr || localizedHadith.text_en || localizedHadith.text_tm) :
                                currentLang === 'fr' ? (localizedHadith.text_fr || localizedHadith.text_en || localizedHadith.text_tm) :
                                    (localizedHadith.text_tm || ""),
                    speaker: localizedHadith.speaker,
                    narrator_chain: localizedHadith.narrator_chain,
                };
            }

            return content;
        } catch (error) {
            return dailyCards.cards?.[0] || null;
        }
    }, [now, versesPool, hadithData, t('i18n.language')]);

    // Entrance Animations
    const ayatEntrance = useAnimatedEntrance(260);
    const hadithEntrance = useAnimatedEntrance(340);
    const ramadanEntrance = useAnimatedEntrance(420);
    const shortcutsEntrance = useAnimatedEntrance(500);
    const kazaEntrance = useAnimatedEntrance(580);
    const infoEntrance = useAnimatedEntrance(660);

    // Scale Press Interactions
    const ayatPress = useScalePress();
    const hadithPress = useScalePress();
    const ramadanPress = useScalePress();
    const kazaPress = useScalePress();

    if (isLoading || !prayerTimes) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <LinearGradient colors={DEEP_SPACE_GRADIENT as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
                <View style={{ paddingTop: insets.top + 60 }}>
                    <HeroSkeletonLoader />
                </View>
            </View>
        );
    }

    const formattedDate = now.toLocaleDateString('tk-TM', { day: 'numeric', month: 'long', year: 'numeric' });

    // Parallax Effect (0.04 factor)
    const backgroundTranslateY = scrollY.interpolate({
        inputRange: [0, 500],
        outputRange: [0, 500 * 0.04],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: backgroundTranslateY }] }]}>
                <LinearGradient colors={activeSky as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
            </Animated.View>

            <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
                <View style={[styles.header, { paddingTop: insets.top + 10, zIndex: 10 }]}>
                    <View>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setCityModalVisible(true);
                            }}
                            style={styles.locationSelector}
                        >
                            <Text style={styles.locationText}>{placeLabel}</Text>
                            <PremiumIcon
                                name="chevron-down"
                                size="SMALL"
                                color="white"
                                style={{ marginLeft: 4 }}
                            />
                        </Pressable>
                        <Text style={styles.dateText}>{formattedDate}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                navigation.navigate('Settings');
                            }}
                            style={styles.settingsBtn}
                        >
                            <PremiumIcon
                                name="settings-outline"
                                size="STANDARD"
                                color="white"
                                interactive
                                onPress={() => navigation.navigate('Settings')}
                            />
                        </Pressable>
                    </View>
                </View>

                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    contentContainerStyle={[
                        styles.scrollPadding,
                        {
                            paddingTop: insets.top + 80,
                            paddingBottom: insets.bottom + 120
                        }
                    ]}
                >
                    <HeroPrayerCard
                        current={current}
                        next={next}
                        remainingMs={remainingMs}
                        progress={progress}
                        delay={100}
                        isPassengerMode={selectedDate !== TimeService.getTodayDateString()}
                    />

                    <DateStrip
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                    />

                    <DailyPrayersList
                        prayerTimes={selectedPrayerTimes}
                        current={selectedDate === TimeService.getTodayDateString() ? current : null}
                        next={selectedDate === TimeService.getTodayDateString() ? next : null}
                        progress={progress}
                        isDarkTheme={isDarkTheme}
                        delay={180}
                    />
                    {dailyContent?.ayat && (
                        <AnimatedPressable
                            onPressIn={ayatPress.onPressIn}
                            onPressOut={ayatPress.onPressOut}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                if (dailyContent?.ayat?.surah) {
                                    navigation.navigate('QuranReader', {
                                        surahId: dailyContent.ayat.surah,
                                        scrollToAyah: dailyContent.ayat.ayah
                                    });
                                }
                            }}
                            style={[styles.cardContainer, ayatEntrance, ayatPress.scaleStyle]}
                        >
                            <View style={styles.cardHeaderRow}>
                                <Text style={styles.cardHeaderTitle}>{t('home.verse_of_day').toUpperCase()}</Text>
                                <PremiumIcon name="book-outline" size="SMALL" color={tokens2026.colors.brandGold} />
                            </View>

                            {dailyContent?.ayat?.text_ar && (
                                <Text style={styles.cardArabicText}>
                                    {dailyContent.ayat.text_ar}
                                </Text>
                            )}

                            <Text style={styles.cardTmText}>
                                {dailyContent?.ayat?.text_localized}
                            </Text>

                            <View style={styles.cardFooterRow}>
                                <Text style={styles.verseFooterRow1}>
                                    {dailyContent?.ayat?.reference || ""}
                                </Text>
                                <Text style={styles.cardActionBtn}>{t('common.read')} {"->"}</Text>
                            </View>
                        </AnimatedPressable>
                    )}

                    <SectionHeader title={t('home.hadith_of_day')} />
                    {dailyContent?.hadith && (
                        <AnimatedPressable
                            onPressIn={hadithPress.onPressIn}
                            onPressOut={hadithPress.onPressOut}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                navigation.navigate('HadithReader', {
                                    hadithId: dailyContent.hadith.id || 1,
                                    overrideNarrator: dailyContent.hadith.narrator_chain,
                                    overrideSource: dailyContent.hadith.source
                                });
                            }}
                            style={[styles.cardContainer, hadithEntrance, hadithPress.scaleStyle]}
                        >
                            <View style={styles.cardHeaderRow}>
                                <Text style={styles.cardHeaderTitle}>{t('home.hadith_of_day').toUpperCase()}</Text>
                                <PremiumIcon name="heart-outline" size="SMALL" color={tokens2026.colors.brandGold} />
                            </View>

                            {dailyContent.hadith.text_localized ? (
                                <Text style={styles.cardTmText}>
                                    {dailyContent.hadith.text_localized}
                                </Text>
                            ) : null}

                            <View style={styles.hadithMetaBlock}>
                                <Text style={styles.hadithMetaBold}>
                                    {t('common.narrator')}: {dailyContent.hadith.speaker || "Hz. Muhammed (s.a.w.)"}
                                </Text>
                                <Text style={styles.hadithMetaItalic}>
                                    {t('common.reported_by')}: {dailyContent.hadith.narrator_chain || "Sähl bin Sa'd"}
                                </Text>
                            </View>

                            <View style={[styles.cardFooterRow, { marginTop: 16 }]}>
                                <Text style={styles.cardActionBtn}>{t('common.read')} {"->"}</Text>
                            </View>
                        </AnimatedPressable>
                    )}

                    {isRamadanActive && (
                        <>

                            <AnimatedPressable
                                onPressIn={ramadanPress.onPressIn}
                                onPressOut={ramadanPress.onPressOut}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    navigation.navigate('RamadanCalendar');
                                }}
                                style={[styles.ramadanCard, ramadanEntrance, ramadanPress.scaleStyle]}
                            >
                                <View style={styles.ramadanContent}>
                                    <PremiumIcon
                                        name="moon-outline"
                                        size="MEDIUM"
                                        gradient="RAMADAN_MOON"
                                        interactive
                                    />
                                    <View style={{ marginLeft: 16 }}>
                                        <Text style={styles.ramadanTitle}>Ramazan {currentYear}</Text>
                                        <Text style={styles.ramadanSubtitle}>{''}</Text>
                                    </View>
                                </View>
                                <PremiumIcon
                                    name="chevron-forward"
                                    size="SMALL"
                                    color={tokens2026.colors.brandGold}
                                />
                            </AnimatedPressable>
                        </>
                    )}


                    <Animated.View style={[styles.grid, shortcutsEntrance]}>
                        <ShortcutCard icon="calendar-outline" label={t('common.sahetli_gun')} gradient="TIME_CALENDAR" onPress={() => navigation.navigate('SahetliGun')} />
                        <ShortcutCard icon="navigate-circle-outline" label={t('common.kybla')} gradient="QIBLA_COMPASS" onPress={() => navigation.navigate('QiblaScreen')} />
                        <ShortcutCard icon="journal-outline" label={t('common.namaz_kitaby')} gradient="QURAN_BOOK" onPress={() => navigation.navigate('NamazKitaby')} />
                        <ShortcutCard icon="book-outline" label={t('common.quran')} gradient="QURAN_BOOK" onPress={() => navigation.navigate('QuranMain')} />
                        <ShortcutCard icon="ellipse-outline" label={t('common.tasbih')} gradient="PRAYER_GOLD" onPress={() => navigation.navigate('TasbihScreen')} />
                    </Animated.View>


                    <AnimatedPressable
                        onPressIn={kazaPress.onPressIn}
                        onPressOut={kazaPress.onPressOut}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate('Kaza');
                        }}
                        style={[styles.glassCardWide, kazaEntrance, kazaPress.scaleStyle]}
                    >
                        <View style={styles.kazaRow}>
                            <View style={styles.kazaTextContent}>
                                <Text style={styles.kazaTitle}>{t('common.kaza')}</Text>
                                <Text style={styles.kazaSubtitle}>{t('home.kaza_subtitle')}</Text>
                            </View>
                            <View style={styles.kazaBadge}>
                                <Text style={styles.kazaCount}>0</Text>
                            </View>
                        </View>
                    </AnimatedPressable>


                    <Animated.View style={[styles.grid, infoEntrance]}>
                        <InfoCard icon="sparkles-outline" label="99" gradient="HADITH_STAR" onPress={() => navigation.navigate('AsmaulHusna')} />
                        <InfoCard icon="moon-outline" label={t('common.islamic_holidays')} gradient="TIME_CALENDAR" onPress={() => navigation.navigate('IslamBayramlary')} />
                        <InfoCard icon="business-outline" label={t('common.mosques')} gradient="PRAYER_GOLD" onPress={() => navigation.navigate('Metjitler')} />
                        <InfoCard icon="flower-outline" label={t('common.dogalar')} gradient="PRAYER_GOLD" onPress={() => navigation.navigate('Dogalar')} />
                    </Animated.View>

                    <View style={{ height: 100 }} />
                </Animated.ScrollView>

                <PillNavigationBar navigation={navigation} />

                {/* Floating Stop Adhan Button */}
                {AudioPlayerService.isPlaying() && (
                    <AnimatedPressable
                        onPress={() => {
                            AudioPlayerService.stop();
                            // Force re-render to hide button
                            setNow(new Date());
                        }}
                        style={[(styles as any).stopAdhanBtn, { bottom: insets.bottom + 100 }]}
                    >
                        <LinearGradient
                            colors={['#C9A84C', '#8E793E']}
                            style={(styles as any).stopAdhanGradient}
                        >
                            <PremiumIcon name="stop-circle-outline" size="STANDARD" color="white" />
                            <Text style={(styles as any).stopAdhanText}>Azany sakla</Text>
                        </LinearGradient>
                    </AnimatedPressable>
                )}

                <CitySelectorModal
                    visible={isCityModalVisible}
                    onClose={() => setCityModalVisible(false)}
                    onSelect={(place) => setPlace(place.key)}
                    currentCityId={placeKey}
                />
            </Animated.View>
        </View >
    );
}

const ShortcutCard = ({ icon, label, gradient, onPress }: any) => (
    <Pressable
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
        style={styles.shortcutCard}
    >
        <PremiumIcon
            name={icon}
            size="MEDIUM"
            gradient={gradient}
            interactive
            onPress={onPress}
        />
        <Text style={styles.shortcutLabel}>{label}</Text>
    </Pressable>
);

const InfoCard = ({ icon, label, gradient, onPress }: any) => (
    <Pressable
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
        style={styles.infoCard}
    >
        <PremiumIcon
            name={icon}
            size="MEDIUM"
            gradient={gradient}
            interactive
            onPress={onPress}
        />
        <Text style={styles.infoLabel}>{label}</Text>
    </Pressable>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens2026.colors.background.primary },
    flex: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    locationSelector: { flexDirection: 'row', alignItems: 'center' },
    locationText: { fontSize: 20, fontWeight: '900', color: tokens2026.colors.text.primary },
    dateText: { fontSize: 13, color: tokens2026.colors.text.secondary, fontWeight: '600', marginTop: 2 },
    scrollPadding: { paddingHorizontal: tokens2026.layout.screenPadding, paddingBottom: 40 },
    sectionHeader: { marginTop: 28, marginBottom: 12, marginLeft: 4 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: tokens2026.colors.text.secondary, letterSpacing: 2 },
    glassCardWide: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 28,
        padding: 24,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.25)',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    shortcutCard: {
        width: (SCREEN_WIDTH - 54) / 2,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 12,
        alignItems: 'center',
        gap: 12,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.25)',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    shortcutLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    infoCard: {
        width: (SCREEN_WIDTH - 54) / 2,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.25)',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
        letterSpacing: 0.3,
    },
    cardContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
        borderRadius: 28,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.15)',
        shadowColor: '#C4A050',
        shadowOpacity: 0.12,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 16 },
        elevation: 16,
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardHeaderTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, color: '#666' },
    cardArabicText: {
        fontFamily: 'Amiri-Regular',
        fontSize: 26,
        textAlign: 'right',
        color: '#1A1A1A',
        lineHeight: 42,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(201,168,76,0.2)',
    },
    cardTmText: {
        fontSize: 15,
        color: '#333333',
        lineHeight: 24,
        fontWeight: '500',
        textAlign: 'left',
        marginTop: 4,
    },
    cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    verseFooterRow1: { fontSize: 14, fontWeight: 'bold', color: '#555', marginTop: 16 },
    cardActionBtn: { color: tokens2026.colors.brandGold, fontWeight: '600', fontSize: 14 },
    hadithMetaBlock: { marginTop: 12 },
    hadithMetaBold: { fontSize: 13, fontWeight: 'bold', color: '#555' },
    hadithMetaItalic: { fontSize: 13, fontStyle: 'italic', color: '#666', marginTop: 2 },
    ramadanCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 20 },
    ramadanContent: { flexDirection: 'row', alignItems: 'center' },
    ramadanTitle: { fontSize: 16, fontWeight: '800', color: tokens2026.colors.text.primary },
    ramadanSubtitle: { fontSize: 12, color: tokens2026.colors.text.secondary, fontWeight: '600' },
    kazaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    kazaTextContent: { flex: 1 },
    kazaTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    kazaSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    kazaBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: tokens2026.colors.brandGold, alignItems: 'center', justifyContent: 'center' },
    kazaCount: { color: '#FFF', fontSize: 14, fontWeight: '900' },
    stopAdhanBtn: {
        position: 'absolute',
        alignSelf: 'center',
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    stopAdhanGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    stopAdhanText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 14,
        marginLeft: 10,
        letterSpacing: 1,
    }
});
