import type { SupportedCity } from '../prayer/types';

/**
 * Android notification channel for prayer-time alerts.
 * IMPORTANT: bump the version suffix whenever the channel sound changes —
 * Android ignores sound updates on an existing channel id, so a new id is the
 * only reliable way to make a new sound take effect.
 */
// v3: bumped because azan_short.wav was loudness-normalised to ~-12 LUFS.
// Android freezes a channel's sound at creation time, so existing users only
// hear the louder sound once this new channel id is created on their device.
export const AZAN_CHANNEL_ID = 'azan_alerts_v3';

/** Bundled short-Azan notification sound (declared in app.json expo-notifications). */
export const AZAN_SOUND_FILE = 'azan_short.wav';

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
