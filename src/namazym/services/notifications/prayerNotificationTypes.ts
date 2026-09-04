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

/**
 * How many days of prayer notifications are scheduled ahead (including today).
 * Sized to stay under iOS's hard cap of 64 pending local notifications:
 * 6 days × (5 azan + up to 5 reminders) = 60, + weekly Juma + daily content ≤ 64.
 * A user who does not open the app still gets notifications for a full 6 days
 * (the old horizon was only today + tomorrow).
 */
export const SCHEDULE_DAYS_AHEAD = 6;

export interface PrayerNotificationSettings {
    enabled: boolean;
    leadMinutes: 0 | 5 | 10 | 15;
    prayers: Record<PrayerName, boolean>;
}

export interface PrayerScheduleMeta {
    city: SupportedCity;
    placeKey: string;
    scheduledForDates: string[];
    rebuiltAt: string;
    leadMinutes: number;
    /**
     * Android exact-alarm access at the time of the last rebuild. When the user
     * grants it later, the changed value forces a rebuild so every pending
     * notification is rescheduled as an EXACT alarm.
     */
    exactAlarmGranted?: boolean;
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
