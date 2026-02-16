import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { colors, paper } from "../theme/colors";
import { spacing } from "../theme/spacing";

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: "glass" | "paper";
}

export const Card = ({ children, style, variant = "paper" }: CardProps) => {
    return (
        <View
            style={[
                styles.card,
                variant === "paper" ? styles.paper : styles.glass,
                style,
            ]}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: spacing.radius,
        padding: spacing.md,
        overflow: "visible", // Allowed for shadows
    },
    glass: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    paper: {
        backgroundColor: paper.card,
        borderWidth: 1,
        borderColor: paper.border,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.10,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
            },
            android: {
                elevation: 4,
            },
        }),
    },
});
