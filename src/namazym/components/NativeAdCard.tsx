import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

import Constants from 'expo-constants';

// Lazy load safe guard
let RNAds: any = null;
try {
    if (Constants.appOwnership !== 'expo') {
        RNAds = require('react-native-google-mobile-ads');
    }
} catch (e) {
    RNAds = null;
}
const BannerAd = RNAds?.BannerAd;
const BannerAdSize = RNAds?.BannerAdSize;
const TestIds = RNAds?.TestIds;

import { Card } from './Card';
import { paper, colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { usePremium } from '../context/PremiumContext';

// REPLACE WITH PRODUCTION ID
const BANNER_ID = (TestIds && __DEV__)
    ? TestIds.BANNER
    : (Platform.OS === 'ios' ? 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyy' : 'ca-app-pub-xxxxxxxxxxxxx/zzzzzzzz');

export function NativeAdCard() {
    const { isPremium } = usePremium();
    const [adLoaded, setAdLoaded] = useState(false);

    // If user is premium, we hide the ad (Quiet Luxury reward)
    // OR we could keep it if the user wants to support, but typically premium removes ads.
    // For this strict "Hybrid" model, let's assume unlocking premium removes the banner 
    // to give immediate value.
    if (isPremium) return null;

    return (
        <View style={styles.container}>
            <Card variant="paper" style={styles.card}>
                <View style={styles.contentContainer}>
                    <View style={styles.adContainer}>
                        {BannerAd ? (
                            <BannerAd
                                unitId={BANNER_ID}
                                size={BannerAdSize.MEDIUM_RECTANGLE} // 300x250 standard
                                requestOptions={{
                                    requestNonPersonalizedAdsOnly: true,
                                }}
                                onAdLoaded={() => setAdLoaded(true)}
                                onAdFailedToLoad={(error: any) => {
                                    console.error('Ad failed to load', error);
                                    setAdLoaded(false);
                                }}
                            />
                        ) : null}
                    </View>

                    {/* Ethical Footer */}
                    {adLoaded && (
                        <View style={styles.footer}>
                            <Text style={styles.sponsorLabel}>GOLDAYJY</Text>
                            <Text style={styles.disclaimer}>
                                Bu ýerden gelýän girdeji haýyr-sahawat işlerine bagyşlanýar.
                            </Text>
                        </View>
                    )}
                </View>
            </Card>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: spacing.md,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
    },
    contentContainer: {
        alignItems: 'center',
        width: '100%',
    },
    adContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 250,
        backgroundColor: 'rgba(0,0,0,0.02)', // Placeholder bg
        borderRadius: 8,
        overflow: 'hidden',
    },
    footer: {
        marginTop: spacing.md,
        alignItems: 'center',
        paddingHorizontal: spacing.md,
    },
    sponsorLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.gold,
        letterSpacing: 1.5,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    disclaimer: {
        fontSize: 11,
        color: paper.muted,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 16,
    }
});
