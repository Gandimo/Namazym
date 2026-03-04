import AsyncStorage from '@react-native-async-storage/async-storage';

const PLACE_KEY = 'selected_place_key';
const PLACE_LABEL = 'selected_place_label';

export class StorageService {
    static async setPlaceKey(key: string): Promise<void> {
        await AsyncStorage.setItem(PLACE_KEY, key);
    }

    static async getPlaceKey(): Promise<string | null> {
        return await AsyncStorage.getItem(PLACE_KEY);
    }

    static async setPlaceLabel(label: string): Promise<void> {
        await AsyncStorage.setItem(PLACE_LABEL, label);
    }

    static async getPlaceLabel(): Promise<string | null> {
        return await AsyncStorage.getItem(PLACE_LABEL);
    }

    static async setOnboardingCompleted(completed: boolean): Promise<void> {
        await AsyncStorage.setItem('onboarding_completed', completed ? 'true' : 'false');
    }

    static async getOnboardingCompleted(): Promise<boolean> {
        const value = await AsyncStorage.getItem('onboarding_completed');
        return value === 'true';
    }
}
