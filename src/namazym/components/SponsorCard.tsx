import React, { useState } from 'react';
import { View, Image, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { useRemoteConfig } from '../context/RemoteConfigContext';
import { SponsorCampaign } from '../config/RemoteConfigTypes';
import { tokens } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface SponsorCardProps {
    position: SponsorCampaign['position'];
}

export const SponsorCard: React.FC<SponsorCardProps> = ({ position }) => {
    const { config } = useRemoteConfig();
    const [imageError, setImageError] = useState(false);

    // Find active campaign for this position
    const campaign = (config?.sponsorCampaigns || []).find(c => {
        if (!c.enabled || c.position !== position) return false;

        const now = new Date();
        const start = new Date(c.startAt);
        const end = new Date(c.endAt);

        return now >= start && now <= end;
    });

    if (!campaign || imageError) return null;

    const handlePress = async () => {
        try {
            const supported = await Linking.canOpenURL(campaign.clickUrl);
            if (supported) {
                await Linking.openURL(campaign.clickUrl);
            }
        } catch (e) {
            console.warn('Failed to open sponsor URL', e);
        }
    };

    return (
        <View style={styles.container}>
            <Pressable onPress={handlePress} style={styles.pressable}>
                <Image
                    source={{ uri: campaign.imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.xl,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.kart,
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
        borderWidth: 0,
    },
    pressable: {
        width: '100%',
        aspectRatio: 3, // Banner shape
    },
    image: {
        width: '100%',
        height: '100%',
    },
});
