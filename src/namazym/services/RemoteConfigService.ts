import AsyncStorage from '@react-native-async-storage/async-storage';
import { RemoteConfig, DEFAULT_CONFIG } from '../config/RemoteConfigTypes';
// import { REMOTE_CONFIG_URL } from '@env'; // If using react-native-dotenv, otherwise process.env or fallback

const CONFIG_STORAGE_KEY = 'namazym_remote_config_v1';
const FALLBACK_URL = 'https://placeholder-config.com/config.json'; // Replace with real URL later

const getRemoteUrl = () => {
    // Return fallback URL directly since .env is not set up
    return FALLBACK_URL;
};

class RemoteConfigService {
    private currentConfig: RemoteConfig = DEFAULT_CONFIG;
    private initialized = false;

    async init(): Promise<void> {
        if (this.initialized) return;

        try {
            const cached = await AsyncStorage.getItem(CONFIG_STORAGE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                // Simple validation: check if version exists
                if (parsed && typeof parsed.contentVersion === 'number') {
                    // Merge with default to ensure new fields are present
                    this.currentConfig = {
                        ...DEFAULT_CONFIG,
                        ...parsed,
                        featureFlags: {
                            home: {
                                cards: {
                                    ...DEFAULT_CONFIG.featureFlags.home.cards,
                                    ...(parsed.featureFlags?.home?.cards || {}),
                                },
                            },
                        },
                    };
                }
            }
        } catch (e) {
            console.warn('Failed to load cached config', e);
        } finally {
            this.initialized = true;
        }
    }

    getConfig(): RemoteConfig {
        return this.currentConfig;
    }

    async fetchConfig(): Promise<boolean> {
        // MD3 Offline Guarantee: Disable all network config fetching
        return false;
    }

    async forceRefresh(): Promise<boolean> {
        return this.fetchConfig();
    }
}

export const remoteConfigService = new RemoteConfigService();
