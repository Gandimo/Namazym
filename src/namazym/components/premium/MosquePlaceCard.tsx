import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumGlassCard } from './PremiumGlassCard';
import { PremiumIconCapsule } from './PremiumIconCapsule';
import { premiumScreenTokens } from '../../theme/premiumScreenTheme';

type MosquePlaceCardProps = {
    name: string;
    cityOrRegion: string;
    address?: string;
    onPress?: () => void;
};

export function MosquePlaceCard({
    name,
    cityOrRegion,
    address,
    onPress,
}: MosquePlaceCardProps) {
    console.log('[MosquePlaceCard props]', JSON.stringify({
        name,
        cityOrRegion,
        address,
        hasAction: Boolean(onPress),
    }));

    const hasMetjidiSuffix = name.endsWith(' Metjidi');
    const primaryName = hasMetjidiSuffix ? name.slice(0, -' Metjidi'.length) : name;
    const hasAddress = Boolean(address?.trim());
    const hasAction = Boolean(onPress);
    const showLocationRow = hasAddress || hasAction;

    return (
        <PremiumGlassCard onPress={onPress} style={styles.card} haptic="selection">
            <View style={styles.info}>
                <View style={styles.topRow}>
                    <PremiumIconCapsule style={styles.leadingCapsule}>
                        <Ionicons name="location" size={20} color={premiumScreenTokens.colors.gold} />
                    </PremiumIconCapsule>
                    <View style={styles.titleBlock}>
                        <Text style={styles.city}>{cityOrRegion}</Text>
                        <Text style={styles.name} numberOfLines={3}>
                            {primaryName}
                            {hasMetjidiSuffix ? <Text style={styles.nameSuffix}> Metjidi</Text> : null}
                        </Text>
                    </View>
                </View>
                {showLocationRow ? (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.bottomRow}>
                            {hasAddress ? (
                                <View style={styles.addressBlock}>
                                    <Text style={styles.addressLabel}>Salgy</Text>
                                    <Text style={styles.address} numberOfLines={2}>{address}</Text>
                                </View>
                            ) : <View style={styles.addressBlock} />}
                            {hasAction ? (
                                <View style={styles.actionWrap}>
                                    <PremiumIconCapsule style={styles.actionCapsule}>
                                        <Ionicons name="navigate-circle" size={22} color={premiumScreenTokens.colors.gold} />
                                    </PremiumIconCapsule>
                                    <Text style={styles.actionLabel}>Kartada aç</Text>
                                </View>
                            ) : null}
                        </View>
                    </>
                ) : null}
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
    info: {
        flex: 1,
        minWidth: 0,
        width: '100%',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        width: '100%',
    },
    leadingCapsule: {
        marginRight: 14,
        flexShrink: 0,
    },
    titleBlock: {
        flex: 1,
        minWidth: 0,
        width: 0,
        paddingTop: 2,
    },
    name: {
        flexShrink: 1,
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '700',
        color: premiumScreenTokens.colors.textPrimary,
        paddingRight: premiumScreenTokens.spacing.gapXs,
    },
    nameSuffix: {
        opacity: 0.7,
    },
    city: {
        flexShrink: 1,
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '700',
        color: premiumScreenTokens.colors.gold,
        letterSpacing: 0.18,
        marginBottom: 5,
    },
    divider: {
        height: 1,
        backgroundColor: premiumScreenTokens.colors.textDivider,
        marginBottom: 9,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        width: '100%',
    },
    addressBlock: {
        flex: 1,
        minWidth: 0,
        width: 0,
        paddingRight: 16,
    },
    addressLabel: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '700',
        color: premiumScreenTokens.colors.textTertiary,
        letterSpacing: 0.22,
        marginBottom: 3,
    },
    address: {
        flexShrink: 1,
        fontSize: 13,
        lineHeight: 20,
        fontWeight: '500',
        color: premiumScreenTokens.colors.textSecondary,
        paddingRight: premiumScreenTokens.spacing.gapXs,
    },
    actionWrap: {
        width: 72,
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexShrink: 0,
        marginLeft: 12,
        paddingTop: 2,
    },
    actionCapsule: {
        marginLeft: 0,
        marginBottom: 6,
    },
    actionLabel: {
        fontSize: 10,
        lineHeight: 12,
        fontWeight: '600',
        color: premiumScreenTokens.colors.textTertiary,
        letterSpacing: 0.18,
        textAlign: 'center',
    },
});
