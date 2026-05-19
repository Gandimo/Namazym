import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { premiumScreenTokens } from '../../theme/premiumScreenTheme';

type PremiumScreenHeaderProps = {
    title: string;
    subtitle?: string;
    onBack: () => void;
};

export function PremiumScreenHeader({ title, subtitle, onBack }: PremiumScreenHeaderProps) {
    return (
        <View style={styles.header}>
            <Pressable onPress={onBack} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={styles.titleBox}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <View style={styles.backSpacer} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: premiumScreenTokens.radius.headerButton,
        backgroundColor: premiumScreenTokens.colors.darkGlass,
        borderWidth: 1,
        borderColor: premiumScreenTokens.colors.darkGlassBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backSpacer: {
        width: 40,
    },
    titleBox: {
        alignItems: 'center',
        flexShrink: 1,
        paddingHorizontal: 12,
    },
    title: {
        fontSize: premiumScreenTokens.typography.headerTitle,
        fontWeight: '700',
        color: premiumScreenTokens.colors.textStrongOnDark,
        letterSpacing: 0.4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: premiumScreenTokens.typography.headerSubtitle,
        fontWeight: '600',
        color: premiumScreenTokens.colors.textMutedOnDark,
        letterSpacing: 0.2,
        marginTop: 4,
        textAlign: 'center',
    },
});

