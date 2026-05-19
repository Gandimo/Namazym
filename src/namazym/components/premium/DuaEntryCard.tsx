import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumGlassCard } from './PremiumGlassCard';
import { PremiumIconCapsule } from './PremiumIconCapsule';
import { premiumScreenTokens } from '../../theme/premiumScreenTheme';

type DuaEntryCardProps = {
    title: string;
    meta: string;
    grouped?: boolean;
    onPress: () => void;
};

export function DuaEntryCard({ title, meta, grouped = false, onPress }: DuaEntryCardProps) {
    return (
        <PremiumGlassCard
            onPress={onPress}
            style={[styles.card, grouped && styles.cardGrouped]}
            contentStyle={styles.cardContent}
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
                <Text style={styles.kicker}>{grouped ? 'Giň okalyş' : 'Gysga doga'}</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.meta}>{meta}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={premiumScreenTokens.colors.gold} />
        </PremiumGlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: premiumScreenTokens.colors.cardSoft,
    },
    cardGrouped: {
        backgroundColor: premiumScreenTokens.colors.card,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        minWidth: 0,
    },
    iconCapsule: {
        marginRight: 16,
    },
    iconCapsuleGrouped: {
        backgroundColor: premiumScreenTokens.colors.goldSoftStrong,
    },
    content: {
        flex: 1,
        minWidth: 0,
    },
    kicker: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '700',
        color: premiumScreenTokens.colors.gold,
        letterSpacing: 0.24,
        marginBottom: 4,
    },
    title: {
        flexShrink: 1,
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '700',
        color: premiumScreenTokens.colors.textPrimary,
        marginBottom: 6,
    },
    meta: {
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '500',
        color: premiumScreenTokens.colors.textSecondary,
    },
});
