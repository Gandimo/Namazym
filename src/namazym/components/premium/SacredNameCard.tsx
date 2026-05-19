import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { PremiumGlassCard } from './PremiumGlassCard';
import { premiumScreenTokens } from '../../theme/premiumScreenTheme';

type SacredNameCardProps = {
    id: number | string;
    arabic: string;
    latin: string;
};

export function SacredNameCard({ id, arabic, latin }: SacredNameCardProps) {
    return (
        <PremiumGlassCard style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{id}</Text>
                </View>
                <View style={styles.rule} />
            </View>

            <Text style={styles.arabic}>{arabic}</Text>

            <View style={styles.footer}>
                <Text style={styles.latin}>{latin}</Text>
                <View style={styles.footerRule} />
            </View>
        </PremiumGlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 18,
        borderRadius: premiumScreenTokens.radius.cardLarge,
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 26,
    },
    badge: {
        minWidth: 34,
        height: 24,
        borderRadius: premiumScreenTokens.radius.pill,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: premiumScreenTokens.colors.goldSoft,
        borderWidth: 1,
        borderColor: premiumScreenTokens.colors.goldBorder,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: premiumScreenTokens.colors.gold,
        letterSpacing: 0.18,
    },
    rule: {
        flex: 1,
        height: 1,
        marginLeft: 12,
        backgroundColor: premiumScreenTokens.colors.goldBorder,
    },
    arabic: {
        fontSize: 40,
        lineHeight: 52,
        fontWeight: '700',
        color: premiumScreenTokens.colors.textPrimary,
        fontFamily: Platform.OS === 'ios' ? 'Geeza Pro' : 'serif',
        textAlign: 'right',
        marginBottom: 28,
        alignSelf: 'stretch',
    },
    footer: {
        alignItems: 'flex-start',
        alignSelf: 'stretch',
    },
    latin: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '600',
        color: premiumScreenTokens.colors.textSecondary,
        letterSpacing: 0.08,
        marginBottom: 9,
        maxWidth: '88%',
        paddingRight: premiumScreenTokens.spacing.gapSm,
    },
    footerRule: {
        width: 28,
        height: 1,
        backgroundColor: premiumScreenTokens.colors.goldLine,
    },
});
