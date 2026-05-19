import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import holidaysData from '../../data/islamic_holidays/tm_islamic_holidays.json';
import { PremiumScreenHeader } from '../components/premium/PremiumScreenHeader';
import { PremiumSectionTitle } from '../components/premium/PremiumSectionTitle';
import { PremiumEmptyState } from '../components/premium/PremiumEmptyState';
import { PremiumYearSwitcher } from '../components/premium/PremiumYearSwitcher';
import { PremiumScreenIntro } from '../components/premium/PremiumScreenIntro';
import { CalendarEventCard } from '../components/premium/CalendarEventCard';
import { PREMIUM_SKY_THEMES, premiumScreenTokens } from '../theme/premiumScreenTheme';

type HolidayItem = {
    day: number;
    month_short: string;
    title: string;
    hijri: string;
    relative: string;
};

type HolidayMonth = {
    month: string;
    items: HolidayItem[];
};

type HolidayYear = {
    year: number;
    months: HolidayMonth[];
};

type HolidaysDataset = {
    title: string;
    subtitle: string;
    years: HolidayYear[];
};

const HOLIDAYS = holidaysData as HolidaysDataset;
const FEATURED_EVENTS = [
    'Oraza baýramy',
    'Gurban baýramy',
    'Gadyr gijesi',
    'Möwlit gijesi'
];

function isFeaturedEvent(title: string) {
    const normalizedTitle = title.trim();

    return FEATURED_EVENTS.some((featuredTitle) =>
        normalizedTitle === featuredTitle || normalizedTitle.startsWith(`${featuredTitle} `)
    );
}

export default function IslamBayramlaryScreen() {
    const navigation = useNavigation();
    const { prayerTimes } = useCity();

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = PREMIUM_SKY_THEMES[currentPrayer as keyof typeof PREMIUM_SKY_THEMES] || PREMIUM_SKY_THEMES.Dhuhr;
    const years = Array.isArray(HOLIDAYS.years) ? HOLIDAYS.years : [];
    const yearValues = years.map((entry) => entry.year);
    const initialYear = yearValues.includes(TimeService.now().getFullYear())
        ? TimeService.now().getFullYear()
        : yearValues[0];
    const [selectedYear, setSelectedYear] = useState<number | undefined>(initialYear);

    const selectedYearIndex = Math.max(0, years.findIndex((entry) => entry.year === selectedYear));
    const selectedYearBlock = years[selectedYearIndex] || years[0];
    const months = Array.isArray(selectedYearBlock?.months) ? selectedYearBlock.months : [];

    const canGoPrev = selectedYearIndex > 0;
    const canGoNext = selectedYearIndex >= 0 && selectedYearIndex < years.length - 1;

    const handlePrevYear = () => {
        if (!canGoPrev) return;
        setSelectedYear(years[selectedYearIndex - 1]?.year);
    };

    const handleNextYear = () => {
        if (!canGoNext) return;
        setSelectedYear(years[selectedYearIndex + 1]?.year);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <PremiumScreenHeader
                    title={HOLIDAYS.title}
                    subtitle={HOLIDAYS.subtitle}
                    onBack={() => navigation.goBack()}
                />

                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    <PremiumScreenIntro
                        eyebrow="Mukaddes senenama"
                        title="Baýramlar we möhüm gijeler"
                        body="Türkmenistan üçin taýýarlanan yslam baýramlarynyň tertibi ýyl we aý boýunça görkezilýär."
                    />
                    {selectedYearBlock ? (
                        <View key={selectedYearBlock.year} style={styles.yearSection}>
                            <PremiumYearSwitcher
                                year={selectedYearBlock.year}
                                canGoPrev={canGoPrev}
                                canGoNext={canGoNext}
                                onPrev={handlePrevYear}
                                onNext={handleNextYear}
                            />

                            {months.length > 0 ? (
                                months.map((monthBlock, monthIndex) => {
                                    const items = Array.isArray(monthBlock?.items) ? monthBlock.items : [];

                                    return (
                                        <View key={`${selectedYearBlock.year}-${monthBlock?.month || monthIndex}`} style={styles.monthSection}>
                                            <PremiumSectionTitle title={monthBlock?.month || ''} />

                                            {items.map((item, i) => (
                                                <CalendarEventCard
                                                    key={`${selectedYearBlock.year}-${monthBlock?.month || monthIndex}-${item?.day || i}-${i}`}
                                                    day={item?.day}
                                                    monthShort={item?.month_short}
                                                    title={item?.title || ''}
                                                    hijri={item?.hijri || ''}
                                                    relative={item?.relative || ''}
                                                    featured={
                                                        typeof item?.title === 'string' &&
                                                        isFeaturedEvent(item.title)
                                                    }
                                                />
                                            ))}
                                        </View>
                                    );
                                })
                            ) : (
                                <PremiumEmptyState text="Bu ýyl üçin maglumat ýok" />
                            )}
                        </View>
                    ) : (
                        <PremiumEmptyState text="Maglumat tapylmady" />
                    )}
                    <View style={styles.bottomSpace} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    list: { padding: premiumScreenTokens.spacing.screenX, paddingTop: premiumScreenTokens.spacing.screenTop, paddingBottom: 48 },
    yearSection: { marginBottom: 18 },
    monthSection: { marginBottom: 22 },
    bottomSpace: { height: 40 },
});
