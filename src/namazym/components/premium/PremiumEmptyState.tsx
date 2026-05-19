import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PremiumEmptyStateProps = {
    icon?: keyof typeof Ionicons.glyphMap;
    text: string;
};

export function PremiumEmptyState({ icon = 'search', text }: PremiumEmptyStateProps) {
    return (
        <View style={styles.container}>
            <Ionicons name={icon} size={44} color="rgba(255,255,255,0.42)" />
            <Text style={styles.text}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 96,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    text: {
        marginTop: 16,
        color: 'rgba(255,255,255,0.82)',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 20,
    },
});

