import { getPrayerTimeLabel, getTurkmenPrayerName } from './prayerNames';

/**
 * Premium Notification Copy
 * Calm, respectful spiritual language
 * 
 * Philosophy: "Invitation, not interruption"
 * 
 * Rules:
 * - No exclamation marks
 * - No aggressive urgency
 * - Soft spiritual presence
 * - Respectful tone
 */

/**
 * Prayer Time Notifications
 * Calm announcement that prayer time has arrived
 */
export const PRAYER_TIME_COPY = {
    Fajr: {
        title: getPrayerTimeLabel('Fajr'),
        body: `${getPrayerTimeLabel('Fajr')} boldy`,
    },
    Dhuhr: {
        title: getPrayerTimeLabel('Dhuhr'),
        body: `${getPrayerTimeLabel('Dhuhr')} boldy`,
    },
    Asr: {
        title: getPrayerTimeLabel('Asr'),
        body: `${getPrayerTimeLabel('Asr')} boldy`,
    },
    Maghrib: {
        title: getPrayerTimeLabel('Maghrib'),
        body: `${getPrayerTimeLabel('Maghrib')} boldy`,
    },
    Isha: {
        title: getPrayerTimeLabel('Isha'),
        body: `${getPrayerTimeLabel('Isha')} boldy`,
    },
} as const;

/**
 * Pre-Prayer Reminders
 * Gentle advance notice (10-15 minutes before)
 */
export const PRE_PRAYER_COPY = {
    Fajr: {
        title: getTurkmenPrayerName('Fajr'),
        bodyTemplate: (minutes: number) => `${getTurkmenPrayerName('Fajr')}na ${minutes} minut galdy`,
    },
    Dhuhr: {
        title: getTurkmenPrayerName('Dhuhr'),
        bodyTemplate: (minutes: number) => `${getTurkmenPrayerName('Dhuhr')}na ${minutes} minut galdy`,
    },
    Asr: {
        title: getTurkmenPrayerName('Asr'),
        bodyTemplate: (minutes: number) => `${getTurkmenPrayerName('Asr')}na ${minutes} minut galdy`,
    },
    Maghrib: {
        title: getTurkmenPrayerName('Maghrib'),
        bodyTemplate: (minutes: number) => `${getTurkmenPrayerName('Maghrib')}na ${minutes} minut galdy`,
    },
    Isha: {
        title: getTurkmenPrayerName('Isha'),
        bodyTemplate: (minutes: number) => `${getTurkmenPrayerName('Isha')}na ${minutes} minut galdy`,
    },
} as const;

/**
 * Daily Spiritual Content
 * Morning verse notification
 */
export const DAILY_CONTENT_COPY = {
    verse: {
        title: 'Günüň Aýaty',
        bodyTemplate: (verse: string, reference: string) => {
            // Truncate long verses for notification (max ~80 chars)
            const truncated = verse.length > 80 ? `${verse.substring(0, 77)}...` : verse;
            return `${truncated}\n\n— ${reference}`;
        },
    },
    hadith: {
        title: 'Günüň Hadysy',
        bodyTemplate: (hadith: string, source: string) => {
            const truncated = hadith.length > 80 ? `${hadith.substring(0, 77)}...` : hadith;
            return `${truncated}\n\n— ${source}`;
        },
    },
} as const;

/**
 * Ramadan Special Notifications (Future)
 * Special handling for Ramadan period
 */
export const RAMADAN_COPY = {
    suhoor: {
        title: 'Sahur wagty',
        body: 'Sahur wagtyna az wagt galdy',
    },
    iftar: {
        title: 'Oraza açmak wagty',
        body: 'Oraza açmak wagty boldy',
    },
} as const;

/**
 * Helper: Get prayer time copy for a specific prayer
 */
export function getPrayerTimeCopy(prayerKey: keyof typeof PRAYER_TIME_COPY) {
    return PRAYER_TIME_COPY[prayerKey];
}

/**
 * Helper: Get pre-prayer reminder copy
 */
export function getPrePrayerCopy(prayerKey: keyof typeof PRE_PRAYER_COPY, minutes: number) {
    const copy = PRE_PRAYER_COPY[prayerKey];
    return {
        title: copy.title,
        body: copy.bodyTemplate(minutes),
    };
}

/**
 * Helper: Format verse for notification display
 */
export function formatVerseForNotification(verseText: string, reference: string): string {
    return DAILY_CONTENT_COPY.verse.bodyTemplate(verseText, reference);
}
