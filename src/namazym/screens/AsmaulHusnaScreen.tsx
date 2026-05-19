import React, { useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Internal
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import namesData from '../data/asmaul_husna_tm.json';
import { PremiumScreenHeader } from '../components/premium/PremiumScreenHeader';
import { PremiumScreenIntro } from '../components/premium/PremiumScreenIntro';
import { SacredNameCard } from '../components/premium/SacredNameCard';
import { PREMIUM_SKY_THEMES, premiumScreenTokens } from '../theme/premiumScreenTheme';

export default function AsmaulHusnaScreen() {
    const navigation = useNavigation();
    const { prayerTimes } = useCity();
    const names = namesData;

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = PREMIUM_SKY_THEMES[currentPrayer as keyof typeof PREMIUM_SKY_THEMES] || PREMIUM_SKY_THEMES.Dhuhr;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={styles.safeArea}>
                <PremiumScreenHeader
                    title="Asmaul-Husna"
                    subtitle="99 mübärek atlar"
                    onBack={() => navigation.goBack()}
                />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <PremiumScreenIntro
                        eyebrow="Mukaddes atlar"
                        title="Allahyň 99 ady"
                        body="Her at özünde rehim, hikmet we beýiklik manylaryny saklaýar."
                    />
                    {names.map((item: any) => (
                        <SacredNameCard
                            key={item.id}
                            id={item.id}
                            arabic={item.arabic}
                            latin={item.latin_tr}
                        />
                    ))}
                    <View style={styles.bottomSpace} />
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: premiumScreenTokens.spacing.screenX,
        paddingTop: premiumScreenTokens.spacing.screenTop,
        paddingBottom: 48,
    },
    bottomSpace: {
        height: 40,
    },
});
