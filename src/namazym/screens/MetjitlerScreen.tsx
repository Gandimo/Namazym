import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import { hasMeaningfulMosqueName, sanitizeMosques } from '../utils/sanitizeMosques';
import mosquesData from '../data/metjitler_tm.json';
import { PremiumScreenHeader } from '../components/premium/PremiumScreenHeader';
import { PremiumEmptyState } from '../components/premium/PremiumEmptyState';
import { PremiumScreenIntro } from '../components/premium/PremiumScreenIntro';
import { MosquePlaceCard } from '../components/premium/MosquePlaceCard';
import { PREMIUM_SKY_THEMES, premiumScreenTokens } from '../theme/premiumScreenTheme';

export default function MetjitlerScreen() {
    const navigation = useNavigation();
    const { prayerTimes, placeLabel } = useCity();

    useEffect(() => {
        console.log('METJITLER SCREEN ACTIVE');
    }, []);

    const mosques = useMemo(() => {
        const cleanedMosques = sanitizeMosques(mosquesData as any[]);
        return cleanedMosques.filter((m: any) => {
            const matchesLocation = m.city === placeLabel || m.region === placeLabel;
            return matchesLocation;
        });
    }, [placeLabel]);

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = PREMIUM_SKY_THEMES[currentPrayer as keyof typeof PREMIUM_SKY_THEMES] || PREMIUM_SKY_THEMES.Dhuhr;

    const hasCoordinates = (lat?: number | null, lon?: number | null) =>
        Number.isFinite(lat) && Number.isFinite(lon);

    const openMap = (lat: number, lon: number, mapQuery?: string) => {
        const query = mapQuery ? encodeURIComponent(mapQuery) : `${lat},${lon}`;
        const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
        Linking.openURL(url);
    };

    const renderItem = ({ item }: any) => {
        console.log('[Metjitler renderItem:name]', JSON.stringify(String(item?.name ?? '').trim()));
        console.log('[Metjitler renderItem:item]', JSON.stringify(item));

        const name = String(item?.name ?? '').trim();
        if (!hasMeaningfulMosqueName(name)) return null;

        const mapQuery = typeof item.mapQuery === 'string' && item.mapQuery.trim().length > 0 ? item.mapQuery : undefined;
        const canOpenMap = Boolean(mapQuery) || hasCoordinates(item.lat, item.lng);

        return (
            <MosquePlaceCard
                name={name}
                cityOrRegion={item.city || item.region}
                address={item.address}
                onPress={canOpenMap ? () => openMap(item.lat, item.lng, mapQuery) : undefined}
            />
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <PremiumScreenHeader
                    title="Metjitler"
                    subtitle={`${mosques.length} sany tapyldy`}
                    onBack={() => navigation.goBack()}
                />
                <FlatList
                    data={mosques}
                    keyExtractor={(item, i) => String(item?.id ?? `${item?.name ?? 'mosque'}-${i}`)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <PremiumScreenIntro
                            eyebrow="Ýerler"
                            title="Ýakyndaky mukaddes ýerler"
                            body={`Saýlanan şäher üçin metjitleriň sanawy görkezilýär${placeLabel ? `: ${placeLabel}` : ''}.`}
                        />
                    }
                    ListEmptyComponent={
                        <PremiumEmptyState text="Bu şäher üçin maglumat tapylmady" />
                    }
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: premiumScreenTokens.spacing.screenX, paddingTop: 10, paddingBottom: 40 },
});
