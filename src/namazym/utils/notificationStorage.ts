import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPreferences {
    is_enabled: boolean;
    pre_prayer_alert: {
        enabled: boolean;
        offset_minutes: number;
        sound_type: 'azan_short' | 'standard' | 'silent';
        active_prayers: {
            fajr: boolean;
            sunrise: boolean;
            dhuhr: boolean;
            asr: boolean;
            maghrib: boolean;
            isha: boolean;
        };
    };
    daily_content: {
        enabled: boolean;
        time: string;
        sound_type: 'standard' | 'silent';
        types: ("ayah" | "hadith")[];
    };
}

const STORAGE_KEY = '@namazym_notifications';

const DEFAULT_PREFS: NotificationPreferences = {
    is_enabled: true,
    pre_prayer_alert: {
        enabled: true,
        offset_minutes: 15,
        sound_type: "azan_short",
        active_prayers: {
            fajr: true,
            sunrise: false,
            dhuhr: true,
            asr: true,
            maghrib: true,
            isha: true
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
            // Deep merge to ensure all fields exist
            return {
                ...DEFAULT_PREFS,
                ...stored,
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
            };
        } catch (error) {
            console.error('Error loading notification prefs:', error);
            return DEFAULT_PREFS;
        }
    },

    async savePreferences(prefs: Partial<NotificationPreferences>) {
        try {
            const current = await this.getPreferences();
            const updated = { ...current, ...prefs };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        } catch (error) {
            console.error('Error saving notification prefs:', error);
        }
    }
};
