import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    Platform,
    Pressable
} from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumIcon } from '../components/icons/PremiumIcon';

// Internal Services & Utils
import {
    bearingToKaaba,
    AngleSmoother,
    angularDifference,
    ALIGNED_THRESHOLD
} from '../utils/kyblaUtils';
import { useCity } from '../context/CityContext';
import { CITIES } from '../constants/cities';
import { TimeService } from '../services/TimeService';
import { getCurrentPrayer } from '../utils/prayerUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COMPASS_SIZE = 240;

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

const Star = () => {
    const size = useRef(Math.random() * 1.5 + 1).current;
    const initialOpacity = useRef(Math.random() * 0.4 + 0.1).current;
    const opacity = useRef(new Animated.Value(initialOpacity)).current;
    const pos = useRef({
        top: Math.random() * (SCREEN_HEIGHT * 0.6),
        left: Math.random() * SCREEN_WIDTH,
    }).current;

    useEffect(() => {
        const animate = () => {
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: Math.random() * 0.5 + 0.2,
                    duration: Math.random() * 3000 + 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: initialOpacity,
                    duration: Math.random() * 3000 + 3000,
                    useNativeDriver: true,
                }),
            ]).start(() => animate());
        };
        animate();
    }, []);

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top: pos.top,
                left: pos.left,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: '#FFFFFF',
                opacity,
            }}
        />
    );
};

export default function KyblaScreen({ navigation }: any) {
    const { placeKey, prayerTimes } = useCity();
    const [heading, setHeading] = useState(0);
    const [subscription, setSubscription] = useState<any>(null);
    const smoother = useRef(new AngleSmoother(0.15)).current;
    const rotationAnim = useRef(new Animated.Value(0)).current;
    const [lastHapticTime, setLastHapticTime] = useState(0);

    const currentPrayerKey = useMemo(() => {
        if (!prayerTimes) return 'Dhuhr';
        const p = getCurrentPrayer(TimeService.now(), prayerTimes.timings as any);
        return p ? p.key : 'Dhuhr';
    }, [prayerTimes]);

    const theme = SKY_THEMES[currentPrayerKey as keyof typeof SKY_THEMES] || SKY_THEMES.Dhuhr;

    const kabaBearing = useMemo(() => {
        const city = CITIES.find(c => c.key === placeKey) || CITIES[0];
        return bearingToKaaba(city.lat || 37.96, city.lon || 58.32);
    }, [placeKey]);

    useEffect(() => {
        _subscribe();
        return () => _unsubscribe();
    }, []);

    const _subscribe = () => {
        Magnetometer.setUpdateInterval(16);
        setSubscription(
            Magnetometer.addListener((data) => {
                let magHeading = Math.atan2(data.y, data.x) * (180 / Math.PI);
                magHeading = (magHeading + 360) % 360;
                const smoothed = smoother.smooth(magHeading);
                setHeading(smoothed);
                rotationAnim.setValue(smoothed);

                const diff = angularDifference(smoothed, kabaBearing);
                if (Math.abs(diff) <= ALIGNED_THRESHOLD) {
                    const now = Date.now();
                    if (now - lastHapticTime > 2000) {
                        if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        }
                        setLastHapticTime(now);
                    }
                }
            })
        );
    };

    const _unsubscribe = () => {
        subscription && subscription.remove();
        setSubscription(null);
    };

    const isAligned = Math.abs(angularDifference(heading, kabaBearing)) <= ALIGNED_THRESHOLD;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={theme as any} style={StyleSheet.absoluteFill} />
            {currentPrayerKey === 'Isha' && Array.from({ length: 30 }).map((_, i) => <Star key={i} />)}

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.iconButton}
                    >
                        <PremiumIcon
                            name="chevron-back"
                            size="STANDARD"
                            color="#FFFFFF"
                            interactive
                            onPress={() => navigation.goBack()}
                        />
                    </Pressable>
                    <Text style={styles.title}>Kybla Pusulasy</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.content}>
                    <View style={styles.compassContainer}>
                        <View style={styles.outerRing} />
                        <Animated.View
                            style={[
                                styles.compassDisk,
                                {
                                    transform: [{
                                        rotate: rotationAnim.interpolate({
                                            inputRange: [0, 360],
                                            outputRange: ['0deg', '-360deg']
                                        })
                                    }]
                                }
                            ]}
                        >
                            <Text style={[styles.cardinal, styles.north]}>N</Text>
                            <Text style={[styles.cardinal, styles.east]}>E</Text>
                            <Text style={[styles.cardinal, styles.south]}>S</Text>
                            <Text style={[styles.cardinal, styles.west]}>W</Text>

                            <View
                                style={[
                                    styles.kabaPointerOnDisk,
                                    { transform: [{ rotate: `${kabaBearing}deg` }] }
                                ]}
                            >
                                <PremiumIcon
                                    name="location"
                                    size="MEDIUM"
                                    gradient="QIBLA_COMPASS"
                                />
                                <View style={styles.kabaDot} />
                            </View>
                        </Animated.View>

                        <View style={styles.centerNeedle}>
                            <View style={styles.needleTop} />
                            <View style={styles.needleBottom} />
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <Text style={styles.degreeText}>{Math.round(heading)}°</Text>
                        <Text style={[styles.statusText, isAligned && styles.alignedText]}>
                            {isAligned ? 'Kybla Gönükdirildi' : 'Kaba Tarap Öwrüliň'}
                        </Text>

                        <View style={styles.divider} />

                        <View style={styles.locationInfo}>
                            <PremiumIcon name="map-outline" size="SMALL" color={COLORS.textSecondary} />
                            <Text style={styles.bearingValue}>Mekge: {Math.round(kabaBearing)}°</Text>
                        </View>
                    </View>
                </View>
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
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20,
    },
    compassContainer: {
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 80,
    },
    outerRing: {
        position: 'absolute',
        width: COMPASS_SIZE + 24,
        height: COMPASS_SIZE + 24,
        borderRadius: (COMPASS_SIZE + 24) / 2,
        borderWidth: 2,
        borderColor: COLORS.gold,
        opacity: 0.5,
    },
    compassDisk: {
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
        borderRadius: COMPASS_SIZE / 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardinal: {
        position: 'absolute',
        fontSize: 14,
        fontWeight: '900',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    north: { top: 12, color: '#EF4444' },
    east: { right: 12 },
    south: { bottom: 12 },
    west: { left: 12 },
    kabaPointerOnDisk: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 45,
    },
    kabaDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.gold,
        marginTop: 4,
    },
    centerNeedle: {
        position: 'absolute',
        width: 4,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    needleTop: {
        width: 4,
        height: 70,
        backgroundColor: '#EF4444',
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
    },
    needleBottom: {
        width: 4,
        height: 70,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 2,
        borderBottomRightRadius: 2,
    },
    infoCard: {
        width: SCREEN_WIDTH * 0.88,
        backgroundColor: COLORS.glassCard,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowOpacity: 0,
        elevation: 0,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    degreeText: {
        fontSize: 56,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: -2,
    },
    statusText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    alignedText: {
        color: '#34A853',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        marginVertical: 24,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bearingValue: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '700',
        marginLeft: 8,
    }
});
