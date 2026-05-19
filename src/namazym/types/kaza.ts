import type { StyleProp, ViewStyle } from 'react-native';

export type KazaPrayerKey = 'irden' | 'oyle' | 'ikindi' | 'agsam' | 'yatsy' | 'witir';

export type KazaStoragePrayerKey = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' | 'Witr';

export interface KazaPrayerItem {
    key: KazaPrayerKey;
    title: string;
    storageKey: KazaStoragePrayerKey;
}

export interface KazaPrayerCardProps {
    title: string;
    count: number;
    onIncrement: () => void;
    onDecrement: () => void;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    testID?: string;
}
