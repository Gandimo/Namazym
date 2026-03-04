import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export const DemoBanner = () => {
    return (
        <View style={styles.banner}>
            <Text style={styles.text}>Byr reklam – byr sogap</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    banner: {
        backgroundColor: colors.card,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.xl,
        borderRadius: 999,
        alignSelf: "center",
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.lg,
    },
    text: {
        color: colors.text,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
});
