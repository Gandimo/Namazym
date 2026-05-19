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
}

export const DateStrip: React.FC<DateStripProps> = ({ selectedDate, onDateSelect }) => {
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
                    isSelected && styles.selectedItem
                ]}
            >
                <Text style={[styles.dayName, isSelected && styles.selectedDayName]}>{dayName}</Text>
                <Text style={[styles.dayNum, isSelected && styles.selectedDayNum]}>{dayNum}</Text>
                <Text style={[styles.hijriLabel, isSelected && styles.selectedHijriLabel]} numberOfLines={1}>
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
        backgroundColor: 'rgba(255, 255, 255, 0.075)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.10)',
    },
    selectedItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.105)',
        borderColor: 'rgba(193, 160, 99, 0.28)',
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    dayName: {
        fontSize: 10,
        fontWeight: '700',
        color: tokens2026.colors.text.secondary,
        letterSpacing: 1,
        marginBottom: 3,
    },
    dayNum: {
        fontSize: 21,
        lineHeight: 24,
        fontWeight: '800',
        color: tokens2026.colors.text.primary,
    },
    hijriLabel: {
        marginTop: 4,
        fontSize: 9,
        lineHeight: 11,
        fontWeight: '600',
        color: tokens2026.colors.text.secondary,
        opacity: 0.5,
        letterSpacing: 0.35,
    },
    selectedDayName: {
        color: 'rgba(255,255,255,0.82)',
    },
    selectedDayNum: {
        color: tokens2026.colors.brandGold,
    },
    selectedHijriLabel: {
        color: 'rgba(255,255,255,0.82)',
        opacity: 0.78,
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
