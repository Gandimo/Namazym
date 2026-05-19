import type { SupportedCity } from './types';

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
};

export function resolveCanonicalPrayerCity(placeKey: string): SupportedCity | null {
    const normalized = placeKey.trim().toLowerCase();
    return PLACE_KEY_TO_CANONICAL_CITY[normalized] ?? null;
}
