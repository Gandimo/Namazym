import type { SupportedCity } from '../prayer/types';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerNotificationSettings {
    enabled: boolean;
    leadMinutes: 0 | 5 | 10 | 15;
    prayers: Record<PrayerName, boolean>;
}

export interface PrayerScheduleMeta {
    city: SupportedCity;
    placeKey: string;
    scheduledForDates: [string, string];
    rebuiltAt: string;
    leadMinutes: number;
}

export type PrayerRebuildResult =
    | 'success'
    | 'partial_failure'
    | 'permission_denied'
    | 'disabled'
    | 'unsupported_city'
    | 'missing_dataset'
    | 'error';

export interface PrayerRebuildReport {
    city: SupportedCity | 'unknown';
    placeKey: string;
    today: string;
    scheduledToday: number;
    scheduledTomorrow: number;
    cancelledPrevious: number;
    skippedPast: number;
    permissionStatus: 'granted' | 'denied';
    result: PrayerRebuildResult;
    errors: string[];
    perPrayer: Record<PrayerName, { today: number; tomorrow: number; skipped: number }>;
}
