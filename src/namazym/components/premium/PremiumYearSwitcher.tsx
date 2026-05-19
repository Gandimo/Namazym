import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { premiumScreenTokens } from '../../theme/premiumScreenTheme';

type PremiumYearSwitcherProps = {
    year: number;
    canGoPrev: boolean;
    canGoNext: boolean;
    onPrev: () => void;
    onNext: () => void;
};

export function PremiumYearSwitcher({
    year,
    canGoPrev,
    canGoNext,
    onPrev,
    onNext,
}: PremiumYearSwitcherProps) {
    return (
        <View style={styles.row}>
            <Pressable
                onPress={onPrev}
                disabled={!canGoPrev}
                style={[styles.button, !canGoPrev && styles.buttonDisabled]}
            >
                <Ionicons name="chevron-back" size={18} color={canGoPrev ? '#FFFFFF' : 'rgba(255,255,255,0.35)'} />
            </Pressable>
            <View style={styles.centerWrap}>
                <Text style={styles.year}>{year}</Text>
            </View>
            <Pressable
                onPress={onNext}
                disabled={!canGoNext}
                style={[styles.button, !canGoNext && styles.buttonDisabled]}
            >
                <Ionicons name="chevron-forward" size={18} color={canGoNext ? '#FFFFFF' : 'rgba(255,255,255,0.35)'} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    button: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: premiumScreenTokens.colors.darkGlass,
        borderWidth: 1,
        borderColor: premiumScreenTokens.colors.darkGlassBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    centerWrap: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: premiumScreenTokens.radius.pill,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    year: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
});

