import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumGlassCard } from './PremiumGlassCard';
import { PremiumIconCapsule } from './PremiumIconCapsule';
import { premiumScreenTokens } from '../../theme/premiumScreenTheme';

type DuaListCardProps = {
    title: string;
    meta: string;
    grouped?: boolean;
    onPress: () => void;
};

export function DuaListCard({ title, meta, grouped = false, onPress }: DuaListCardProps) {
    return (
        <PremiumGlassCard
            onPress={onPress}
            style={[styles.card, grouped && styles.cardGrouped]}
            haptic="selection"
            scale={0.988}
        >
            <PremiumIconCapsule style={[styles.iconCapsule, grouped && styles.iconCapsuleGrouped]}>
                <Ionicons
                    name={grouped ? 'book-outline' : 'moon-outline'}
                    size={20}
                    color={premiumScreenTokens.colors.gold}
                />
            </PremiumIconCapsule>
            <View style={styles.content}>
                <Text style={[styles.kicker, grouped && styles.kickerGrouped]}>
                    {grouped ? 'Giň okalyş' : 'Gysga doga'}
                </Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.meta}>{meta}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={premiumScreenTokens.colors.gold} />
        </PremiumGlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: premiumScreenTokens.colors.cardSoft,
    },
    cardGrouped: {
        backgroundColor: premiumScreenTokens.colors.cardStrong,
    },
    iconCapsule: {
        marginRight: 16,
        marginTop: 1,
    },
    iconCapsuleGrouped: {
        backgroundColor: premiumScreenTokens.colors.goldSoftStrong,
    },
    content: {
        flex: 1,
        minWidth: 0,
        paddingRight: premiumScreenTokens.spacing.gapXs,
        paddingTop: 1,
    },
    kicker: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '600',
        color: premiumScreenTokens.colors.textTertiary,
        letterSpacing: 0.24,
        marginBottom: 5,
    },
    kickerGrouped: {
        color: premiumScreenTokens.colors.gold,
        fontWeight: '700',
    },
    title: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '700',
        color: premiumScreenTokens.colors.textPrimary,
        marginBottom: 6,
        paddingRight: premiumScreenTokens.spacing.gapXs,
    },
    meta: {
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '500',
        color: premiumScreenTokens.colors.textSecondary,
    },
});
