import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, LayoutAnimation } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Card } from './Card';
import { PremiumSupportButton } from './PremiumSupportButton';
import { SparkleIcon } from './icons';
import { paper, colors, tokens } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { usePremium } from '../context/PremiumContext';

// AdMob removed for Expo Go compatibility
// Re-enable in development builds by restoring react-native-google-mobile-ads
const BannerAd = null;
const BannerAdSize = null;

export function EthicalSupportCard() {
    const { isPremium, unlockPremium } = usePremium();
    const [bannerLoaded, setBannerLoaded] = useState(false);

    // Check if ads are supported (native module present)
    const adsSupported = useMemo(() => !!BannerAd, []);

    const handleReward = () => {
        // Triggered when video completes
        unlockPremium(); // This sets isPremium=true
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    };

    if (isPremium) {
        return (
            <View style={styles.container}>
                <Card variant="paper" style={styles.thankYouCard}>
                    <LinearGradient
                        colors={['rgba(196, 160, 80, 0.15)', 'rgba(52, 211, 153, 0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.thankYouContent}>
                        <SparkleIcon size={32} color={colors.gold} />
                        <Text style={styles.thankYouTitle}>Goldawyňyz üçin sag boluň</Text>
                        <Text style={styles.thankYouBody}>
                            Siziň goldawyňyz Namazym ykjam programmasynyň ösmegine goşant goşýar.
                        </Text>
                    </View>
                </Card>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Card variant="paper" style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>GOLDAW • SUPPORT</Text>
                    <View style={styles.headerLine} />
                </View>

                {/* Primary Action: Rewarded Ad */}
                <View style={[styles.actionSection, !adsSupported && { opacity: 0.5 }]}>
                    <PremiumSupportButton
                        onRewardEarned={handleReward}
                        disabled={!adsSupported}
                    />
                    {!adsSupported && (
                        <Text style={styles.devNote}>
                            (Ads require Dev Client, not available in Expo Go)
                        </Text>
                    )}
                </View>

                {/* Banner ads removed for Expo Go compatibility */}
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: spacing.lg,
        paddingHorizontal: 0,
    },
    card: {
        padding: spacing.md,
        backgroundColor: tokens.renkler.arka_plan.kartSaydam,
        borderRadius: borderRadius.kart,
        borderWidth: 0,
        ...Platform.select({
            ios: {
                shadowColor: "#000000",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 4,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontSize: tokens.tipografi.boyutlar.xs,
        fontWeight: tokens.tipografi.agirliklar.kalin,
        color: tokens.renkler.marka.altin,
        letterSpacing: 2,
        marginRight: spacing.sm,
        textTransform: 'uppercase',
    },
    headerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(196, 160, 80, 0.2)',
    },
    actionSection: {
        marginBottom: spacing.sm,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.sm,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: paper.border,
    },
    dividerText: {
        fontSize: 10,
        fontWeight: '600',
        color: paper.muted,
        paddingHorizontal: spacing.sm,
    },
    bannerSection: {
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    bannerWrapper: {
        overflow: 'hidden',
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    sponsorLabel: {
        fontSize: 10,
        color: paper.muted,
        opacity: 0.6,
        marginTop: 4,
        fontStyle: 'italic',
    },

    // Thank You State
    thankYouCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
        borderRadius: borderRadius.kart,
        borderWidth: 0,
        overflow: 'hidden',
        backgroundColor: tokens.renkler.arka_plan.kartSaydam,
        ...Platform.select({
            ios: {
                shadowColor: "#000000",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 4,
            },
        }),
    },
    thankYouContent: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    thankYouTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: paper.title,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    thankYouBody: {
        fontSize: 14,
        color: paper.muted,
        textAlign: 'center',
        lineHeight: 20,
    },
    devNote: {
        fontSize: 10,
        color: '#E53E3E',
        textAlign: 'center',
        marginTop: 4,
        fontStyle: 'italic',
    }
});
