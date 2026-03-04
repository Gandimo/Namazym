import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { PremiumIcon } from './PremiumIcon';
import type { IconSize, IconGradient } from '../../theme/iconConstants';

interface IconWithLabelProps {
    library?: 'ionicons' | 'feather';
    iconName: string;
    iconSize?: IconSize;
    label: string;
    fontSize: number;
    fontWeight?: TextStyle['fontWeight'];
    gradient?: IconGradient;
    onPress?: () => void;
}

export const IconWithLabel: React.FC<IconWithLabelProps> = ({
    library,
    iconName,
    iconSize = 'STANDARD',
    label,
    fontSize,
    fontWeight = '400',
    gradient,
    onPress,
}) => {
    // Material Design: icon baseline shift = -11.5% of font size
    const baselineShift = -(fontSize * 0.115);

    return (
        <View style={styles.container}>
            <PremiumIcon
                library={library}
                name={iconName}
                size={iconSize}
                gradient={gradient}
                interactive={!!onPress}
                onPress={onPress}
                style={{ marginBottom: baselineShift }} // Perfect alignment!
            />
            <Text style={[styles.label, { fontSize, fontWeight }]}>
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        color: '#000',
    },
});
