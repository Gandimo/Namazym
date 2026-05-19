import AsyncStorage from '@react-native-async-storage/async-storage';

export const TASBIH_STORAGE_KEY = 'namaz_tasbih_counts';

export interface TasbihState {
    count: number;
    total: number;
    limit: number;
}

const DEFAULT_STATE: TasbihState = {
    count: 0,
    total: 0,
    limit: 33,
};

function normalizeTasbihState(value: unknown): TasbihState {
    if (!value || typeof value !== 'object') return DEFAULT_STATE;

    const raw = value as Record<string, unknown>;
    const count = typeof raw.count === 'number' ? raw.count : 0;
    const total = typeof raw.total === 'number' ? raw.total : 0;
    const limit = typeof raw.limit === 'number' && raw.limit > 0 ? raw.limit : 33;

    return {
        count: Math.max(0, count),
        total: Math.max(0, total),
        limit,
    };
}

export class TasbihStorageService {
    static async getState(): Promise<TasbihState> {
        try {
            const saved = await AsyncStorage.getItem(TASBIH_STORAGE_KEY);
            if (!saved) return DEFAULT_STATE;
            return normalizeTasbihState(JSON.parse(saved));
        } catch {
            return DEFAULT_STATE;
        }
    }

    static async saveState(state: TasbihState): Promise<void> {
        const normalized = normalizeTasbihState(state);
        await AsyncStorage.setItem(TASBIH_STORAGE_KEY, JSON.stringify(normalized));
    }
}
