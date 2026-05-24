import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { format, addDays, startOfToday } from 'date-fns';
import { tokens2026 } from '../theme/tokens2026';
import { HijriUtils } from '../utils/hijri';

const DAY_NAMES_TK = ['ÝEK', 'DUŞ', 'SIŞ', 'ÇAR', 'PEN', 'ANN', 'ŞEN'];
const HIJRI_MONTH_ABBR_TK = ['Muh', 'Saf', 'RbI', 'RbII', 'JmI', 'JmII', 'Rej', 'Şag', 'Rem', 'Şew', 'Zkg', 'Zhj'];

interface DateStripProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
    isDarkTheme?: boolean;
}

export const DateStrip: React.FC<DateStripProps> = ({ selectedDate, onDateSelect, isDarkTheme = true }) => {
    const flatListRef = useRef<FlatList>(null);

    const dates = useMemo(() => {
        const today = startOfToday();
        return Array.from({ length: 30 }, (_, i) => addDays(today, i));
    }, []);

    const selectedIdx = useMemo(() => {
        return dates.findIndex(d => format(d, 'yyyy-MM-dd') === selectedDate);
    }, [dates, selectedDate]);

    useEffect(() => {
        if (selectedIdx !== -1 && flatListRef.current) {
            flatListRef.current.scrollToIndex({
                index: selectedIdx,
                animated: true,
                viewPosition: 0.5
            });
        }
    }, [selectedIdx]);

    const renderItem = ({ item }: { item: Date }) => {
        const dateStr = format(item, 'yyyy-MM-dd');
        const isSelected = dateStr === selectedDate;
        const dayName = DAY_NAMES_TK[item.getDay()];
        const dayNum = format(item, 'd');
        const hijri = HijriUtils.getHijriDate(item);
        const hijriLabel = isSelected
            ? `${hijri.day} ${HIJRI_MONTH_ABBR_TK[hijri.month] || hijri.monthName}`
            : `${hijri.day}`;

        return (
            <Pressable
                onPress={() => {
                    Haptics.selectionAsync();
                    onDateSelect(dateStr);
                }}
                style={[
                    styles.dateItem,
                    isDarkTheme ? styles.dateItemDark : styles.dateItemLight,
                    isSelected && styles.selectedItem,
                    isSelected && (isDarkTheme ? styles.selectedItemDark : styles.selectedItemLight)
                ]}
            >
                <Text style={[
                    styles.dayName,
                    { color: isDarkTheme ? tokens2026.colors.text.secondary : 'rgba(45,45,53,0.66)' },
                    isSelected && (isDarkTheme ? styles.selectedDayNameDark : styles.selectedDayNameLight),
                ]}>{dayName}</Text>
                <Text style={[
                    styles.dayNum,
                    { color: isDarkTheme ? tokens2026.colors.text.primary : '#34323A' },
                    isSelected && styles.selectedDayNum,
                ]}>{dayNum}</Text>
                <Text style={[
                    styles.hijriLabel,
                    { color: isDarkTheme ? tokens2026.colors.text.secondary : 'rgba(45,45,53,0.56)' },
                    isSelected && (isDarkTheme ? styles.selectedHijriLabelDark : styles.selectedHijriLabelLight),
                ]} numberOfLines={1}>
                    {hijriLabel}
                </Text>
                {isSelected && <View style={styles.indicator} />}
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={dates}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.toISOString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                getItemLayout={(_, index) => ({
                    length: 70,
                    offset: 70 * index,
                    index
                })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 108,
        marginVertical: 8,
    },
    listContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    dateItem: {
        width: 62,
        height: 86,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
        borderRadius: 22,
        borderWidth: 1,
    },
    dateItemDark: {
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
        borderColor: 'rgba(255, 255, 255, 0.14)',
    },
    dateItemLight: {
        backgroundColor: 'rgba(255, 255, 255, 0.44)',
        borderColor: 'rgba(201, 168, 76, 0.12)',
    },
    selectedItemDark: {
        backgroundColor: 'rgba(255, 255, 255, 0.105)',
        borderColor: 'rgba(193, 160, 99, 0.28)',
    },
    selectedItemLight: {
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
        borderColor: 'rgba(201, 168, 76, 0.42)',
    },
    selectedItem: {
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    dayName: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 3,
    },
    dayNum: {
        fontSize: 21,
        lineHeight: 24,
        fontWeight: '800',
    },
    hijriLabel: {
        marginTop: 4,
        fontSize: 9,
        lineHeight: 11,
        fontWeight: '600',
        opacity: 0.72,
        letterSpacing: 0.35,
    },
    selectedDayNameDark: {
        color: 'rgba(255,255,255,0.82)',
    },
    selectedDayNameLight: {
        color: 'rgba(45,45,53,0.72)',
    },
    selectedDayNum: {
        color: tokens2026.colors.brandGold,
    },
    selectedHijriLabelDark: {
        color: 'rgba(255,255,255,0.82)',
        opacity: 0.78,
        letterSpacing: 0.45,
    },
    selectedHijriLabelLight: {
        color: 'rgba(45,45,53,0.62)',
        opacity: 0.9,
        letterSpacing: 0.45,
    },
    indicator: {
        position: 'absolute',
        bottom: 10,
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: tokens2026.colors.brandGold,
    }
});
