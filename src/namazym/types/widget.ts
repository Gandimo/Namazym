export type PrayerWidgetKey = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export const APP_GROUP_ID = 'group.com.namazym.app';
export const WIDGET_SNAPSHOT_KEY = 'namazym.widget.snapshot.v1';

export interface WidgetPrayerTime {
    key: PrayerWidgetKey;
    label: string;
    time: string;
    timestampISO: string;
}

export interface WidgetPrayerSummary {
    key: PrayerWidgetKey;
    label: string;
    time: string;
    timestampISO?: string;
}

export interface WidgetRemainingTime {
    totalMinutes: number;
    display: string;
}

export interface WidgetVisualMood {
    key: PrayerWidgetKey;
    accentColor: string;
    backgroundColor: string;
}

export interface WidgetDailyVerse {
    text: string;
    reference: string;
    source?: string;
}

export interface NamazymWidgetSnapshotV1 {
    schemaVersion: 1;
    generatedAtISO: string;
    localDateISO: string;
    timezone: string;
    city: {
        key: string;
        name: string;
    };
    prayers: WidgetPrayerTime[];
    currentPrayer: WidgetPrayerSummary | null;
    nextPrayer: WidgetPrayerSummary | null;
    remaining: WidgetRemainingTime | null;
    visualMood: WidgetVisualMood;
    dailyVerse?: WidgetDailyVerse;
}
