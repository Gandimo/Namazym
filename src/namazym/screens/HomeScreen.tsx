import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Easing,
    StatusBar,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Internal Services & Utils
import { TimeService } from '../services/TimeService';
import { getDailyIndex } from '../utils/localizationUtils';
import { useTranslation } from 'react-i18next';
import { TURKMEN_SURAH_NAMES } from '../constants/surahNames';
import { useCity } from '../context/CityContext';
import { getNextPrayer, getCurrentPrayer } from '../utils/prayerUtils';
import { computeMekruhInfo } from '../utils/mekruh';
import { PrayerTimesService } from '../services/PrayerTimesService';
import { DataService } from '../services/DataService';
import quranAr from '../data/quran_ar_full.json';
import { CitySelectorModal } from '../components/CitySelectorModal';
import { useAnimatedEntrance } from '../hooks/useAnimatedEntrance';
import { useScalePress } from '../hooks/useScalePress';

import { HeroPrayerCard } from '../components/HeroPrayerCard';
import { KerahatBanner } from '../components/KerahatBanner';
import { DailyPrayersList } from '../components/DailyPrayersList';
import { PillNavigationBar } from '../components/PillNavigationBar';
import { HeroSkeletonLoader } from '../components/HeroSkeletonLoader';
import { PremiumIcon } from '../components/icons/PremiumIcon';
import {
    QiblaIcon,
    BookIcon,
    BeadsIcon,
    MosqueIcon,
    CrescentIcon
} from '../components/icons';
import { DateStrip } from '../components/DateStrip';
import { ICON_SIZES, ICON_GRADIENTS } from '../theme/iconConstants';
import { tokens2026 } from '../theme/tokens2026';
import AudioPlayerService from '../services/AudioPlayerService';
import { TasbihStorageService, type TasbihState } from '../services/TasbihStorageService';
import { PrayerTrackerService, type KazaState } from '../services/PrayerTrackerService';
import { DAILY_PRAYER_KEYS, getTurkmenPrayerName } from '../constants/prayerNames';
import {
    getAdaptiveCardWidth,
    getBoundedContentWidth,
    getResponsiveLayoutMetrics,
} from '../utils/responsiveLayout';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const dailyCards = require('../data/daily_cards.json');

// Premium Design Tokens V1.1
const SKY_THEMES = {
    Fajr: ['#B9CAD8', '#E8EFF4'],
    Sunrise: ['#E4C8AE', '#F6E6D4'],
    Dhuhr: ['#D5E0E7', '#F3EFE8'],
    Asr: ['#E0C9B0', '#F2E1CF'],
    Maghrib: ['#9A756C', '#DEC0AE'],
    Isha: ['#222A3A', '#151B26'],
};

const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
    </View>
);

const DEEP_SPACE_GRADIENT = ['#11161E', '#090D13'];
const KAZA_NUDGE_AFTER_DAYS = 5;

type KazaCardPresentation = {
    title: string;
    subtitle: string;
    mainValue: string | null;
    meta: string | null;
    badge: string | null;
    progress: number;
    isHighlighted: boolean;
};

