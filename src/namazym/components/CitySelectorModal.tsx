import React from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from "react-native";
import { CITIES_GROUPED, Place } from "../constants/cities";
import { paper } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { HapticService } from "../services/HapticService";

interface CitySelectorModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (place: Place) => void;
    currentCityId: string; // Actually currentPlaceKey
}

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({
    visible,
    onClose,
    onSelect,
    currentCityId,
}) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <View style={styles.container}>
                    <View style={styles.handle} />
                    <Text style={styles.title}>Şäher ýa-da welaýat saýlaň</Text>
                    <ScrollView style={styles.list}>
                        {CITIES_GROUPED.map((group) => (
                            <View key={group.title} style={styles.groupContainer}>
                                <Text style={styles.groupTitle}>{group.title}</Text>
                                {group.places.map((place) => (
                                    <Pressable
                                        key={place.key}
                                        style={[
                                            styles.item,
                                            place.key === currentCityId && styles.itemActive,
                                        ]}
                                        onPress={() => {
                                            HapticService.selection(); // Premium tick
                                            onSelect(place);
                                            onClose();
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.itemName,
                                                place.key === currentCityId && styles.itemNameActive,
                                            ]}
                                        >
                                            {place.label}
                                        </Text>
                                        {place.key === currentCityId && (
                                            <Text style={styles.checkIcon}>✓</Text>
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    container: {
        backgroundColor: paper.bg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
        maxHeight: "60%",
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: paper.border,
        borderRadius: 3,
        alignSelf: "center",
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 18,
        fontWeight: "800",
        color: paper.title,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.lg,
    },
    list: {
        paddingHorizontal: spacing.lg,
    },
    item: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        marginBottom: spacing.sm,
    },
    itemActive: {
        backgroundColor: "rgba(122, 90, 18, 0.1)",
    },
    itemName: {
        fontSize: 16,
        color: paper.text,
        fontWeight: "600",
    },
    itemNameActive: {
        color: paper.title,
        fontWeight: "800",
    },
    groupContainer: {
        marginBottom: spacing.lg,
    },
    groupTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: paper.muted,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.lg,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    checkIcon: {
        fontSize: 18,
        color: paper.title,
        fontWeight: "900",
    },
});
