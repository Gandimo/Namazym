import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { PremiumIcon } from '../components/icons/PremiumIcon';

// Internal
import { useCity } from '../context/CityContext';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';
import { calculateSahetliGun, getHijriDay } from '../utils/sahetli';

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
    red: '#D32F2F',
    blue: '#1976D2',
    glassBorder: 'rgba(0,0,0,0.02)',
};

export const GREG_MONTHS_TKM = [
    'Ýanwar', 'Fewral', 'Mart', 'Aprel', 'Maý', 'Iýun',
    'Iýul', 'Awgust', 'Sentýabr', 'Oktýabr', 'Noýabr', 'Dekabr'
];

export const WEEKDAYS_TKM = ['Duş', 'Siş', 'Çar', 'Pen', 'Ann', 'Şen', 'Ýek'];

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    titleBox: { alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 2, marginTop: 2 },
    scrollContent: { padding: 20 },
    monthCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)'
    },
    monthTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: 1
    },
    weekHeader: {
        flexDirection: 'row',
        marginBottom: 8
    },
    weekdayBox: {
        flex: 1,
        alignItems: 'center'
    },
    weekdayText: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.5)'
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    dayBox: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4
    },
    dayCircle: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    auspiciousCircle: {
        backgroundColor: COLORS.gold,
    },
    auspiciousGlow: {
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)'
    },
    todayCircle: {
        borderWidth: 1.5,
        borderColor: COLORS.gold,
    },
    dayNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF'
    },
    auspiciousText: {
        color: '#FFF',
        fontWeight: '900'
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        backgroundColor: 'rgba(0,0,0,0.2)',
        padding: 12,
        borderRadius: 20
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10
    },
    miniCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6
    },
    legendText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
    },
    modalCard: {
        backgroundColor: COLORS.glassCard,
        borderRadius: 32,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: COLORS.gold,
        letterSpacing: 1
    },
    closeIcon: {
        padding: 4
    },
    modalBody: {
        marginBottom: 24
    },
    modalDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    modalDateText: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginLeft: 10
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 16
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: COLORS.textSecondary,
        letterSpacing: 1,
        marginBottom: 8
    },
    modalDesc: {
        fontSize: 14,
        color: COLORS.textPrimary,
        lineHeight: 22,
        fontWeight: '600'
    },
    recommendationBox: {
        marginTop: 8
    },
    recItem: {
        flexDirection: 'row',
        marginBottom: 12
    },
    recText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textPrimary,
        fontWeight: '600',
        lineHeight: 18
    },
    modalButton: {
        backgroundColor: COLORS.gold,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    modalButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1
    }
});

const RecommendationItem = ({ icon, text }: any) => (
    <View style={styles.recItem}>
        <PremiumIcon
            name={icon}
            size="SMALL"
            gradient="PRAYER_GOLD"
            style={{ marginRight: 12, marginTop: 2 }}
        />
        <Text style={styles.recText}>{text}</Text>
    </View>
);