export default function HomeScreen({ navigation }: any) {
    const { t, i18n } = useTranslation();
    const { width: windowWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { placeLabel, prayerTimes, isLoading, placeKey, setPlace } = useCity();
    const [now, setNow] = useState(TimeService.now());
    const [selectedDate, setSelectedDate] = useState(TimeService.getTodayDateString());
    const [isCityModalVisible, setCityModalVisible] = useState(false);
    const [tasbihState, setTasbihState] = useState<TasbihState>({ count: 0, total: 0, limit: 33 });
    const [kazaState, setKazaState] = useState<KazaState>({ counts: {}, updatedAt: null });
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const backgroundFadeAnim = useRef(new Animated.Value(0)).current;
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const timer = setInterval(() => setNow(TimeService.now()), 1000);
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
        return () => clearInterval(timer);
    }, [fadeAnim]);

    useFocusEffect(
        React.useCallback(() => {
            let active = true;

            const loadStates = async () => {
                const [nextTasbihState, nextKazaState] = await Promise.all([
                    TasbihStorageService.getState(),
                    PrayerTrackerService.getKazaState(),
                ]);

                if (!active) return;
                setTasbihState(nextTasbihState);
                setKazaState(nextKazaState);
            };

            loadStates();

            return () => {
                active = false;
            };
        }, [])
    );

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

    // ── Kerahat (evening discouraged period) ──────────────────────────────
    // Single source of truth: computeMekruhInfo from mekruh.ts
    // kerahat = Maghrib − 45 min → Maghrib
    // severeKerahat = Maghrib − 15 min → Maghrib
    const kerahatInfo = useMemo(() => {
        const maghribStr = prayerTimes?.timings?.Maghrib;
        if (!maghribStr) return null;
        return computeMekruhInfo({ date: now, maghribTimeStr: maghribStr });
    }, [prayerTimes, now]);

    const isInKerahat = useMemo(() => {
        if (!kerahatInfo) return false;
        const nowMs = now.getTime();
        // Re-parse start/end from string to Date on today's calendar day
        const parseHHMM = (s: string) => {
            const [h, m] = s.split(':').map(Number);
            const d = new Date(now);
            d.setHours(h, m, 0, 0);
            return d.getTime();
        };
        return nowMs >= parseHHMM(kerahatInfo.kerahat.start) &&
               nowMs <  parseHHMM(kerahatInfo.kerahat.end);
    }, [kerahatInfo, now]);

    const isInSevereKerahat = useMemo(() => {
        if (!kerahatInfo || !isInKerahat) return false;
        const nowMs = now.getTime();
        const [h, m] = kerahatInfo.severeKerahat.start.split(':').map(Number);
        const severeStart = new Date(now);
        severeStart.setHours(h, m, 0, 0);
        return nowMs >= severeStart.getTime();
    }, [kerahatInfo, isInKerahat, now]);
    // ─────────────────────────────────────────────────────────────────────

    const kazaCard = useMemo<KazaCardPresentation>(() => {
        const counts = kazaState.counts || {};
        const relevantKeys = DAILY_PRAYER_KEYS.filter((key) => (counts[key] || 0) > 0);
        const totalPending = DAILY_PRAYER_KEYS.reduce((sum, key) => sum + (counts[key] || 0), 0);
        const hasSetup = kazaState.updatedAt !== null || Object.values(counts).some((value) => Number(value) > 0);
        const topNames = relevantKeys.slice(0, 2).map((key) => getTurkmenPrayerName(key));
        const remainingNames = Math.max(0, relevantKeys.length - topNames.length);
        const mainValue = relevantKeys.length === 0
            ? null
            : `${topNames.join(' • ')}${remainingNames > 0 ? ` • +${remainingNames}` : ''}`;
        const daysSinceUpdate = kazaState.updatedAt
            ? Math.floor((now.getTime() - kazaState.updatedAt) / (1000 * 60 * 60 * 24))
            : null;

        if (!hasSetup) {
            return {
                title: 'Kaza namazlary',
                subtitle: 'Näçe kazaň bar?',
                mainValue: null,
                meta: null,
                badge: 'Hasapla',
                progress: 0,
                isHighlighted: false,
            };
        }

        if (totalPending === 0) {
            return {
                title: 'Kaza namazlary',
                subtitle: 'Ähli ýerine ýetirildi',
                mainValue: null,
                meta: 'Şu gün arkaýyn dowam et',
                badge: null,
                progress: 1,
                isHighlighted: false,
            };
        }

        if (daysSinceUpdate !== null && daysSinceUpdate >= KAZA_NUDGE_AFTER_DAYS) {
            return {
                title: 'Kaza namazlary',
                subtitle: 'Byraz wagt geçdi...',
                mainValue: mainValue || 'Dowam etmäge taýýar',
                meta: `Şu gün: ${totalPending}`,
                badge: 'Gaýtadan başla',
                progress: Math.max(0.12, Math.min(0.82, relevantKeys.length / DAILY_PRAYER_KEYS.length)),
                isHighlighted: true,
            };
        }

        return {
            title: 'Kaza namazlary',
            subtitle: 'Az-azdan dowam et',
            mainValue: mainValue || 'Dowam etmäge taýýar',
            meta: `Şu gün: ${totalPending}`,
            badge: 'Dowam et',
            progress: Math.max(0.18, Math.min(0.88, relevantKeys.length / DAILY_PRAYER_KEYS.length)),
            isHighlighted: true,
        };
    }, [kazaState, now]);

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

    const [currentSky, setCurrentSky] = useState<[string, string, ...string[]]>(SKY_THEMES.Dhuhr as [string, string, ...string[]]);
    const [previousSky, setPreviousSky] = useState<[string, string, ...string[]] | null>(null);

    useEffect(() => {
        const nextSky = activeSky as [string, string, ...string[]];

        if (currentSky[0] === nextSky[0] && currentSky[1] === nextSky[1]) return;

        setPreviousSky(currentSky);
        setCurrentSky(nextSky);
        backgroundFadeAnim.setValue(1);

        Animated.timing(backgroundFadeAnim, {
            toValue: 0,
            duration: 700,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start(() => {
            setPreviousSky(null);
        });
    }, [activeSky, backgroundFadeAnim, currentSky]);

    const isDarkTheme = useMemo(() => {
        // Only Isha and Maghrib remain visually 'dark' enough for primary white text in the new luxury palette
        return current?.key === 'Isha' || current?.key === 'Maghrib';
    }, [current]);

    const headerContentColor = isDarkTheme ? '#FFFFFF' : '#2D2D35';
    const responsiveLayout = useMemo(() => getResponsiveLayoutMetrics(windowWidth), [windowWidth]);
    const contentWidth = useMemo(
        () => getBoundedContentWidth(windowWidth, responsiveLayout.horizontalPadding, responsiveLayout.contentMaxWidth),
        [responsiveLayout.contentMaxWidth, responsiveLayout.horizontalPadding, windowWidth],
    );
    const compactGridColumns = responsiveLayout.isTablet ? 3 : 2;
    const compactCardWidth = useMemo(
        () => getAdaptiveCardWidth(
            contentWidth,
            compactGridColumns,
            responsiveLayout.cardGap,
            responsiveLayout.isTablet ? 196 : 156,
            responsiveLayout.isLargeTablet ? 272 : responsiveLayout.isTablet ? 244 : 220,
        ),
        [compactGridColumns, contentWidth, responsiveLayout.cardGap, responsiveLayout.isLargeTablet, responsiveLayout.isTablet],
    );
    const compactGridWidth = useMemo(
        () => Math.min(contentWidth, (compactCardWidth * compactGridColumns) + (responsiveLayout.cardGap * (compactGridColumns - 1))),
        [compactCardWidth, compactGridColumns, contentWidth, responsiveLayout.cardGap],
    );
    const wideCardWidth = useMemo(
        () => Math.min(contentWidth, responsiveLayout.compactContentMaxWidth),
        [contentWidth, responsiveLayout.compactContentMaxWidth],
    );

    // Theme-aware Glass Tokens
    const glassTextPrimary = isDarkTheme ? '#FFFFFF' : '#2A2A32';
    const glassTextSecondary = isDarkTheme ? 'rgba(255,255,255,0.74)' : 'rgba(45,45,53,0.68)';
    const glassSurface = isDarkTheme ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.40)';
    const glassBorder = isDarkTheme ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.44)';

    // Ramadan Logic
    const currentYear = useMemo(() => now.getFullYear().toString(), [now]);
    const todayStr = useMemo(() => TimeService.getTodayDateString(), [now]);


    // Dynamic Dataset Selection
    const quranData = useMemo(() => DataService.getQuran(t('i18n.language')), [t('i18n.language')]);
    const currentLang = i18n.language;
    const hadithData = useMemo(() => DataService.getHadiths(currentLang), [currentLang]);

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
    }, [quranData, i18n.language]);

    const dailyContent = useMemo(() => {
        try {
            const curatedIndex = getDailyIndex(now, dailyCards.cards.length);
            const content = { ...dailyCards.cards[curatedIndex] };
            const verseIndex = getDailyIndex(now, versesPool.length);
            const fullVerse = versesPool[verseIndex];

            if (fullVerse) {
                const surahName = currentLang === 'tk' && TURKMEN_SURAH_NAMES[fullVerse.surah - 1] ? TURKMEN_SURAH_NAMES[fullVerse.surah - 1] : `Surah ${fullVerse.surah}`;
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
                // hadith.json uses `text_turkmen` and `narrator`; daily_cards uses `text_tm` and `speaker`
                const tmText = localizedHadith.text_tm || localizedHadith.text_turkmen || '';
                content.hadith = {
                    ...content.hadith,
                    text_localized: currentLang === 'ru' ? (localizedHadith.text_ru || localizedHadith.text_en || tmText) :
                        currentLang === 'en' ? (localizedHadith.text_en || tmText) :
                            currentLang === 'tr' ? (localizedHadith.text_tr || localizedHadith.text_en || tmText) :
                                currentLang === 'fr' ? (localizedHadith.text_fr || localizedHadith.text_en || tmText) :
                                    (tmText || content.hadith?.text_tm || ''),
                    speaker: localizedHadith.speaker || localizedHadith.narrator || 'Hz. Muhammed (s.a.w.)',
                    narrator_chain: localizedHadith.narrator_chain || '',
                };
            }
            return content;
        } catch (error) {
            return dailyCards.cards?.[0] || null;
        }
    }, [now, versesPool, hadithData, i18n.language]);

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
            <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: backgroundTranslateY }] }]}>
                <LinearGradient colors={currentSky} style={StyleSheet.absoluteFill} />
                {previousSky ? (
                    <Animated.View style={[StyleSheet.absoluteFill, { opacity: backgroundFadeAnim }]}>
                        <LinearGradient colors={previousSky} style={StyleSheet.absoluteFill} />
                    </Animated.View>
                ) : null}
            </Animated.View>

            <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
                <View
                    style={[
                        styles.header,
                        {
                            width: contentWidth,
                            alignSelf: 'center',
                            paddingTop: insets.top + 10,
                            paddingHorizontal: responsiveLayout.isTablet ? 8 : 0,
                            zIndex: 10,
                        }
                    ]}
                >
                    <View>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                setCityModalVisible(true);
                            }}
                            style={styles.locationSelector}
                        >
                            <Text style={[styles.locationText, { color: headerContentColor }]}>{placeLabel}</Text>
                            <PremiumIcon
                                name="chevron-down"
                                size="SMALL"
                                color={headerContentColor}
                                style={{ marginLeft: 4 }}
                            />
                        </Pressable>
                        <Text style={[styles.dateText, !isDarkTheme && { color: 'rgba(0,0,0,0.58)' }]}>{formattedDate}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                navigation.navigate('Settings');
                            }}
                            style={[styles.settingsBtn, !isDarkTheme && { backgroundColor: 'rgba(0,0,0,0.045)' }]}
                        >
                            <PremiumIcon
                                name="settings-outline"
                                size="STANDARD"
                                color={headerContentColor}
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
                            paddingBottom: insets.bottom + 120,
                            paddingHorizontal: responsiveLayout.horizontalPadding,
                        }
                    ]}
                >
                    <View style={[styles.contentColumn, { width: contentWidth }]}>
                    <HeroPrayerCard
                        current={current}
                        next={next}
                        remainingMs={remainingMs}
                        progress={progress}
                        delay={100}
                        isPassengerMode={selectedDate !== TimeService.getTodayDateString()}
                    />

                    {isInKerahat && prayerTimes?.timings?.Maghrib && (
                        <KerahatBanner
                            maghribTime={prayerTimes.timings.Maghrib}
                            isSevere={isInSevereKerahat}
                            isDarkTheme={isDarkTheme}
                        />
                    )}

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




                    <Animated.View style={[styles.grid, shortcutsEntrance, { width: compactGridWidth }]}>
                        <ShortcutCard
                            icon="calendar-outline"
                            label={t('common.sahetli_gun')}
                            gradient="TIME_CALENDAR"
                            onPress={() => navigation.navigate('SahetliGun')}
                            textColor={glassTextPrimary}
                            cardStyle={{ backgroundColor: glassSurface, borderColor: glassBorder }}
                            layoutStyle={{ width: compactCardWidth }}
                        />
                        <ShortcutCard
                            CustomIcon={QiblaIcon}
                            icon="navigate-circle-outline"
                            label={t('common.kybla')}
                            gradient="QIBLA_COMPASS"
                            onPress={() => navigation.navigate('QiblaScreen')}
                            textColor={glassTextPrimary}
                            cardStyle={{ backgroundColor: glassSurface, borderColor: glassBorder }}
                            layoutStyle={{ width: compactCardWidth }}
                        />
                        <ShortcutCard
                            CustomIcon={BookIcon}
                            icon="journal-outline"
                            label={t('common.namaz_kitaby')}
                            gradient="QURAN_BOOK"
                            onPress={() => navigation.navigate('NamazKitaby')}
                            textColor={glassTextPrimary}
                            cardStyle={{ backgroundColor: glassSurface, borderColor: glassBorder }}
                            layoutStyle={{ width: compactCardWidth }}
                            variant="book"
                            subtitle="Gollanma"
                        />
                        <ShortcutCard
                            CustomIcon={BookIcon}
                            icon="book-outline"
                            label={t('common.quran')}
                            gradient="QURAN_BOOK"
                            onPress={() => navigation.navigate('QuranMain')}
                            textColor={glassTextPrimary}
                            cardStyle={{ backgroundColor: glassSurface, borderColor: glassBorder }}
                            layoutStyle={{ width: compactCardWidth }}
                        />
                        <TasbihShortcutCard
                            count={tasbihState.count}
                            limit={tasbihState.limit}
                            total={tasbihState.total}
                            textColor={glassTextPrimary}
                            secondaryTextColor={glassTextSecondary}
                            cardStyle={{ backgroundColor: glassSurface, borderColor: glassBorder }}
                            layoutStyle={{ width: compactCardWidth }}
                            onPress={() => navigation.navigate('TasbihScreen')}
                            chipLabel={tasbihState.count > 0 ? 'Dowam et' : 'Bugun'}
                        />
                    </Animated.View>


                    <KazaProgressCard
                        textColor={glassTextPrimary}
                        secondaryTextColor={glassTextSecondary}
                        cardStyle={{ backgroundColor: glassSurface, borderColor: glassBorder }}
                        layoutStyle={{ width: wideCardWidth, alignSelf: 'center' }}
                        onPress={() => navigation.navigate('Kaza')}
                        presentation={kazaCard}
                        entranceStyle={kazaEntrance}
                        pressStyle={kazaPress.scaleStyle}
                        onPressIn={kazaPress.onPressIn}
                        onPressOut={kazaPress.onPressOut}
                    />


                    <Animated.View style={[styles.grid, infoEntrance, { width: compactGridWidth }]}>
                        <InfoCard
                            icon="sparkles-outline"
                            label="99"
                            gradient="HADITH_STAR"
                            onPress={() => navigation.navigate('AsmaulHusna')}
                            textColor={glassTextPrimary}
                            cardStyle={{ backgroundColor: glassSurface, borderColor: glassBorder }}
                            layoutStyle={{ width: compactCardWidth }}
                            variant="asma"
                            subtitle="Allahyň ady"
                        />
                        <InfoCard
                            CustomIcon={CrescentIcon}
                            icon="moon-outline"
                            label={t('common.islamic_holidays')}
                            gradient="TIME_CALENDAR"
                            onPress={() => navigation.navigate('IslamBayramlary')}
                            textColor={glassTextPrimary}
                            cardStyle={{ backgroundColor: glassSurface, borderColor: glassBorder }}
                            layoutStyle={{ width: compactCardWidth }}
                            variant="holiday"
                            subtitle="Möhüm günler"
                        />
                        <InfoCard
                            CustomIcon={MosqueIcon}
                            icon="business-outline"
                            label={t('common.mosques')}
                            gradient="PRAYER_GOLD"
                            onPress={() => navigation.navigate('Metjitler')}
                            textColor={glassTextPrimary}
                            cardStyle={{ backgroundColor: glassSurface, borderColor: glassBorder }}
                            layoutStyle={{ width: compactCardWidth }}
                            variant="mosque"
                            subtitle="Ýakyndaky"
                        />
                        <InfoCard
                            CustomIcon={BeadsIcon}
                            icon="flower-outline"
                            label={t('common.dogalar')}
                            gradient="PRAYER_GOLD"
                            onPress={() => navigation.navigate('Dogalar')}
                            textColor={glassTextPrimary}
                            cardStyle={{ backgroundColor: glassSurface, borderColor: glassBorder }}
                            layoutStyle={{ width: compactCardWidth }}
                            variant="dua"
                            subtitle="Oku"
                        />
                    </Animated.View>

                    <View style={styles.creatorWrapper}>
                        <Text style={[styles.creatorName, { color: glassTextSecondary }]}>
                            DÖWLET GANDYMOW
                        </Text>
                        <Text style={[styles.creatorTag, { color: glassTextSecondary }]}>
                            ÝÇK
                        </Text>
                    </View>

                    <View style={{ height: 84 }} />
                    </View>
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

