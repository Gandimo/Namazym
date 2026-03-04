import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Animated, Dimensions, Vibration, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '../components/icons/PremiumIcon';
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

const TASBIH_STORAGE_KEY = 'namaz_tasbih_counts';

export default function TasbihScreen() {
    const navigation = useNavigation();
    const { prayerTimes } = useCity();

    const [count, setCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [limit, setLimit] = useState(33);

    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const load = async () => {
            const saved = await AsyncStorage.getItem(TASBIH_STORAGE_KEY);
            if (saved) {
                const { count: c, total: t, limit: l } = JSON.parse(saved);
                setCount(c || 0);
                setTotalCount(t || 0);
                setLimit(l || 33);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const save = async () => {
            await AsyncStorage.setItem(TASBIH_STORAGE_KEY, JSON.stringify({ count, total: totalCount, limit }));
        };
        save();
    }, [count, totalCount, limit]);

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    const increment = () => {
        Vibration.vibrate(10);
        Animated.sequence([
            Animated.timing(scale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        const nextCount = count + 1;
        if (nextCount > limit) {
            setCount(1);
            Vibration.vibrate(50);
        } else {
            setCount(nextCount);
        }
        setTotalCount(prev => prev + 1);
    };

    const resetCurrent = () => {
        setCount(0);
    };

    const toggleLimit = () => {
        setLimit(limit === 33 ? 99 : 33);
        setCount(0);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={Sheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <PremiumIcon
                            name="chevron-back"
                            size="STANDARD"
                            color="#FFFFFF"
                            interactive
                            onPress={() => navigation.goBack()}
                        />
                    </Pressable>
                    <View style={styles.titleBox}>
                        <Text style={styles.title}>TASBIH</Text>
                        <Text style={styles.subtitle}>ZIKIR HASAPLAÝYŞ</Text>
                    </View>
                    <Pressable onPress={toggleLimit} style={styles.limitBox}>
                        <Text style={styles.limitText}>{limit}</Text>
                    </Pressable>
                </View>

                <View style={styles.content}>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>UMUMY</Text>
                            <Text style={styles.statValue}>{totalCount}</Text>
                        </View>
                        <Pressable onPress={resetCurrent} style={styles.resetBtn}>
                            <PremiumIcon
                                name="refresh"
                                size="SMALL"
                                color="#FFF"
                                interactive
                                onPress={resetCurrent}
                            />
                        </Pressable>
                    </View>

                    <Pressable onPress={increment} style={styles.mainArea}>
                        <Animated.View style={[styles.counterCircle, { transform: [{ scale }] }]}>
                            <Text style={styles.countText}>{count}</Text>
                            <Text style={styles.limitSubText}>/ {limit}</Text>
                        </Animated.View>
                        <Text style={styles.tapTip}>EKRANA BASYŇ</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </View>
    );
}

const Sheet = StyleSheet;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    titleBox: { alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 4, marginTop: 2 },
    limitBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
    limitText: { color: '#FFF', fontWeight: '900', fontSize: 14 },
    content: { flex: 1, padding: 32, justifyContent: 'space-between' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statBox: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
    statLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
    statValue: { fontSize: 18, fontWeight: '800', color: '#FFF', marginTop: 2 },
    resetBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    mainArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    counterCircle: { width: SCREEN_WIDTH * 0.75, height: SCREEN_WIDTH * 0.75, borderRadius: SCREEN_WIDTH * 0.375, backgroundColor: COLORS.glassCard, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0, elevation: 0, borderWidth: 8, borderColor: 'rgba(255,255,255,0.1)' },
    countText: { fontSize: 80, fontWeight: '900', color: COLORS.textPrimary },
    limitSubText: { fontSize: 16, fontWeight: '800', color: COLORS.gold, marginTop: 8 },
    tapTip: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: 3, marginTop: 40 }
});
