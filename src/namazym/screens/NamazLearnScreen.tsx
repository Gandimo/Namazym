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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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

export default function NamazLearnScreen({ navigation }: { navigation: any }) {
    const { width } = useWindowDimensions();
    const { prayerTimes } = useCity();
    const responsiveLayout = useMemo(() => getResponsiveLayoutMetrics(width), [width]);
    const contentWidth = useMemo(
        () => getBoundedContentWidth(width, responsiveLayout.horizontalPadding, responsiveLayout.compactContentMaxWidth),
        [responsiveLayout.compactContentMaxWidth, responsiveLayout.horizontalPadding, width],
    );
    const gridColumns = responsiveLayout.isTablet ? 2 : 1;
    const cardGap = responsiveLayout.cardGap;
    const tabletCardWidth = useMemo(
        () => getAdaptiveCardWidth(
            contentWidth,
            gridColumns,
            cardGap,
            240,
            responsiveLayout.isLargeTablet ? 400 : 360,
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

    // Theme logic
    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    const options = [
        {
            id: 'male',
            title: 'Erkekler üçin',
            subtitle: 'Täret we namaz tertibini öwren',
            icon: 'man-outline',
            destination: 'NamazLearnDetail',
            params: { gender: 'male' }
        },
        {
            id: 'female',
            title: 'Aýallar üçin',
            subtitle: 'Täret we namaz tertibini öwren',
            icon: 'woman-outline',
            destination: 'NamazLearnDetail',
            params: { gender: 'female' }
        },
        {
            id: 'dogalar',
            title: 'Dogalar',
            subtitle: 'Namaz we gündelik dogalar',
            icon: 'hand-left-outline',
            destination: 'Dogalar'
        }
    ];

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
                        <Text style={styles.headerTitle}>NAMAZ ÖWREN</Text>
                        <Text style={styles.headerSubtitle}>TÄRET • NAMAZ OKALYŞY</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingHorizontal: responsiveLayout.horizontalPadding },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.contentColumn, { width: contentWidth }]}>
                        <View
                            style={[
                                styles.optionsGrid,
                                responsiveLayout.isTablet && styles.optionsGridTablet,
                                responsiveLayout.isTablet && {
                                    width: gridWidth,
                                    alignSelf: 'center',
                                },
                            ]}
                        >
                            {options.map((option, index) => {
                                const isTabletFullWidth = responsiveLayout.isTablet && (options.length % 2 === 1) && index === options.length - 1;

                                return (
                                    <Pressable
                                        key={option.id}
                                        style={({ pressed }) => [
                                            styles.optionCard,
                                            responsiveLayout.isTablet && styles.optionCardTablet,
                                            responsiveLayout.isTablet && {
                                                width: isTabletFullWidth ? gridWidth : tabletCardWidth,
                                                marginBottom: cardGap,
                                            },
                                            pressed && styles.pressed,
                                        ]}
                                        onPress={() => navigation.navigate(option.destination, option.params)}
                                    >
                                        <View style={styles.iconContainer}>
                                            <Ionicons name={option.icon as any} size={32} color={COLORS.gold} />
                                        </View>
                                        <View style={styles.optionInfo}>
                                            <Text style={styles.optionTitle}>{option.title}</Text>
                                            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={COLORS.gold} />
                                    </Pressable>
                                );
                            })}
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
    scrollContent: {
        paddingTop: 10,
    },
    contentColumn: {
        width: '100%',
        alignSelf: 'center',
    },
    optionsGrid: {
        width: '100%',
    },
    optionsGridTablet: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.glassCard,
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    optionCardTablet: {
        minHeight: 128,
        alignSelf: 'flex-start',
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: 'rgba(196, 160, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    optionInfo: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    optionSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '600',
        lineHeight: 18,
    },
});