const ShortcutCard = ({
    icon,
    label,
    gradient,
    onPress,
    textColor,
    cardStyle,
    CustomIcon,
    variant = 'default',
    subtitle,
    layoutStyle,
}: any) => {
    const press = useScalePress(0.985, false, 110);
    const isBook = variant === 'book';

    return (
        <AnimatedPressable
            onPressIn={isBook ? press.onPressIn : undefined}
            onPressOut={isBook ? press.onPressOut : undefined}
            onPress={() => { Haptics.selectionAsync(); onPress(); }}
            style={[
                styles.shortcutCard,
                layoutStyle,
                cardStyle,
                isBook && styles.shortcutCardBook,
                isBook && press.scaleStyle,
            ]}
        >
            {isBook ? (
                <View style={styles.shortcutBookInner}>
                    <View style={styles.shortcutBookAccentLine} />
                    <View style={styles.shortcutBookIconCapsule}>
                        {CustomIcon ? (
                            <CustomIcon color={textColor} size={24} />
                        ) : (
                            <PremiumIcon
                                name={icon}
                                size="MEDIUM"
                                gradient={gradient}
                            />
                        )}
                    </View>
                    <View style={styles.shortcutBookTextBlock}>
                        <Text style={[styles.shortcutLabel, styles.shortcutLabelBook, { color: textColor }]}>{label}</Text>
                        {subtitle ? (
                            <Text style={[styles.shortcutSubtitle, { color: textColor }]}>{subtitle}</Text>
                        ) : null}
                    </View>
                </View>
            ) : (
                <>
                    {CustomIcon ? (
                        <CustomIcon color={textColor} size={24} />
                    ) : (
                        <PremiumIcon
                            name={icon}
                            size="MEDIUM"
                            gradient={gradient}
                        />
                    )}
                    <Text style={[styles.shortcutLabel, { color: textColor }]}>{label}</Text>
                </>
            )}
        </AnimatedPressable>
    );
};

