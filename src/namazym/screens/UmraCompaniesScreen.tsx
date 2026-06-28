import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, StatusBar, Animated, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import { HapticService } from '../services/HapticService';
import umraData from '../data/umra_companies.json';

// Ana sayfa (HomeScreen) ile birebir aynı yumuşak palet.
const SKY_THEMES = {
    Fajr: ['#B9CAD8', '#E8EFF4'],
    Sunrise: ['#E4C8AE', '#F6E6D4'],
    Dhuhr: ['#D5E0E7', '#F3EFE8'],
    Asr: ['#E0C9B0', '#F2E1CF'],
    Maghrib: ['#9A756C', '#DEC0AE'],
    Isha: ['#222A3A', '#151B26'],
};

const DARK_PRAYERS = ['Isha', 'Maghrib'];

const COLORS = {
    glassCard: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#6B6B6B',
    gold: '#C4A050',
    green: '#1E9E5A',
    glassBorder: 'rgba(0,0,0,0.04)',
};

type Company = {
    id: string;
    name: string;
    city?: string;
    description?: string;
    phone: string;
    verified?: boolean;
    featured?: boolean;
};

function CompanyCard({ item, callLabel, verifiedLabel, featuredLabel }: {
    item: Company;
    callLabel: string;
    verifiedLabel: string;
    featuredLabel: string;
}) {
    const scale = useRef(new Animated.Value(1)).current;

    const pressIn = () => {
        HapticService.softImpact?.();
        Animated.timing(scale, { toValue: 0.96, duration: 110, useNativeDriver: true }).start();
    };
    const pressOut = () => {
        Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    };
    const call = () => {
        const tel = `tel:${(item.phone || '').replace(/\s/g, '')}`;
        Linking.openURL(tel).catch(() => { /* no dialer available */ });
    };

    return (
        <View style={styles.itemWrapper}>
            <View style={[styles.card, item.featured && styles.cardFeatured]}>
                <LinearGradient
                    colors={item.featured ? ['#C9A227', '#E7C766'] : ['#2E7D6B', '#4FB89F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.imageBox}
                >
                    <Text style={styles.emoji}>🕋</Text>
                </LinearGradient>

                <View style={styles.info}>
                    <View style={styles.badgeRow}>
                        {item.featured ? (
                            <View style={[styles.badge, { backgroundColor: 'rgba(201,162,39,0.14)' }]}>
                                <Ionicons name="star" size={9} color="#9A7B1E" />
                                <Text style={[styles.badgeText, { color: '#9A7B1E' }]}>{featuredLabel}</Text>
                            </View>
                        ) : null}
                        {item.verified ? (
                            <View style={[styles.badge, { backgroundColor: 'rgba(30,158,90,0.12)' }]}>
                                <Ionicons name="checkmark-circle" size={10} color={COLORS.green} />
                                <Text style={[styles.badgeText, { color: COLORS.green }]}>{verifiedLabel}</Text>
                            </View>
                        ) : null}
                    </View>

                    <Text style={styles.companyName} numberOfLines={1}>{item.name}</Text>

                    {item.city ? (
                        <View style={styles.locationRow}>
                            <Ionicons name="location-sharp" size={12} color={COLORS.gold} />
                            <Text style={styles.location} numberOfLines={1}>{item.city}</Text>
                        </View>
                    ) : null}

                    {item.description ? (
                        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                </View>

                <Animated.View style={{ transform: [{ scale }] }}>
                    <Pressable onPress={call} onPressIn={pressIn} onPressOut={pressOut} style={styles.callButton}>
                        <Ionicons name="call" size={18} color="#FFFFFF" />
                        <Text style={styles.callText}>{callLabel}</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
}

export default function UmraCompaniesScreen() {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { prayerTimes } = useCity();

    const companies = useMemo(
        () => [...(umraData.companies as Company[])].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)),
        []
    );

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;
    const isDark = DARK_PRAYERS.includes(currentPrayer);

    const headerColor = isDark ? '#FFFFFF' : '#2D2D35';
    const subColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(45,45,53,0.55)';
    const backBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)';

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <LinearGradient colors={theme as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: backBg }]}>
                        <Ionicons name="chevron-back" size={24} color={headerColor} />
                    </Pressable>
                    <View style={styles.titleBox}>
                        <Text style={[styles.title, { color: headerColor }]}>{t('umra.title')}</Text>
                        <Text style={[styles.subtitle, { color: subColor }]}>{t('umra.subtitle')}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <FlatList
                    data={companies}
                    keyExtractor={(item, index) => (item?.id || index).toString()}
                    renderItem={({ item }) => (
                        <CompanyCard
                            item={item}
                            callLabel={t('umra.call')}
                            verifiedLabel={t('umra.verified')}
                            featuredLabel={t('umra.featured')}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Text style={styles.emptyEmoji}>🕋</Text>
                            <Text style={[styles.emptyText, { color: headerColor }]}>{t('umra.empty')}</Text>
                        </View>
                    }
                    ListFooterComponent={
                        <Text style={[styles.disclaimer, { color: subColor }]}>{t('umra.disclaimer')}</Text>
                    }
                />
            </SafeAreaView>
        </View>
    );
}

const TABLET_MAX_WIDTH = 680;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    titleBox: { alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '900', letterSpacing: 2 },
    subtitle: { fontSize: 10.5, fontWeight: '800', letterSpacing: 3, marginTop: 2 },
    list: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },
    itemWrapper: { width: '100%', maxWidth: TABLET_MAX_WIDTH, alignSelf: 'center' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.glassCard,
        borderRadius: 22,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        shadowColor: '#1A1036',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
        elevation: 6,
    },
    cardFeatured: { borderColor: 'rgba(201,162,39,0.55)', borderWidth: 1.5 },
    imageBox: {
        width: 62,
        height: 62,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 3,
    },
    emoji: { fontSize: 28, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
    info: { flex: 1, justifyContent: 'center' },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 5 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    companyName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.2, lineHeight: 20 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
    location: { flex: 1, fontSize: 12.5, color: COLORS.textSecondary, fontWeight: '600' },
    description: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500', lineHeight: 16, marginTop: 4 },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: COLORS.green,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        marginLeft: 10,
        shadowColor: COLORS.green,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    callText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
    emptyBox: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
    emptyEmoji: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 15, fontWeight: '700', textAlign: 'center', lineHeight: 22 },
    disclaimer: { fontSize: 11, fontWeight: '500', textAlign: 'center', lineHeight: 16, paddingHorizontal: 12, marginTop: 8 },
});
