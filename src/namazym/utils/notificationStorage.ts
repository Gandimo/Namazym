import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PrayerNotificationToggles {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
}

export interface NotificationPreferences {
    is_enabled: boolean;
    prayer_notifications: {
        enabled: boolean;
        lead_minutes: 0 | 5 | 10 | 15;
        prayers: PrayerNotificationToggles;
    };
    juma_reminder: {
        enabled: boolean;
        hour: number;
        minute: number;
    };
    pre_prayer_alert: {
        enabled: boolean;
        offset_minutes: number;
        sound_type: 'azan_short' | 'standard' | 'silent';
        active_prayers: PrayerNotificationToggles & { sunrise: boolean };
    };
    daily_content: {
        enabled: boolean;
        time: string;
        sound_type: 'standard' | 'silent';
        types: ("ayah" | "hadith")[];
    };
}

const STORAGE_KEY = '@namazym_notifications';

const DEFAULT_PRAYER_TOGGLES: PrayerNotificationToggles = {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
};

function normalizeLeadMinutes(value: unknown): 0 | 5 | 10 | 15 {
    if (value === 0 || value === 5 || value === 10 || value === 15) {
        return value;
    }
    return 15;
}

function toPrayerToggleMap(input: unknown): PrayerNotificationToggles {
    const source = (input && typeof input === 'object') ? input as Record<string, unknown> : {};
    return {
        fajr: source.fajr !== false,
        dhuhr: source.dhuhr !== false,
        asr: source.asr !== false,
        maghrib: source.maghrib !== false,
        isha: source.isha !== false,
    };
}

function normalizePrayerPreferences(prefs: NotificationPreferences): NotificationPreferences {
    const normalizedPrayerNotifications = {
        enabled: prefs.prayer_notifications.enabled,
        lead_minutes: normalizeLeadMinutes(prefs.prayer_notifications.lead_minutes),
        prayers: toPrayerToggleMap(prefs.prayer_notifications.prayers),
    };

    const syncedPrePrayer = {
        ...prefs.pre_prayer_alert,
        offset_minutes: normalizedPrayerNotifications.lead_minutes,
        active_prayers: {
            ...prefs.pre_prayer_alert.active_prayers,
            ...normalizedPrayerNotifications.prayers,
            sunrise: false,
        },
    };

    return {
        ...prefs,
        prayer_notifications: normalizedPrayerNotifications,
        pre_prayer_alert: syncedPrePrayer,
    };
}

const DEFAULT_PREFS: NotificationPreferences = {
    is_enabled: true,
    prayer_notifications: {
        enabled: true,
        lead_minutes: 15,
        prayers: { ...DEFAULT_PRAYER_TOGGLES },
    },
    juma_reminder: {
        enabled: true,
        hour: 11,
        minute: 30,
    },
    pre_prayer_alert: {
        enabled: true,
        offset_minutes: 15,
        sound_type: "azan_short",
        active_prayers: {
            ...DEFAULT_PRAYER_TOGGLES,
            sunrise: false,
        }
    },
    daily_content: {
        enabled: true,
        time: "09:00",
        sound_type: "standard",
        types: ["ayah", "hadith"]
    }
};

export const NotificationStorage = {
    async getPreferences(): Promise<NotificationPreferences> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEY);
            if (!json) return DEFAULT_PREFS;
            const stored = JSON.parse(json);
            const resolvedPrayerNotifications = stored.prayer_notifications || {
                enabled: stored.pre_prayer_alert?.enabled ?? DEFAULT_PREFS.prayer_notifications.enabled,
                lead_minutes: stored.pre_prayer_alert?.offset_minutes ?? DEFAULT_PREFS.prayer_notifications.lead_minutes,
                prayers: {
                    ...DEFAULT_PREFS.prayer_notifications.prayers,
                    ...(stored.pre_prayer_alert?.active_prayers || {}),
                },
            };
            // Deep merge to ensure all fields exist
            return normalizePrayerPreferences({
                ...DEFAULT_PREFS,
                ...stored,
                prayer_notifications: {
                    ...DEFAULT_PREFS.prayer_notifications,
                    ...resolvedPrayerNotifications,
                    prayers: {
                        ...DEFAULT_PREFS.prayer_notifications.prayers,
                        ...resolvedPrayerNotifications.prayers,
                    },
                },
                juma_reminder: {
                    ...DEFAULT_PREFS.juma_reminder,
                    ...stored.juma_reminder
                },
                pre_prayer_alert: {
                    ...DEFAULT_PREFS.pre_prayer_alert,
                    ...stored.pre_prayer_alert,
                    active_prayers: {
                        ...DEFAULT_PREFS.pre_prayer_alert.active_prayers,
                        ...(stored.pre_prayer_alert?.active_prayers || {})
                    }
                },
                daily_content: {
                    ...DEFAULT_PREFS.daily_content,
                    ...stored.daily_content
                }
            });
        } catch (error) {
            console.error('Error loading notification prefs:', error);
            return DEFAULT_PREFS;
        }
    },

    async savePreferences(prefs: Partial<NotificationPreferences>) {
        try {
            const current = await this.getPreferences();
            const prayerNotificationsInput: NotificationPreferences['prayer_notifications'] = prefs.prayer_notifications
                ? {
                    ...current.prayer_notifications,
                    ...prefs.prayer_notifications,
                    lead_minutes: normalizeLeadMinutes(prefs.prayer_notifications.lead_minutes ?? current.prayer_notifications.lead_minutes),
                    prayers: {
                        ...current.prayer_notifications.prayers,
                        ...prefs.prayer_notifications.prayers,
                    },
                }
                : {
                    ...current.prayer_notifications,
                    enabled: prefs.pre_prayer_alert?.enabled ?? current.prayer_notifications.enabled,
                    lead_minutes: normalizeLeadMinutes(
                        prefs.pre_prayer_alert?.offset_minutes ?? current.prayer_notifications.lead_minutes,
                    ),
                    prayers: {
                        ...current.prayer_notifications.prayers,
                        ...(prefs.pre_prayer_alert?.active_prayers || {}),
                    },
                };

            const updated = normalizePrayerPreferences({
                ...current,
                ...prefs,
                prayer_notifications: prayerNotificationsInput,
                juma_reminder: {
                    ...current.juma_reminder,
                    ...prefs.juma_reminder,
                },
                pre_prayer_alert: {
                    ...current.pre_prayer_alert,
                    ...prefs.pre_prayer_alert,
                    active_prayers: {
                        ...current.pre_prayer_alert.active_prayers,
                        ...prefs.pre_prayer_alert?.active_prayers,
                    },
                },
                daily_content: {
                    ...current.daily_content,
                    ...prefs.daily_content,
                },
            });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        } catch (error) {
            console.error('Error saving notification prefs:', error);
        }
    }
};
