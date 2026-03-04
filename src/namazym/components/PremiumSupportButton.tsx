import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SparkleIcon } from './icons';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { tokens } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface PremiumSupportButtonProps {
    onRewardEarned?: () => void;
    disabled?: boolean;
}

/**
 * A respectful, premium button for optional support.
 * "Invites" rather than "Demands".
 */
export function PremiumSupportButton({ onRewardEarned, disabled }: PremiumSupportButtonProps) {
    const { isLoaded, isEarned, showAd, error } = useRewardedAd();

    // Handle reward feedback
    useEffect(() => {
        if (isEarned) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (onRewardEarned) onRewardEarned();
        }
    }, [isEarned]);

    const handlePress = () => {
        if (isLoaded && !disabled) {
            Haptics.selectionAsync();
            showAd();
        } else {
            // Optional: Show a toast "Bagyşlaň, entek taýýar däl" (Sorry, not ready yet)
            console.log("Ad not ready or disabled");
        }
    };

    if (error) return null; // Gracefully hide if error

    const isDisabled = !isLoaded || disabled;

    return (
        <View style={styles.container}>
            <Pressable
                onPress={handlePress}
                style={({ pressed }) => [
                    styles.button,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] },
                    isDisabled && styles.buttonDisabled
                ]}
                disabled={isDisabled}
            >
                <LinearGradient
                    colors={isLoaded
                        ? [tokens.renkler.marka.altinSaydam, tokens.renkler.marka.altinSaydam] // Assuming altinSaydam is rgba(196, 160, 80, 0.2) and we need a slightly lighter one for the start
                        : [tokens.renkler.ayirici.normal, tokens.renkler.ayirici.normal]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        {isLoaded ? (
                            <SparkleIcon size={20} color={tokens.renkler.marka.altin} />
                        ) : (
                            <ActivityIndicator size="small" color={tokens.renkler.metin.ikincil} />
                        )}
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Goldaw bermek</Text>
                        <Text style={styles.subtitle}>Haýyr niýeti bilen wideo gör</Text>
                    </View>
                </View>

                {/* Elegant border */}
                <View style={styles.border} />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: spacing.md,
    },
    button: {
        borderRadius: borderRadius.kart,
        overflow: 'hidden',
        height: 64,
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: tokens.renkler.metin.birincil,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '500',
        color: tokens.renkler.metin.ikincil,
        marginTop: 2,
    },
    border: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: borderRadius.kart,
        borderWidth: 1,
        borderColor: tokens.renkler.marka.altinSaydam,
    }
});
