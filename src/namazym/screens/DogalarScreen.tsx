import React, { useMemo } from 'react';
import { View, StyleSheet, FlatList, StatusBar, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import { DOGALAR_LIST } from '../data/dogalar_tm';
import { PremiumScreenHeader } from '../components/premium/PremiumScreenHeader';
import { PremiumScreenIntro } from '../components/premium/PremiumScreenIntro';
import { DuaEntryCard } from '../components/premium/DuaEntryCard';
import { PREMIUM_SKY_THEMES, premiumScreenTokens } from '../theme/premiumScreenTheme';
import { getBoundedContentWidth, getResponsiveLayoutMetrics } from '../utils/responsiveLayout';

const TABLET_MAX_WIDTH = 680;

export default function DogalarScreen() {
    const navigation = useNavigation<any>();
    const { prayerTimes } = useCity();
    const { width } = useWindowDimensions();
    const responsiveLayout = useMemo(() => getResponsiveLayoutMetrics(width), [width]);
    const contentWidth = useMemo(
        () => getBoundedContentWidth(width, responsiveLayout.horizontalPadding, TABLET_MAX_WIDTH),
        [width, responsiveLayout.horizontalPadding],
    );

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = PREMIUM_SKY_THEMES[currentPrayer as keyof typeof PREMIUM_SKY_THEMES] || PREMIUM_SKY_THEMES.Dhuhr;

    const renderItem = ({ item }: any) => (
        <View style={[styles.itemWrapper, { maxWidth: contentWidth }]}>
            <DuaEntryCard
                onPress={() => navigation.navigate('DogaDetail', { dogaId: item.id })}
                title={item.title}
                meta={'blocks' in item ? 'Süreler we okalyşlar' : 'Doga'}
                grouped={'blocks' in item}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={Sheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <PremiumScreenHeader
                    title="Dogalar"
                    subtitle="Gündelik okalýan"
                    onBack={() => navigation.goBack()}
                />
                <FlatList
                    data={DOGALAR_LIST}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <PremiumScreenIntro
                            eyebrow="Okalyşlar"
                            title="Gündelik doga we süreler"
                            body="Gysga dogalardan başlap, has giň okalyş toplumlaryna çenli gündelik ruhy okalyşlar."
                        />
                    }
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            </SafeAreaView>
        </View>
    );
}

const Sheet = StyleSheet;

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { paddingHorizontal: premiumScreenTokens.spacing.screenX, paddingTop: 14, paddingBottom: 40 },
    itemWrapper: { width: '100%', maxWidth: 680, alignSelf: 'center' },
    separator: { height: 10 }
});
