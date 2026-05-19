import React, { useState, useMemo } from 'react';
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
import namazLearnData from '../data/learn/namaz_learn_tm.json';
import { getBoundedContentWidth, getResponsiveLayoutMetrics } from '../utils/responsiveLayout';

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

export default function NamazLearnDetailScreen({ route, navigation }: { route: any; navigation: any }) {
    const { width } = useWindowDimensions();
    const { gender } = route.params as { gender: 'male' | 'female' };
    const { prayerTimes } = useCity();
    const [activeTab, setActiveTab] = useState<'taret' | 'namazOkalysy'>('taret');
    const responsiveLayout = useMemo(() => getResponsiveLayoutMetrics(width), [width]);
    const contentWidth = useMemo(
        () => getBoundedContentWidth(width, responsiveLayout.horizontalPadding, responsiveLayout.contentMaxWidth),
        [responsiveLayout.contentMaxWidth, responsiveLayout.horizontalPadding, width],
    );
    const readableWidth = useMemo(
        () => Math.min(contentWidth, responsiveLayout.isTablet ? 760 : contentWidth),
        [contentWidth, responsiveLayout.isTablet],
    );

    const data = (namazLearnData as any)[gender];
    const taretData = data.tabs.taret;
    const namazData = data.tabs.namazOkalysy;
    const currentData = activeTab === 'taret' ? taretData : namazData;

    // Theme logic
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
                        <Text style={styles.headerTitle}>{data.title.toUpperCase()}</Text>
                        <Text style={styles.headerSubtitle}>ÖWRENMEK</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <View
                    style={[
                        styles.tabContainer,
                        {
                            paddingHorizontal: responsiveLayout.horizontalPadding,
                        },
                    ]}
                >
                    <View style={[styles.tabGlass, { width: readableWidth, alignSelf: 'center' }]}>
                        <Pressable
                            style={[styles.tab, activeTab === 'taret' && styles.tabActive]}
                            onPress={() => setActiveTab('taret')}
                        >
                            <Text style={[styles.tabText, activeTab === 'taret' && styles.tabTextActive]}>TÄRET</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.tab, activeTab === 'namazOkalysy' && styles.tabActive]}
                            onPress={() => setActiveTab('namazOkalysy')}
                        >
                            <Text style={[styles.tabText, activeTab === 'namazOkalysy' && styles.tabTextActive]}>NAMAZ</Text>
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingHorizontal: responsiveLayout.horizontalPadding,
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.contentColumn, { width: readableWidth }]}>
                        <Text style={styles.sectionTitle}>{currentData.stepsTitle.toUpperCase()}</Text>

                        {currentData.steps.map((step: any) => (
                            <View
                                key={step.no}
                                style={[
                                    styles.stepCard,
                                    responsiveLayout.isTablet && styles.stepCardTablet,
                                ]}
                            >
                                <View style={styles.stepHeader}>
                                    <View style={styles.stepBadge}>
                                        <Text style={styles.stepBadgeText}>{step.no}</Text>
                                    </View>
                                    <Text style={styles.stepTitle}>{step.title}</Text>
                                </View>
                                <Text style={styles.stepText}>{step.text}</Text>
                            </View>
                        ))}

                        {activeTab === 'namazOkalysy' && namazData.rakats && (
                            <View style={styles.rakatsSection}>
                                <Text style={styles.sectionTitle}>{namazData.rakatsTitle.toUpperCase()}</Text>
                                <Text style={styles.sectionSubtitle}>{namazData.rakatsIntro}</Text>

                                {namazData.rakats.map((rakat: any) => (
                                    <View
                                        key={rakat.key}
                                        style={[
                                            styles.rakatCard,
                                            responsiveLayout.isTablet && styles.rakatCardTablet,
                                        ]}
                                    >
                                        <View style={styles.rakatHeader}>
                                            <Text style={styles.rakatTitle}>{rakat.title}</Text>
                                            <View style={styles.totalBadge}>
                                                <Text style={styles.totalBadgeText}>{rakat.total}</Text>
                                            </View>
                                        </View>

                                        {rakat.parts.map((part: any, idx: number) => (
                                            <View key={idx} style={styles.rakatPart}>
                                                <View style={styles.rakatPartHeader}>
                                                    <Ionicons name="checkmark-circle" size={16} color={COLORS.gold} />
                                                    <Text style={styles.rakatPartTitle}>{part.title}</Text>
                                                </View>
                                                <Text style={styles.rakatPartText}>{part.text}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        )}

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
    tabContainer: {
        marginTop: 10,
    },
    tabGlass: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 16,
    },
    tabActive: {
        backgroundColor: COLORS.glassCard,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    tabTextActive: {
        color: COLORS.textPrimary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 24,
    },
    contentColumn: {
        width: '100%',
        alignSelf: 'center',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: 'rgba(255, 255, 255, 0.8)',
        letterSpacing: 2.5,
        marginBottom: 20,
        marginLeft: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontStyle: 'italic',
        lineHeight: 22,
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    stepCard: {
        backgroundColor: COLORS.glassCard,
        borderRadius: 24,
        padding: 30,
        marginBottom: 16,
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    stepCardTablet: {
        paddingHorizontal: 34,
        paddingVertical: 32,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    stepBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(196, 160, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stepBadgeText: {
        fontSize: 14,
        fontWeight: '900',
        color: COLORS.gold,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textPrimary,
        flex: 1,
    },
    stepText: {
        fontSize: 15,
        color: '#444',
        lineHeight: 24,
        fontWeight: '600',
    },
    rakatsSection: {
        marginTop: 16,
    },
    rakatCard: {
        backgroundColor: COLORS.glassCard,
        borderRadius: 24,
        padding: 30,
        marginBottom: 16,
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    rakatCardTablet: {
        paddingHorizontal: 34,
        paddingVertical: 32,
    },
    rakatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    rakatTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: COLORS.gold,
        flex: 1,
    },
    totalBadge: {
        backgroundColor: 'rgba(196, 160, 80, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    totalBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.gold,
    },
    rakatPart: {
        marginBottom: 20,
    },
    rakatPartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    rakatPartTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginLeft: 10,
    },
    rakatPartText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 22,
        marginLeft: 26,
        fontWeight: '600',
    },
});
