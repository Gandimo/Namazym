import AsyncStorage from '@react-native-async-storage/async-storage';

export type TesbihMode = 'continue' | 'reset';

export interface TesbihState {
    count: number;
    target: number;
    mode: TesbihMode;
    soundEnabled: boolean;
    hapticEnabled: boolean;
    ambientEnabled?: boolean; // New in Phase 2
    totalCount: number;
    cycles: number;
}

const STORAGE_KEY = 'namazym_tesbih_state_v2';

const DEFAULT_STATE: TesbihState = {
    count: 0,
    target: 33,
    mode: 'reset',
    soundEnabled: false,
    hapticEnabled: true,
    ambientEnabled: false,
    totalCount: 0,
    cycles: 0,
};

export const TesbihStorage = {
    async getState(): Promise<TesbihState> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEY);
            if (!json) return DEFAULT_STATE;
            const state = JSON.parse(json);
            return { ...DEFAULT_STATE, ...state }; // Merge to ensure new fields exist
        } catch (error) {
            console.error('Error loading tesbih state:', error);
            return DEFAULT_STATE;
        }
    },

    async saveState(state: Partial<TesbihState>) {
        try {
            const current = await this.getState();
            const start = { ...current, ...state };
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(start));
        } catch (error) {
            console.error('Error saving tesbih state:', error);
        }
    },

    async reset() {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error resetting tesbih state:', error);
        }
    }
};
