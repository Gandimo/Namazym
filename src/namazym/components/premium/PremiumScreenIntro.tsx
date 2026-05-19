import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { premiumScreenTokens } from '../../theme/premiumScreenTheme';

type PremiumScreenIntroProps = {
    eyebrow?: string;
    title: string;
    body?: string;
};

export function PremiumScreenIntro({ eyebrow, title, body }: PremiumScreenIntroProps) {
    return (
        <View style={styles.container}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title}>{title}</Text>
            {body ? <Text style={styles.body}>{body}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.72)',
        letterSpacing: 0.22,
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        lineHeight: 28,
        fontWeight: '700',
        color: premiumScreenTokens.colors.textStrongOnDark,
        letterSpacing: 0.1,
    },
    body: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '500',
        color: premiumScreenTokens.colors.textMutedOnDark,
    },
});

