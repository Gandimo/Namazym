import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { PrayerTimesAdapter, PrayerTimeDisplay } from "../services/PrayerTimesAdapter";
import { DEMO_MODE } from "../constants/demo";
import { colors, paper } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { Card } from "../components/Card";
import { DemoBanner } from "../components/DemoBanner";
import { VerseService, DailyContent } from "../services/VerseService";
import { NotificationService } from "../services/NotificationService";

type Key = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

const ORDER: { key: Key; label: string }[] = [
    { key: "Fajr", label: "Ertir" },
    { key: "Sunrise", label: "Günüň dogşy" },
    { key: "Dhuhr", label: "Öýle" },
    { key: "Asr", label: "Ikindi" },
    { key: "Maghrib", label: "Agşam" },
    { key: "Isha", label: "Ýassy" },
];

function pad(n: number) {
    return String(n).padStart(2, "0");
}

function parseHHMM(hhmm: string) {
    const [h, m] = hhmm.split(":").map(Number);
    return { h: Number.isFinite(h) ? h : 0, m: Number.isFinite(m) ? m : 0 };
}

function toDateToday(hhmm: string) {
    const { h, m } = parseHHMM(hhmm);
    const d = new Date();
    d.setSeconds(0, 0);
    d.setHours(h, m, 0, 0);
    return d;
}

function formatCountdown(ms: number) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
}

function getNextPrayer(now: Date, timings: Record<string, string>) {
    for (const item of ORDER) {
        const t = timings[item.key];
        if (!t) continue;
        const dt = toDateToday(t);
        if (dt.getTime() > now.getTime()) {
            return { ...item, time: t, dateObj: dt };
        }
    }
    const fajr = timings.Fajr;
    const dt = fajr ? toDateToday(fajr) : new Date(now.getTime() + 3600_000);
    dt.setDate(dt.getDate() + 1);
    return { key: "Fajr" as Key, label: "Ertir", time: fajr || "--:--", dateObj: dt };
}

