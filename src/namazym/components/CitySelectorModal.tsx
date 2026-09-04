import React from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from "react-native";
import { CITIES_GROUPED, Place } from "../constants/cities";
import { REGIONS_BY_PROVINCE } from "../constants/regions";
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
    // Seçili bölgenin welaýaty modal açıldığında açık gelsin.
    const currentProvinceKey = React.useMemo(() => {
        for (const [provinceKey, regions] of Object.entries(REGIONS_BY_PROVINCE)) {
            if (regions.some((region) => region.key === currentCityId)) {
                return provinceKey;
            }
        }
        return null;
    }, [currentCityId]);
    const [expandedProvince, setExpandedProvince] = React.useState<string | null>(currentProvinceKey);

    React.useEffect(() => {
        if (visible) {
            setExpandedProvince(currentProvinceKey);
        }
    }, [visible, currentProvinceKey]);

    const selectPlace = (place: Place) => {
        HapticService.selection(); // Premium tick
        onSelect(place);
        onClose();
    };

    const renderPlaceRow = (place: Place, isRegion = false) => (
        <Pressable
            key={place.key}
            style={[
                styles.item,
                isRegion && styles.regionItem,
                place.key === currentCityId && styles.itemActive,
            ]}
            onPress={() => selectPlace(place)}
        >
            <Text
                style={[
                    styles.itemName,
                    isRegion && styles.regionItemName,
                    place.key === currentCityId && styles.itemNameActive,
                ]}
            >
                {place.label}
            </Text>
            {place.key === currentCityId && (
                <Text style={styles.checkIcon}>✓</Text>
            )}
        </Pressable>
    );

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
                        {CITIES_GROUPED.map((group) => {
                            const isProvinceGroup = group.title === "Welaýatlar";
                            return (
                                <View key={group.title} style={styles.groupContainer}>
                                    <Text style={styles.groupTitle}>{group.title}</Text>
                                    {group.places.map((place) => {
                                        const regions = isProvinceGroup ? REGIONS_BY_PROVINCE[place.key] : undefined;
                                        if (!regions || regions.length === 0) {
                                            return renderPlaceRow(place);
                                        }
                                        const expanded = expandedProvince === place.key;
                                        return (
                                            <View key={`prov-${place.key}`}>
                                                <View style={[styles.item, place.key === currentCityId && styles.itemActive]}>
                                                    <Pressable style={styles.provinceLabelZone} onPress={() => selectPlace(place)}>
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
                                                    <Pressable
                                                        style={styles.expandButton}
                                                        hitSlop={8}
                                                        onPress={() => {
                                                            HapticService.selection();
                                                            setExpandedProvince(expanded ? null : place.key);
                                                        }}
                                                    >
                                                        <Text style={styles.expandIcon}>{expanded ? "▾" : "▸"}</Text>
                                                        <Text style={styles.expandCount}>{regions.length}</Text>
                                                    </Pressable>
                                                </View>
                                                {expanded && regions.map((region) => renderPlaceRow(region, true))}
                                            </View>
                                        );
                                    })}
                                </View>
                            );
                        })}
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
    provinceLabelZone: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    expandButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: spacing.lg,
        paddingVertical: 4,
        gap: 4,
    },
    expandIcon: {
        fontSize: 16,
        color: paper.muted,
        fontWeight: "700",
    },
    expandCount: {
        fontSize: 12,
        color: paper.muted,
        fontWeight: "700",
    },
    regionItem: {
        paddingVertical: spacing.md,
        marginLeft: spacing.xl,
        borderLeftWidth: 2,
        borderLeftColor: "rgba(122, 90, 18, 0.15)",
    },
    regionItemName: {
        fontSize: 15,
        fontWeight: "500",
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
