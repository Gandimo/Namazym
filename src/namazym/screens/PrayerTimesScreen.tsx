import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PrayerTimesAdapter, PrayerTimeDisplay } from '../services/PrayerTimesAdapter';
import { TimeService } from '../services/TimeService';
import ramadanData from '../data/ramadan_imsakiye.json';
import { DEMO_MODE } from '../constants/demo';
import { DEMO_LAST_UPDATED } from '../constants/demoData';

const CITIES = [
    { id: 1, name: "Aşgabat" },
    { id: 2, name: "Ahal welaýaty" },
    { id: 3, name: "Lebap welaýaty" },
    { id: 4, name: "Daşoguz welaýaty" },
    { id: 5, name: "Balkan welaýaty" },
    { id: 6, name: "Mary welaýaty" }
];

export const PrayerTimesScreen = () => {
    const [selectedCityId, setSelectedCityId] = useState(1);
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimeDisplay | null>(null);
    const [ramadanDays, setRamadanDays] = useState<any[]>([]);

    useEffect(() => {
        // 1. Get Today in Turkmenistan Time
        const todayStr = TimeService.getTodayDateString();

        // 2. Use Adapter to get Data
        const data = PrayerTimesAdapter.getPrayerTimes(selectedCityId, todayStr);
        setPrayerTimes(data);

        // 3. Get Ramadan Data for City
        const cityRamadan = ramadanData.items.find(c => c.city_id === selectedCityId);
        if (cityRamadan) {
            setRamadanDays(cityRamadan.days);
        }
    }, [selectedCityId]);

    if (!prayerTimes) {
        return (
            <View style={styles.container}>
                <Text>Maglumat ýok (Offline)</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* City Selector (Simplified) */}
            <View style={styles.citySelector}>
                {CITIES.map(city => (
                    <Text
                        key={city.id}
                        onPress={() => setSelectedCityId(city.id)}
                        style={{ fontWeight: city.id === selectedCityId ? 'bold' : 'normal', padding: 5 }}
                    >
                        {city.name}
                    </Text>
                ))}
            </View>

            {/* Prayer Times Card */}
            <View style={styles.card}>
                <Text style={styles.date}>{prayerTimes.date}</Text>
                <Text style={styles.source}>Çeşme: {prayerTimes.source} ({prayerTimes.method})</Text>
                <Text style={styles.lastUpdated}>
                    Soňky täzelenme: {DEMO_MODE ? DEMO_LAST_UPDATED : TimeService.getTodayDateString()}
                </Text>

                <View style={styles.row}><Text>Fajr</Text><Text>{prayerTimes.timings.Fajr}</Text></View>
                <View style={styles.row}><Text>Sunrise</Text><Text>{prayerTimes.timings.Sunrise}</Text></View>
                <View style={styles.row}><Text>Dhuhr</Text><Text>{prayerTimes.timings.Dhuhr}</Text></View>
                <View style={styles.row}><Text>Asr</Text><Text>{prayerTimes.timings.Asr}</Text></View>
                <View style={styles.row}><Text>Maghrib</Text><Text>{prayerTimes.timings.Maghrib}</Text></View>
                <View style={styles.row}><Text>Isha</Text><Text>{prayerTimes.timings.Isha}</Text></View>
            </View>

            {/* Ramadan Table */}
            <Text style={styles.header}>Ramazan 2026</Text>
            <View style={styles.table}>
                <View style={styles.row}>
                    <Text style={styles.cell}>Gün</Text>
                    <Text style={styles.cell}>Imsak</Text>
                    <Text style={styles.cell}>Agşam</Text>
                </View>
                {ramadanDays.map(day => (
                    <View key={day.day} style={styles.row}>
                        <Text style={styles.cell}>{day.day}</Text>
                        <Text style={styles.cell}>{day.imsak}</Text>
                        <Text style={styles.cell}>{day.maghrib}</Text>
                    </View>
                ))}
            </View>

            {/* Mandatory Legal Note */}
            <Text style={styles.legal}>
                Namaz wagtlary hasaplama esasynda görkezilýär. Resmî dini neşir hökmünde kabul edilmeýär.
            </Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    citySelector: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    card: { padding: 15, backgroundColor: '#fff', borderRadius: 10, marginBottom: 20 },
    date: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
    source: { fontSize: 12, color: 'gray', textAlign: 'center', marginBottom: 5 },
    lastUpdated: { fontSize: 10, color: 'gray', textAlign: 'center', marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    table: { backgroundColor: '#fff', borderRadius: 10, padding: 10 },
    cell: { flex: 1, textAlign: 'center' },
    legal: { fontSize: 10, color: 'gray', textAlign: 'center', marginTop: 20 }
});
