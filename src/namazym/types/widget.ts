export type PrayerWidgetKey = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export const APP_GROUP_ID = 'group.com.namazym.app';
export const WIDGET_SNAPSHOT_KEY = 'namazym.widget.snapshot.v1';

export interface WidgetPrayerTime {
    key: PrayerWidgetKey;
    label: string;
    time: string;
    timestampISO: string;
    /** Epoch milliseconds — native widget code compares against this, no date parsing. */
    timestamp: number;
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

/** One day of prayer times inside the multi-day snapshot. */
export interface WidgetDayPrayers {
    dateISO: string;
    prayers: WidgetPrayerTime[];
    dailyVerse?: WidgetDailyVerse;
}

/**
 * v2 — carries several days of prayer times so the native widgets can resolve
 * current/next prayer and the remaining-time text at RENDER time instead of
 * displaying values frozen at the moment the app last wrote the snapshot.
 * All v1 fields are still populated (computed for "now") so older render
 * paths keep working during the transition.
 */
export interface NamazymWidgetSnapshotV2 extends Omit<NamazymWidgetSnapshotV1, 'schemaVersion'> {
    schemaVersion: 2;
    days: WidgetDayPrayers[];
    moods: Record<PrayerWidgetKey, WidgetVisualMood>;
}
