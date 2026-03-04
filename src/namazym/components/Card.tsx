import React from "react";
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from "react-native";
import { tokens } from "../theme/colors";
import { spacing, borderRadius } from "../theme/spacing";

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
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
        borderRadius: borderRadius.kart,
        paddingVertical: spacing.kart_dikey,
        paddingHorizontal: spacing.kart_yatay,
        overflow: "visible",
        zIndex: 10,
    },
    glass: {
        backgroundColor: tokens.renkler.arka_plan.kartSaydam,
        borderWidth: 0,
    },
    paper: {
        backgroundColor: tokens.renkler.arka_plan.kart,
        borderWidth: 0,
        ...Platform.select({
            ios: {
                shadowColor: "#000000",
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 4,
            },
        }),
    },
});
