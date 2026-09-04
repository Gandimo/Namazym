import type { SupportedCity } from './types';
import { REGION_PLACE_KEYS } from '../../data/prayer/regions';

const PLACE_KEY_TO_CANONICAL_CITY: Record<string, SupportedCity> = {
    asgabat_arkadag_ahal: 'ashgabat',
    asgabat: 'ashgabat',
    ashgabat: 'ashgabat',
    ahal: 'ahal',
    arkadag: 'arkadag',
    mary: 'mary',
    lebap: 'lebap',
    balkan: 'balkan',
    dasoguz: 'dashoguz',
    dashoguz: 'dashoguz',
    // Bölge (etrap) anahtarları kendi veri setlerine birebir çözülür.
    ...Object.fromEntries(REGION_PLACE_KEYS.map((key) => [key, key])),
};

export function resolveCanonicalPrayerCity(placeKey: string): SupportedCity | null {
    const normalized = placeKey.trim().toLowerCase();
    return PLACE_KEY_TO_CANONICAL_CITY[normalized] ?? null;
}
