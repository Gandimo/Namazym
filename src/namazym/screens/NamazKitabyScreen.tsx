import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    StatusBar,
    ScrollView,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Internal
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import {
    getAdaptiveCardWidth,
    getBoundedContentWidth,
    getResponsiveLayoutMetrics,
} from '../utils/responsiveLayout';

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



export default function NamazKitabyScreen() {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const { prayerTimes } = useCity();
    const responsiveLayout = useMemo(() => getResponsiveLayoutMetrics(width), [width]);
    const contentWidth = useMemo(
        () => getBoundedContentWidth(width, responsiveLayout.horizontalPadding, responsiveLayout.contentMaxWidth),
        [responsiveLayout.contentMaxWidth, responsiveLayout.horizontalPadding, width],
    );
    const gridColumns = responsiveLayout.isTablet ? 2 : 1;
    const cardGap = responsiveLayout.cardGap;
    const tabletCardWidth = useMemo(
        () => getAdaptiveCardWidth(
            contentWidth,
            gridColumns,
            cardGap,
            260,
            responsiveLayout.isLargeTablet ? 420 : 360,
        ),
        [cardGap, contentWidth, gridColumns, responsiveLayout.isLargeTablet],
    );
    const gridWidth = useMemo(
        () => (
            responsiveLayout.isTablet
                ? Math.min(contentWidth, (tabletCardWidth * gridColumns) + (cardGap * (gridColumns - 1)))
                : contentWidth
        ),
        [cardGap, contentWidth, gridColumns, responsiveLayout.isTablet, tabletCardWidth],
    );

    const KITABY_ITEMS = [
        { id: 'namaz_kitaby_40_parz', title: t('namaz_book.kyrk_parz'), icon: 'list-outline' },
        { id: 'namaz_kitaby_iman_ynanc_esaslary', title: t('namaz_book.iman'), icon: 'heart-outline' },
        { id: 'namaz_kitaby_tamizlik', title: t('namaz_book.tamizlik'), icon: 'water-outline' },
        { id: 'namaz_kitaby_taret', title: t('namaz_book.taret'), icon: 'hand-left-outline' },
        { id: 'namaz_kitaby_gusul', title: t('namaz_book.gusul'), icon: 'sparkles-outline' },
        { id: 'namaz_kitaby_teyemmum', title: t('namaz_book.teyemmum'), icon: 'sunny-outline' },
        { id: 'namaz_kitaby_ybadat', title: t('namaz_book.ybadat'), icon: 'star-outline' },
        { id: 'namaz_kitaby_namaz', title: t('namaz_book.namaz'), icon: 'book-outline' },
        { id: 'namaz_kitaby_namaz_hukumleri', title: t('namaz_book.hukumler'), icon: 'document-text-outline' },
        { id: 'namaz_kitaby_namaz_rekagatlary', title: t('namaz_book.rekagat'), icon: 'layers-outline' },
        { id: 'namaz_kitaby_namaz_okalysy_adimler', title: t('namaz_book.okalysy'), icon: 'footsteps-outline' },
        { id: 'namaz_kitaby_bes_wagt_okalysy', title: t('namaz_book.bes_wagt'), icon: 'time-outline' },
        { id: 'namaz_kitaby_namazdan_son', title: t('namaz_book.namazdan_son'), icon: 'checkmark-circle-outline' },
        { id: 'namaz_kitaby_jemagat', title: t('namaz_book.jemagat'), icon: 'people-outline' },
        { id: 'namaz_kitaby_sejde_saw', title: t('namaz_book.sejde'), icon: 'arrow-down-circle-outline' },
        { id: 'namaz_kitaby_saparda_juma', title: t('namaz_book.juma'), icon: 'calendar-outline' },
        { id: 'namaz_kitaby_bayram_tarawa', title: t('namaz_book.tarawa'), icon: 'moon-outline' },
        { id: 'namaz_kitaby_jynaza', title: t('namaz_book.jynaza'), icon: 'leaf-outline' },
        { id: 'namaz_kitaby_nepil_namazlar', title: t('namaz_book.nepil'), icon: 'add-circle-outline' },
        { id: 'namaz_kitaby_bayram_pitre', title: t('namaz_book.pitre'), icon: 'gift-outline' },
        { id: 'namaz_kitaby_nezir_ygtykaf', title: t('namaz_book.nezir'), icon: 'shield-outline' },
    ];

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
                <View style={[styles.header, { width: contentWidth, alignSelf: 'center' }]}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </Pressable>
                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>NAMAZ KITABY</Text>
                        <Text style={styles.headerSubtitle}>YSLAM ESASLARY</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingHorizontal: responsiveLayout.horizontalPadding },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.contentColumn, { width: contentWidth }]}>
                        <View
                            style={[
                                styles.itemsGrid,
                                responsiveLayout.isTablet && styles.itemsGridTablet,
                                responsiveLayout.isTablet && {
                                    width: gridWidth,
                                    alignSelf: 'center',
                                },
                            ]}
                        >
                            {KITABY_ITEMS.map((item) => (
                                <Pressable
                                    key={item.id}
                                    onPress={() => navigation.navigate('NamazKitabyReader', { contentId: item.id })}
                                    style={({ pressed }) => [
                                        styles.itemCard,
                                        responsiveLayout.isTablet && styles.itemCardTablet,
                                        responsiveLayout.isTablet && {
                                            width: tabletCardWidth,
                                            marginBottom: cardGap,
                                        },
                                        pressed && styles.pressed,
                                    ]}
                                >
                                    <View style={styles.numberBadge}>
                                        <Ionicons name={item.icon as any} size={18} color={COLORS.gold} />
                                    </View>
                                    <Text style={styles.itemTitle}>{item.title}</Text>
                                    <Ionicons name="chevron-forward" size={18} color={COLORS.gold} />
                                </Pressable>
                            ))}
                        </View>

                        <View style={{ height: 40 }} />
                    </View>
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
        paddingTop: 10,
    },
    contentColumn: {
        width: '100%',
        alignSelf: 'center',
    },
    itemsGrid: {
        width: '100%',
    },
    itemsGridTablet: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.glassCard,
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    itemCardTablet: {
        minHeight: 92,
        alignSelf: 'flex-start',
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    numberBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(196, 160, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    numberText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.gold,
    },
    itemTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
});