export default function HomeScreen() {
    const [todayTimes, setTodayTimes] = useState<PrayerTimeDisplay | null>(null);
    const [now, setNow] = useState<Date>(new Date());
    const [cityId] = useState<number>(1); // 1 = Ashgabat
    const [dailyContent, setDailyContent] = useState<DailyContent | null>(null);

    useEffect(() => {
        const data = PrayerTimesAdapter.getToday(cityId);
        setTodayTimes(data);

        const content = VerseService.getTodayContent();
        setDailyContent(content);

        // Schedule real notifications
        if (data) {
            NotificationService.requestPermissions().then(granted => {
                if (granted) {
                    NotificationService.scheduleDailyNotifications(data);
                }
            });
        }

        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, [cityId]);

    const next = useMemo(() => {
        if (!todayTimes) return null;
        return getNextPrayer(now, todayTimes.timings as any);
    }, [todayTimes, now]);

    const remainingMs = useMemo(() => {
        if (!next) return 0;
        return next.dateObj.getTime() - now.getTime();
    }, [next, now]);

    if (!todayTimes) {
        return (
            <View style={[styles.container, styles.center]}>
                <StatusBar barStyle="dark-content" />
                <Text style={styles.brand}>NAMAZYM</Text>
                <Text style={styles.muted}>Maglumat ýüklenýär…</Text>
            </View>
        );
    }

    const timings = todayTimes.timings as Record<string, string>;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brandSmall}>NAMAZYM • Ashgabat</Text>
                        <Text style={styles.headerTitle}>Namaz Wagtlary</Text>
                    </View>
                    <View style={styles.dateCircle}>
                        <Text style={styles.dateText}>{todayTimes.date.split("-")[0]}</Text>
                    </View>
                </View>

                {/* Demo Banner */}
                {DEMO_MODE && <DemoBanner />}

                {/* Next Prayer Card */}
                {next && (
                    <Card variant="paper" style={styles.heroCard}>
                        <LinearGradient
                            colors={["rgba(196,160,80,0.18)", "rgba(255,255,255,0.45)", "rgba(246,240,227,0.0)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <Text style={styles.heroLabel}>Indiki namaz: {next.label}</Text>
                        <View style={styles.heroTimeContainer}>
                            <Text style={styles.heroTime}>{next.time}</Text>
                        </View>

                        <View style={styles.countdownContainer}>
                            <Text style={styles.countdownValue}>{formatCountdown(remainingMs)}</Text>
                            <Text style={styles.countdownLabel}>galýar</Text>
                        </View>

                        <View style={styles.progressContainer}>
                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: "35%" }]} />
                            </View>
                        </View>
                    </Card>
                )}

                {/* Daily Schedule */}
                <Text style={styles.sectionTitle}>Gündelik meýilnama</Text>
                <Card style={styles.listCard}>
                    {ORDER.map((item, index) => {
                        const isLast = index === ORDER.length - 1;
                        const isNext = next?.key === item.key;
                        return (
                            <View key={item.key}>
                                <View style={styles.row}>
                                    <View style={styles.rowInfo}>
                                        {isNext && <View style={styles.dot} />}
                                        <Text style={[styles.rowLabel, isNext && styles.rowLabelActive]}>{item.label}</Text>
                                    </View>
                                    <Text style={[styles.rowValue, isNext && styles.rowValueActive]}>{timings[item.key] || "--:--"}</Text>
                                </View>
                                {!isLast && <View style={styles.divider} />}
                            </View>
                        );
                    })}
                </Card>

                {/* New Modules (Daily Verse & Ramadan) */}
                <View style={styles.moduleSection}>
                    {dailyContent && (
                        <Card style={styles.moduleCard}>
                            <Text style={styles.moduleLabel}>Günüň aýady</Text>
                            {dailyContent.ayat.text_ar && (
                                <Text style={styles.arabicText}>
                                    {dailyContent.ayat.text_ar}
                                </Text>
                            )}
                            <Text style={styles.moduleBody}>"{dailyContent.ayat.text_tm}" ({dailyContent.ayat.reference})</Text>
                            <Pressable style={styles.moduleAction}>
                                <Text style={styles.moduleActionText}>Oka →</Text>
                            </Pressable>
                        </Card>
                    )}

                    <Card style={styles.moduleCard}>
                        <Text style={styles.moduleLabel}>Ramazan takwimi</Text>
                        <View style={styles.ramadanRow}>
                            <Text style={styles.ramadanValue}>Säher: {timings.Fajr || "--:--"}</Text>
                            <Text style={styles.ramadanValue}>Iftar: {timings.Maghrib || "--:--"}</Text>
                        </View>
                        <Pressable style={styles.moduleAction}>
                            <Text style={styles.moduleActionText}>Takwimi aç →</Text>
                        </Pressable>
                    </Card>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionGrid}>
                    <Pressable style={styles.actionCard}>
                        <Card style={styles.actionInner}>
                            <Text style={styles.actionIcon}>🧭</Text>
                            <Text style={styles.actionText}>Kybla</Text>
                        </Card>
                    </Pressable>
                    <Pressable style={styles.actionCard}>
                        <Card style={styles.actionInner}>
                            <Text style={styles.actionIcon}>📖</Text>
                            <Text style={styles.actionText}>Günlük</Text>
                        </Card>
                    </Pressable>
                </View>

                {/* Notification Test Button */}
                <Pressable
                    onPress={async () => {
                        await Notifications.scheduleNotificationAsync({
                            content: { title: "Namazym", body: "Test bildirimi ✅" },
                            trigger: null, // immediate
                        });
                    }}
                    style={styles.notifBtn}
                >
                    <Text style={styles.notifBtnText}>Test Bildirim Gönder</Text>
                </Pressable>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: paper.bg,
    },
    content: {
        padding: spacing.lg,
    },
    center: {
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.xl,
        marginTop: spacing.sm,
    },
    brandSmall: {
        color: paper.muted,
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    headerTitle: {
        color: paper.text,
        fontSize: 24,
        fontWeight: "800",
        marginTop: 2,
    },
    dateCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: paper.card,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: paper.border,
    },
    dateText: {
        color: paper.text,
        fontWeight: "700",
        fontSize: 14,
    },
    heroCard: {
        height: 180,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: spacing.xl,
        padding: spacing.xl,
    },
    heroLabel: {
        color: paper.muted,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: spacing.xs,
    },
    heroTimeContainer: {
        flexDirection: "row",
        alignItems: "baseline",
    },
    heroTime: {
        color: paper.text,
        fontSize: 64, // Increased from 48
        fontWeight: "900",
        letterSpacing: -2,
    },
    countdownContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        marginTop: 0,
    },
    countdownValue: {
        color: colors.green,
        fontSize: 18,
        fontWeight: "800",
        fontVariant: ["tabular-nums"],
    },
    countdownLabel: {
        color: paper.muted,
        fontSize: 13,
        marginLeft: 6,
        fontWeight: "600",
    },
    progressContainer: {
        width: "100%",
        marginTop: spacing.lg,
    },
    progressTrack: {
        height: 6,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: colors.green,
        borderRadius: 3,
    },
    sectionTitle: {
        color: paper.muted,
        fontSize: 13,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: spacing.md,
    },
    listCard: {
        paddingHorizontal: 0,
        paddingVertical: 0,
        marginBottom: spacing.xl,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    rowInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.blue,
        marginRight: 10,
    },
    rowLabel: {
        color: paper.muted,
        fontSize: 16,
        fontWeight: "600",
    },
    rowLabelActive: {
        color: paper.title,
        fontWeight: "800",
    },
    rowValue: {
        color: paper.muted,
        fontSize: 16,
        fontWeight: "700",
    },
    rowValueActive: {
        color: paper.title,
        fontWeight: "900",
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(0,0,0,0.06)", // Fixed to very light
        marginHorizontal: spacing.lg,
    },
    moduleSection: {
        marginBottom: spacing.xl,
    },
    moduleCard: {
        marginBottom: spacing.md,
    },
    moduleLabel: {
        color: paper.title,
        fontSize: 14,
        fontWeight: "800",
        marginBottom: spacing.sm,
    },
    arabicText: {
        color: paper.text,
        fontFamily: "Amiri_400Regular",
        fontSize: 22,
        lineHeight: 34,
        textAlign: "right",
        marginBottom: spacing.sm,
    },
    moduleBody: {
        color: paper.muted,
        fontSize: 14,
        lineHeight: 20,
        fontStyle: "italic",
    },
    ramadanRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 2,
    },
    ramadanValue: {
        color: paper.text,
        fontSize: 16,
        fontWeight: "700",
    },
    moduleAction: {
        marginTop: spacing.sm,
        alignSelf: "flex-end",
    },
    moduleActionText: {
        color: paper.title,
        fontSize: 13,
        fontWeight: "700",
    },
    actionGrid: {
        flexDirection: "row",
        marginHorizontal: -spacing.xs,
        marginBottom: spacing.xl,
    },
    actionCard: {
        flex: 1,
        paddingHorizontal: spacing.xs,
    },
    actionInner: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing.xl,
    },
    actionIcon: {
        fontSize: 24,
        marginBottom: spacing.xs,
    },
    actionText: {
        color: paper.muted,
        fontSize: 14,
        fontWeight: "700",
    },
    notifBtn: {
        paddingVertical: spacing.md,
        borderRadius: spacing.radius,
        alignItems: "center",
        borderWidth: 1,
        borderColor: paper.border,
        backgroundColor: paper.card,
    },
    notifBtnText: {
        color: paper.text,
        fontWeight: "800",
        fontSize: 14,
    },
    brand: {
        color: paper.title,
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: 4,
    },
    muted: {
        color: paper.muted,
        marginTop: spacing.md,
        fontSize: 14,
    },
});
