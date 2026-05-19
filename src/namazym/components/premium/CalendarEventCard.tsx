import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumGlassCard } from './PremiumGlassCard';
import { premiumScreenTokens } from '../../theme/premiumScreenTheme';

type CalendarEventCardProps = {
    day?: number | string;
    monthShort?: string;
    title: string;
    hijri: string;
    relative: string;
    featured?: boolean;
};

export function CalendarEventCard({
    day,
    monthShort,
    title,
    hijri,
    relative,
    featured = false,
}: CalendarEventCardProps) {
    return (
        <PremiumGlassCard style={[styles.card, featured && styles.cardFeatured]}>
            <View style={[styles.dateBox, featured && styles.dateBoxFeatured]}>
                <Text style={styles.day}>{day ?? ''}</Text>
                <Text style={styles.month}>{monthShort || ''}</Text>
            </View>
            <View style={styles.content}>
                {featured ? <Text style={styles.kicker}>Möhüm gün</Text> : null}
                <Text style={[styles.title, featured && styles.titleFeatured]}>{title}</Text>
                <Text style={styles.hijri}>{hijri}</Text>
            </View>
        </PremiumGlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        backgroundColor: premiumScreenTokens.colors.cardStrong,
    },
    cardFeatured: {
        backgroundColor: 'rgba(255,255,255,0.985)',
    },
    dateBox: {
        width: 68,
        minHeight: 68,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: premiumScreenTokens.colors.goldSoft,
        borderWidth: 1,
        borderColor: premiumScreenTokens.colors.goldBorder,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 18,
        marginTop: 1,
    },
    dateBoxFeatured: {
        backgroundColor: premiumScreenTokens.colors.goldSoftStrong,
    },
    day: {
        fontSize: 22,
        lineHeight: 24,
        fontWeight: '800',
        color: premiumScreenTokens.colors.gold,
    },
    month: {
        marginTop: 4,
        fontSize: 11,
        lineHeight: 14,
        fontWeight: '700',
        color: premiumScreenTokens.colors.gold,
        letterSpacing: 0.18,
    },
    content: {
        flex: 1,
        minWidth: 0,
        paddingTop: 2,
        paddingRight: premiumScreenTokens.spacing.gapXs,
    },
    kicker: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '700',
        letterSpacing: 0.28,
        color: premiumScreenTokens.colors.gold,
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        lineHeight: 21,
        fontWeight: '700',
        color: premiumScreenTokens.colors.textPrimary,
        marginBottom: 6,
    },
    titleFeatured: {
        fontSize: 16,
        lineHeight: 22,
    },
    hijri: {
        fontSize: 12,
        lineHeight: 18,
        fontWeight: '600',
        color: premiumScreenTokens.colors.textSecondary,
    },
});
