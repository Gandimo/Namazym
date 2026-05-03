import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Hos geldiniz!',
        desc: 'Namazym programmasy bilen namaz wagtlaryny we beýleki musulman ybadatlaryny dogry hasaplaň.',
        icon: 'moon'
    },
    {
        id: '2',
        title: 'Mukaddes Gurhan',
        desc: 'Gurhany kerimi türkmen dilinde okaň we öwreniň.',
        icon: 'book'
    },
    {
        id: '3',
        title: 'Dogry Kybla',
        desc: 'Nirede bolsaňyzam kyblanyň ugruny takyk anyklaň.',
        icon: 'compass'
    }
];

const COLORS = {
    white: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#555555',
    gold: '#C4A050',
    glassCard: 'rgba(255, 255, 255, 0.95)',
    glassBorder: 'rgba(0,0,0,0.02)',
};

export default function OnboardingScreen() {
    const navigation = useNavigation<any>();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<any>(null);

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem('@onboarding_complete', 'true');
            // Request notification permission non-blocking — app never crashes on denial
            NotificationService.requestPermissions().catch(() => {});
            navigation.replace('LaunchLoader');
        } catch (e) {
            navigation.replace('LaunchLoader');
        }
    };

    const nextSlide = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            completeOnboarding();
        }
    };

    const renderItem = ({ item }: any) => (
        <View style={styles.slide}>
            <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={80} color={COLORS.gold} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc}>{item.desc}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1A237E', '#121212']} style={StyleSheet.absoluteFill} />

            <SafeAreaView style={{ flex: 1 }}>
                <FlatList
                    data={SLIDES}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={item => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                    onMomentumScrollEnd={(e) => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
                    ref={slidesRef}
                />

                <View style={styles.footer}>
                    <View style={styles.paginator}>
                        {SLIDES.map((_, i) => {
                            const dotWidth = scrollX.interpolate({
                                inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                                outputRange: [8, 24, 8],
                                extrapolate: 'clamp'
                            });
                            return <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity: currentIndex === i ? 1 : 0.3 }]} />;
                        })}
                    </View>

                    <Pressable onPress={nextSlide} style={styles.button}>
                        <Text style={styles.buttonText}>
                            {currentIndex === SLIDES.length - 1 ? 'BAŞLA' : 'DOWAM ET'}
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    slide: { width, alignItems: 'center', justifyContent: 'center', padding: 40 },
    iconCircle: { width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(196,160,80,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 60 },
    textContainer: { alignItems: 'center' },
    title: { fontSize: 32, fontWeight: '900', color: '#FFF', marginBottom: 20, textAlign: 'center' },
    desc: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 26, fontWeight: '600' },
    footer: { padding: 40 },
    paginator: { flexDirection: 'row', justifyContent: 'center', marginBottom: 40 },
    dot: { height: 8, borderRadius: 4, backgroundColor: COLORS.gold, marginHorizontal: 4 },
    button: { backgroundColor: COLORS.gold, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    buttonText: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 2 }
});
