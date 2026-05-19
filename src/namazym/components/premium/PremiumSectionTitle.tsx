import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { premiumScreenTokens } from '../../theme/premiumScreenTheme';

type PremiumSectionTitleProps = {
    title: string;
    dark?: boolean;
};

export function PremiumSectionTitle({ title, dark = true }: PremiumSectionTitleProps) {
    return (
        <View style={styles.row}>
            <Text style={[styles.title, dark ? styles.titleDark : styles.titleLight]}>{title}</Text>
            <View style={[styles.line, dark ? styles.lineDark : styles.lineLight]} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: premiumScreenTokens.typography.sectionTitle,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    titleDark: {
        color: 'rgba(255,255,255,0.82)',
    },
    titleLight: {
        color: premiumScreenTokens.colors.textPrimary,
    },
    line: {
        flex: 1,
        height: 1,
        marginLeft: 12,
    },
    lineDark: {
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    lineLight: {
        backgroundColor: 'rgba(24,32,43,0.08)',
    },
});

