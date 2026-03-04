import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { format, addDays, startOfToday } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DAY_NAMES_TK = ['ÝEK', 'DUŞ', 'SIŞ', 'ÇAR', 'PEN', 'ANN', 'ŞEN'];

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
        // Fallback for Turkmen day names
        const dayName = DAY_NAMES_TK[item.getDay()];
        const dayNum = format(item, 'd');

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
                <Text style={[styles.dayName, isSelected && styles.selectedText]}>{dayName}</Text>
                <Text style={[styles.dayNum, isSelected && styles.selectedText]}>{dayNum}</Text>
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
                    length: 68, // item width 60 + margin 8
                    offset: 68 * index,
                    index
                })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 100,
        marginVertical: 10,
    },
    listContent: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    dateItem: {
        width: 60,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    selectedItem: {
        backgroundColor: 'rgba(196, 160, 80, 0.15)',
        borderColor: '#C4A050',
    },
    dayName: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    dayNum: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    selectedText: {
        color: '#C4A050',
    },
    indicator: {
        position: 'absolute',
        bottom: 10,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#C4A050',
    }
});