const TasbihShortcutCard = ({
    count,
    limit,
    total,
    textColor,
    secondaryTextColor,
    cardStyle,
    layoutStyle,
    onPress,
    chipLabel,
}: {
    count: number;
    limit: number;
    total: number;
    textColor: string;
    secondaryTextColor: string;
    cardStyle: any;
    layoutStyle?: any;
    onPress: () => void;
    chipLabel: string;
}) => {
    const press = useScalePress(0.97, false, 110);
    const progress = Math.max(0, Math.min(1, limit > 0 ? count / limit : 0));
    const isActive = count > 0;

    return (
        <AnimatedPressable
            onPressIn={press.onPressIn}
            onPressOut={press.onPressOut}
            onPress={() => {
                Haptics.impactAsync(isActive ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
                onPress();
            }}
            style={[
                styles.tasbihCard,
                layoutStyle,
                cardStyle,
                press.scaleStyle,
                isActive && styles.tasbihCardActive,
            ]}
        >
            <View style={[styles.tasbihAccentLine, isActive && styles.tasbihAccentLineActive]} />
            <View style={styles.tasbihCardTopRow}>
                <View style={[styles.tasbihChip, isActive && styles.tasbihChipActive]}>
                    <Text style={[styles.tasbihChipText, { color: isActive ? '#5B4615' : textColor }]}>{chipLabel}</Text>
                </View>
                <View style={[styles.tasbihIconWrap, isActive && styles.tasbihIconWrapActive]}>
                    <BeadsIcon color={textColor} size={22} />
                </View>
            </View>

            <View style={styles.tasbihCardBody}>
                <Text style={[styles.tasbihTitle, { color: textColor }]}>Tesbih</Text>
                <View style={styles.tasbihCountRow}>
                    <Text style={[styles.tasbihCount, { color: textColor }]}>{count}</Text>
                    <Text style={[styles.tasbihLimit, { color: secondaryTextColor }]}>/{limit}</Text>
                </View>
                <Text style={[styles.tasbihMeta, { color: secondaryTextColor }]}>Umumy {total}</Text>
            </View>

            <View style={styles.tasbihProgressTrack}>
                <View style={[styles.tasbihProgressFill, isActive && styles.tasbihProgressFillActive, { width: `${progress * 100}%` as const }]} />
            </View>
        </AnimatedPressable>
    );
};

const KazaProgressCard = ({
    textColor,
    secondaryTextColor,
    cardStyle,
    layoutStyle,
    onPress,
    presentation,
    entranceStyle,
    pressStyle,
    onPressIn,
    onPressOut,
}: {
    textColor: string;
    secondaryTextColor: string;
    cardStyle: any;
    layoutStyle?: any;
    onPress: () => void;
    presentation: KazaCardPresentation;
    entranceStyle: any;
    pressStyle: any;
    onPressIn: () => void;
    onPressOut: () => void;
}) => {
    return (
        <AnimatedPressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={() => {
                Haptics.impactAsync(presentation.isHighlighted ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft);
                onPress();
            }}
            style={[
                styles.glassCardWide,
                layoutStyle,
                cardStyle,
                presentation.isHighlighted && styles.kazaCardHighlighted,
                entranceStyle,
                pressStyle
            ]}
        >
            <View style={[styles.kazaAccentLine, presentation.isHighlighted && styles.kazaAccentLineActive]} />
            <View style={styles.kazaCardTopRow}>
                <View style={styles.kazaTextContent}>
                    <Text style={[styles.kazaTitle, { color: textColor }]}>{presentation.title}</Text>
                    <Text style={[styles.kazaSubtitle, { color: secondaryTextColor }]}>{presentation.subtitle}</Text>
                </View>
                {presentation.badge ? (
                    <View style={[
                        styles.kazaBadge,
                        presentation.isHighlighted ? styles.kazaBadgeActive : styles.kazaBadgeQuiet,
                    ]}>
                        <Text style={[
                            styles.kazaBadgeText,
                            presentation.isHighlighted && styles.kazaBadgeTextActive,
                            { color: presentation.isHighlighted ? '#5B4615' : textColor }
                        ]}>
                            {presentation.badge}
                        </Text>
                    </View>
                ) : null}
            </View>

            {presentation.mainValue ? (
                <View style={[styles.kazaMainValueWrap, presentation.isHighlighted && styles.kazaMainValueWrapActive]}>
                    <Text style={[styles.kazaMainValue, { color: textColor }]} numberOfLines={1}>
                        {presentation.mainValue}
                    </Text>
                </View>
            ) : null}

            {presentation.meta ? (
                <Text style={[styles.kazaMeta, { color: secondaryTextColor }]}>{presentation.meta}</Text>
            ) : null}

            <View style={styles.kazaProgressTrack}>
                <View style={[styles.kazaProgressFill, presentation.isHighlighted && styles.kazaProgressFillActive, { width: `${presentation.progress * 100}%` as const }]} />
            </View>
        </AnimatedPressable>
    );
};

const InfoCard = ({
    icon,
    label,
    gradient,
    onPress,
    textColor,
    cardStyle,
    CustomIcon,
    variant = 'default',
    subtitle,
    layoutStyle,
}: any) => {
    const press = useScalePress(0.985, false, 110);
    const isRefined = variant !== 'default';
    const isAsma = variant === 'asma';

    return (
        <AnimatedPressable
            onPressIn={isRefined ? press.onPressIn : undefined}
            onPressOut={isRefined ? press.onPressOut : undefined}
            onPress={() => { Haptics.selectionAsync(); onPress(); }}
            style={[
                styles.infoCard,
                layoutStyle,
                cardStyle,
                isRefined && styles.infoCardRefined,
                isAsma && styles.infoCardAsma,
                isRefined && press.scaleStyle,
            ]}
        >
            {isRefined ? (
                <View style={styles.infoCardInner}>
                    <View style={[styles.infoAccentLine, isAsma && styles.infoAccentLineAsma]} />
                    <View style={[
                        styles.infoIconCapsule,
                        variant === 'asma' && styles.infoIconCapsuleAsma,
                        variant === 'holiday' && styles.infoIconCapsuleHoliday,
                        variant === 'mosque' && styles.infoIconCapsuleMosque,
                        variant === 'dua' && styles.infoIconCapsuleDua,
                    ]}>
                        {CustomIcon ? (
                            <CustomIcon color={textColor} size={24} />
                        ) : (
                            <PremiumIcon
                                name={icon}
                                size="MEDIUM"
                                gradient={gradient}
                            />
                        )}
                    </View>
                    <View style={styles.infoTextBlock}>
                        <Text style={[
                            styles.infoLabel,
                            styles.infoLabelRefined,
                            isAsma && styles.infoLabelAsma,
                            { color: textColor }
                        ]}>
                            {label}
                        </Text>
                        {subtitle ? (
                            <Text style={[styles.infoSubtitle, { color: textColor }]}>
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                </View>
            ) : (
                <>
                    {CustomIcon ? (
                        <CustomIcon color={textColor} size={24} />
                    ) : (
                        <PremiumIcon
                            name={icon}
                            size="MEDIUM"
                            gradient={gradient}
                        />
                    )}
                    <Text style={[styles.infoLabel, { color: textColor }]}>{label}</Text>
                </>
            )}
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: tokens2026.colors.background.primary },
    flex: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    locationSelector: { flexDirection: 'row', alignItems: 'center' },
    locationText: { fontSize: 20, fontWeight: '900', color: tokens2026.colors.text.primary },
    dateText: { fontSize: 13, color: tokens2026.colors.text.secondary, fontWeight: '600', marginTop: 2 },
    scrollPadding: { paddingBottom: 40 },
    contentColumn: { width: '100%', alignSelf: 'center' },
    sectionHeader: { marginTop: 32, marginBottom: 14, marginLeft: 4 },
    sectionTitle: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.76)', letterSpacing: 1.65 },
    glassCardWide: {
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderRadius: 28,
        padding: 24,
        marginBottom: 14,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.28)',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignSelf: 'center' },
    shortcutCard: {
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderRadius: 24,
        padding: 22,
        marginBottom: 12,
        alignItems: 'center',
        gap: 14,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.28)',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
    },
    shortcutCardBook: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingVertical: 20,
        borderColor: 'rgba(212, 175, 120, 0.26)',
        backgroundColor: 'rgba(255,255,255,0.16)',
        shadowOpacity: 0.18,
    },
    shortcutBookInner: {
        width: '100%',
        minHeight: 88,
        justifyContent: 'space-between',
    },
    shortcutBookAccentLine: {
        position: 'absolute',
        top: 2,
        left: 2,
        right: 2,
        height: 1,
        borderRadius: 999,
        backgroundColor: 'rgba(212, 175, 120, 0.16)',
    },
    shortcutBookIconCapsule: {
        width: 50,
        height: 50,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(196,160,80,0.17)',
        borderWidth: 1,
        borderColor: 'rgba(212,175,120,0.24)',
        shadowColor: '#C4A050',
        shadowOpacity: 0.16,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
    },
    shortcutBookTextBlock: {
        marginTop: 18,
        width: '100%',
    },
    shortcutLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    shortcutLabelBook: {
        textAlign: 'left',
        fontSize: 14,
        letterSpacing: 0.2,
    },
    shortcutSubtitle: {
        marginTop: 5,
        fontSize: 11,
        fontWeight: '500',
        opacity: 0.72,
        letterSpacing: 0.18,
    },
    tasbihCard: {
        borderRadius: 24,
        padding: 18,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.28)',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        minHeight: 152,
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    tasbihCardActive: {
        shadowOpacity: 0.22,
        borderColor: 'rgba(212,175,55,0.38)',
        backgroundColor: 'rgba(255,255,255,0.16)',
    },
    tasbihAccentLine: {
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        height: 1.5,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
    tasbihAccentLineActive: {
        backgroundColor: 'rgba(201,168,76,0.22)',
    },
    tasbihCardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tasbihChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    tasbihChipActive: {
        backgroundColor: 'rgba(212,175,55,0.88)',
    },
    tasbihChipText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.18,
    },
    tasbihIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    tasbihIconWrapActive: {
        backgroundColor: 'rgba(201,168,76,0.12)',
        borderColor: 'rgba(201,168,76,0.18)',
    },
    tasbihCardBody: {
        gap: 5,
    },
    tasbihTitle: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.35,
    },
    tasbihCountRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    tasbihCount: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1.1,
        lineHeight: 36,
    },
    tasbihLimit: {
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 2,
        marginBottom: 4,
    },
    tasbihMeta: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    tasbihProgressTrack: {
        height: 6,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.12)',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    tasbihProgressFill: {
        height: '100%',
        borderRadius: 999,
        backgroundColor: tokens2026.colors.brandGold,
        opacity: 0.82,
    },
    tasbihProgressFillActive: {
        opacity: 0.95,
    },
    infoCard: {
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.28)',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
    },
    infoCardRefined: {
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingVertical: 18,
        overflow: 'hidden',
    },
    infoCardAsma: {
        borderColor: 'rgba(212, 175, 120, 0.24)',
        backgroundColor: 'rgba(255,255,255,0.15)',
        shadowOpacity: 0.18,
    },
    infoCardInner: {
        width: '100%',
        minHeight: 84,
        justifyContent: 'space-between',
    },
    infoAccentLine: {
        position: 'absolute',
        top: 1,
        left: 2,
        right: 2,
        height: 1,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.10)',
    },
    infoAccentLineAsma: {
        backgroundColor: 'rgba(212, 175, 120, 0.16)',
    },
    infoIconCapsule: {
        width: 46,
        height: 46,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    infoIconCapsuleAsma: {
        backgroundColor: 'rgba(196,160,80,0.15)',
        borderColor: 'rgba(212,175,120,0.22)',
        shadowColor: '#C4A050',
        shadowOpacity: 0.14,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
    },
    infoIconCapsuleHoliday: {
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderColor: 'rgba(196,160,80,0.12)',
    },
    infoIconCapsuleMosque: {
        backgroundColor: 'rgba(255,255,255,0.075)',
        borderColor: 'rgba(255,255,255,0.10)',
    },
    infoIconCapsuleDua: {
        backgroundColor: 'rgba(201,168,76,0.09)',
        borderColor: 'rgba(201,168,76,0.12)',
    },
    infoTextBlock: {
        marginTop: 16,
        width: '100%',
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        flex: 1,
        letterSpacing: 0.3,
    },
    infoLabelRefined: {
        flex: 0,
        textAlign: 'left',
        fontSize: 13.5,
        lineHeight: 18,
        letterSpacing: 0.18,
    },
    infoLabelAsma: {
        fontSize: 22,
        lineHeight: 24,
        letterSpacing: -0.6,
        fontWeight: '800',
    },
    infoSubtitle: {
        marginTop: 4,
        fontSize: 11,
        fontWeight: '500',
        opacity: 0.72,
        letterSpacing: 0.16,
    },
    cardContainer: {
        backgroundColor: 'rgba(250,248,243,0.96)',
        borderRadius: 28,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.14)',
        shadowColor: '#C4A050',
        shadowOpacity: 0.10,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
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
    kazaCardHighlighted: {
        borderColor: 'rgba(201,168,76,0.24)',
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    kazaAccentLine: {
        position: 'absolute',
        top: 0,
        left: 22,
        right: 22,
        height: 1.5,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    kazaAccentLineActive: {
        backgroundColor: 'rgba(201,168,76,0.22)',
    },
    kazaCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    kazaTextContent: { flex: 1 },
    kazaTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    kazaSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 4, letterSpacing: 0.2 },
    kazaMainValueWrap: {
        marginTop: 18,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.035)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.045)',
    },
    kazaMainValueWrapActive: {
        backgroundColor: 'rgba(201,168,76,0.05)',
        borderColor: 'rgba(201,168,76,0.08)',
    },
    kazaMainValue: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
    kazaMeta: { fontSize: 12, fontWeight: '600', marginTop: 10, letterSpacing: 0.2 },
    kazaBadge: {
        minHeight: 30,
        paddingHorizontal: 12,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
        borderWidth: 1,
    },
    kazaBadgeActive: {
        backgroundColor: 'rgba(201,168,76,0.92)',
        borderColor: 'rgba(255,255,255,0.18)',
    },
    kazaBadgeQuiet: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    kazaBadgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
    kazaBadgeTextActive: {
        letterSpacing: 0.12,
    },
    kazaProgressTrack: {
        height: 5,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.10)',
        overflow: 'hidden',
        marginTop: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    kazaProgressFill: { height: '100%', borderRadius: 999, backgroundColor: 'rgba(201,168,76,0.82)' },
    kazaProgressFillActive: {
        backgroundColor: 'rgba(201,168,76,0.92)',
    },
    creatorWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 48,
        paddingHorizontal: tokens2026.layout.screenPadding,
    },
    creatorName: {
        fontSize: 12,
        lineHeight: 15,
        fontWeight: '500',
        letterSpacing: 1.3,
        textAlign: 'center',
        opacity: 0.8,
    },
    creatorTag: {
        marginTop: 2,
        fontSize: 9,
        lineHeight: 11,
        fontWeight: '500',
        letterSpacing: 1.6,
        textAlign: 'center',
        opacity: 0.45,
    },
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
