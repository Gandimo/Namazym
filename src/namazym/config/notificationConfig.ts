/**
 * Premium Notification Configuration
 * Defines calm, respectful notification behaviors
 */

export const NOTIFICATION_CONFIG = {
    /**
     * Prayer Time Notifications
     */
    prayers: {
        enabled: true,
        soundEnabled: false, // Default: Silent (Luxury Psychology)
        vibrationEnabled: true, // Default: Subtle Haptic only
        vibrationPattern: [0, 100], // Short, crisp pulse (Luxury)
    },

    /**
     * Pre-Prayer Reminders
     * Optional gentle warnings 10-15 minutes before prayer time
     */
    preReminders: {
        enabled: true,
        minutesBefore: 15,
        maxPerDay: 5, // Anti-spam: prevent excessive reminders
    },

    /**
     * Daily Spiritual Content
     * Morning verse notification for spiritual presence
     */
    dailyContent: {
        enabled: true,
        ayatTime: '08:00', // Morning spiritual content
        hadithEnabled: false, // Optional, disabled by default
    },

    /**
     * Premium Behavioral Settings
     * Ensures calm, respectful notification delivery
     */
    premium: {
        importance: 'HIGH' as const, // Android: HIGH (not MAX) for calm delivery
        calmTone: true, // Use gentle language
        respectQuietHours: true, // Honor user sleep patterns
        quietHoursStart: '22:00',
        quietHoursEnd: '05:00',
        minNotificationGapMinutes: 5, // Anti-spam: minimum gap between notifications
    },

    /**
     * Lockscreen Presence
     */
    lockscreen: {
        showFullContent: true, // Show verse content in expanded view
        actionButtons: true, // "Open", "Dismiss"
    },
} as const;

/**
 * Helper: Check if current time is within quiet hours
 */
export function isQuietHours(): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = NOTIFICATION_CONFIG.premium.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = NOTIFICATION_CONFIG.premium.quietHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 - 05:00)
    if (startTime > endTime) {
        return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
}
