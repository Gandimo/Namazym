import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { premiumScreenTokens } from '../../theme/premiumScreenTheme';

type PremiumIconCapsuleProps = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};

export function PremiumIconCapsule({ children, style }: PremiumIconCapsuleProps) {
    return <View style={[styles.capsule, style]}>{children}</View>;
}

const styles = StyleSheet.create({
    capsule: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: premiumScreenTokens.colors.goldSoft,
        borderWidth: 1,
        borderColor: premiumScreenTokens.colors.goldBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

