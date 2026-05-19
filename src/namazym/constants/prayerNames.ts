export const TURKMEN_PRAYER_NAMES = {
    Fajr: 'Ertir namazy',
    Sunrise: 'Gün dogmagy',
    Dhuhr: 'Öýle namazy',
    Asr: 'Ikindi namazy',
    Maghrib: 'Agşam namazy',
    Isha: 'Ýatsy namazy',
    Witr: 'Witir namazy',
} as const;

export const TURKMEN_PRAYER_NAME_MAP = {
    fajr: TURKMEN_PRAYER_NAMES.Fajr,
    sunrise: TURKMEN_PRAYER_NAMES.Sunrise,
    dhuhr: TURKMEN_PRAYER_NAMES.Dhuhr,
    asr: TURKMEN_PRAYER_NAMES.Asr,
    maghrib: TURKMEN_PRAYER_NAMES.Maghrib,
    isha: TURKMEN_PRAYER_NAMES.Isha,
    witr: TURKMEN_PRAYER_NAMES.Witr,
} as const;

export type CanonicalPrayerKey = keyof typeof TURKMEN_PRAYER_NAMES;

export const DAILY_PRAYER_KEYS: CanonicalPrayerKey[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
export const KAZA_PRAYER_KEYS: CanonicalPrayerKey[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'];

export function getTurkmenPrayerName(prayerKey: string): string {
    return TURKMEN_PRAYER_NAMES[prayerKey as CanonicalPrayerKey] || prayerKey;
}

export function getPrayerTimeLabel(prayerKey: string): string {
    const name = getTurkmenPrayerName(prayerKey);
    if (prayerKey === 'Sunrise') {
        return name;
    }
    return `${name}nyň wagty`;
}