export default function SahetliGunScreen() {
    const navigation = useNavigation();
    const { prayerTimes } = useCity();

    const [selectedDay, setSelectedDay] = useState<any>(null);
    const [isModalVisible, setModalVisible] = useState(false);

    const today = useMemo(() => TimeService.now(), []);

    const months = useMemo(() => {
        try {
            const results = [];
            let currentYear = today.getFullYear();
            let currentMonth = today.getMonth();

            for (let m = 0; m < 12; m++) {
                const monthDate = new Date(currentYear, currentMonth + m, 1);
                const year = monthDate.getFullYear();
                const month = monthDate.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                let startDay = new Date(year, month, 1).getDay();
                let adjustedStartDay = startDay === 0 ? 6 : startDay - 1;

                const days = [];
                for (let i = 0; i < adjustedStartDay; i++) {
                    days.push(null);
                }

                for (let d = 1; d <= daysInMonth; d++) {
                    const date = new Date(year, month, d);
                    const hjDay = getHijriDay(date);
                    const info = calculateSahetliGun(hjDay);
                    const isPast = date.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

                    const { day: _hjDay, ...rest } = info;
                    days.push({
                        day: d,
                        hjDay: _hjDay,
                        ...rest,
                        date,
                        isToday: date.toDateString() === today.toDateString(),
                        isPast,
                    });
                }

                results.push({
                    id: `${year}-${month}`,
                    title: `${GREG_MONTHS_TKM[month]} ${year}`,
                    days
                });
            }
            return results;
        } catch (error) {
            console.error('[SahetliGunScreen] Error pre-generating months:', error);
            return [];
        }
    }, [today]);

    const currentPrayer = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(today, prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes, today]);

    const theme = SKY_THEMES[currentPrayer as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                        accessibilityLabel="Go back"
                        accessibilityRole="button"
                    >
                        <PremiumIcon
                            name="chevron-back"
                            size="STANDARD"
                            color="#FFFFFF"
                            interactive
                            onPress={() => navigation.goBack()}
                        />
                    </Pressable>
                    <View style={styles.titleBox}>
                        <Text style={styles.title}>SÄHETLI GÜNLER</Text>
                        <Text style={styles.subtitle}>12 AÝLYK SENENAMA</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {months.map((month) => (
                        <View key={month.id} style={styles.monthCard}>
                            <Text style={styles.monthTitle}>{month.title.toUpperCase()}</Text>

                            <View style={styles.weekHeader}>
                                {WEEKDAYS_TKM.map(day => (
                                    <View key={day} style={styles.weekdayBox}>
                                        <Text style={styles.weekdayText}>{day}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.grid}>
                                {month.days.map((item, dIndex) => {
                                    if (!item) return <View key={`empty-${month.id}-${dIndex}`} style={styles.dayBox} />;

                                    const isAuspicious = item.status === 'adaty';

                                    return (
                                        <Pressable
                                            key={`${month.id}-${item.day}`}
                                            style={styles.dayBox}
                                            onPress={() => {
                                                if (isAuspicious) {
                                                    setSelectedDay({ ...item, monthTitle: month.title });
                                                    setModalVisible(true);
                                                }
                                            }}
                                            accessibilityLabel={`${item.day} ${month.title}, status: ${item.statusLabel}`}
                                            accessibilityRole={isAuspicious ? "button" : "text"}
                                        >
                                            <View style={[
                                                styles.dayCircle,
                                                isAuspicious && styles.auspiciousCircle,
                                                isAuspicious && styles.auspiciousGlow,
                                                item.isToday && styles.todayCircle,
                                                item.isPast && { opacity: 0.3 }
                                            ]}>
                                                <Text style={[
                                                    styles.dayNumber,
                                                    isAuspicious && styles.auspiciousText,
                                                    item.isToday && !isAuspicious && { color: COLORS.gold }
                                                ]}>
                                                    {item.day}
                                                </Text>
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    ))}
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.miniCircle, { backgroundColor: COLORS.gold }]} />
                            <Text style={styles.legendText}>Sähetli gün</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.miniCircle, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.gold }]} />
                            <Text style={styles.legendText}>Şu gün</Text>
                        </View>
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>SÄHETLI GÜN MAGLUMATY</Text>
                                <Pressable onPress={() => setModalVisible(false)} style={styles.closeIcon}>
                                    <PremiumIcon
                                        name="close"
                                        size="STANDARD"
                                        color={COLORS.textSecondary}
                                        interactive
                                        onPress={() => setModalVisible(false)}
                                    />
                                </Pressable>
                            </View>

                            <View style={styles.modalBody}>
                                <View style={styles.modalDateRow}>
                                    <PremiumIcon
                                        name="calendar-clear-outline"
                                        size="SMALL"
                                        color={COLORS.gold}
                                    />
                                    <Text style={styles.modalDateText}>
                                        {selectedDay?.day} {selectedDay?.monthTitle} ({selectedDay?.hjDay} Remezan)
                                    </Text>
                                </View>

                                <View style={styles.divider} />

                                <Text style={styles.sectionTitle}>DÜŞÜNDIRIŞ</Text>
                                <Text style={styles.modalDesc}>{selectedDay?.description}</Text>

                                <View style={styles.divider} />

                                <Text style={styles.sectionTitle}>MASLAHATLAR</Text>
                                <View style={styles.recommendationBox}>
                                    <RecommendationItem icon="heart-outline" text="Toý we şatlykly dabaralar üçin örän gowy gün." />
                                    <RecommendationItem icon="briefcase-outline" text="Täze işe başlamak we söwda şertnamalaryny baglaşmak maslahat berilýär." />
                                    <RecommendationItem icon="airplane-outline" text="Uzak ýola syýahata çykmak we täze öýe göçmek üçin sähetli." />
                                </View>
                            </View>

                            <Pressable
                                style={styles.modalButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalButtonText}>BOLÝAR</Text>
                            </Pressable>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}
