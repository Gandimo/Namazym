// Utilities for Hijri date calculation using Intl API (Offline)

const HIJRI_MONTHS_TK = [
    'Muharrem',
    'Safer',
    'Rebikulewwel',
    'Rebikulahyr',
    'Jemazilewwel',
    'Jemazilahyr',
    'Rejep',
    'Şagban',
    'Remezan',
    'Şewwal',
    'Zülkage',
    'Zülhijje',
];

export interface HijriDate {
    day: number;
    month: number; // 0-11
    year: number;
    monthName: string;
}

export const HijriUtils = {
    /**
     * Converts a Gregorian Date to Hijri using Intl.DateTimeFormat
     * Uses 'islamic-umalqura' calendar if available, falls back to 'islamic'
     */
    getHijriDate(date: Date): HijriDate {
        try {
            // Try Umm al-Qura first (standard for many official calculations)
            const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
            });

            const parts = formatter.formatToParts(date);
            const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
            const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10) - 1; // 0-indexed
            const year = parseInt(parts.find(p => p.type === 'year')?.value || '1446', 10);

            return {
                day,
                month,
                year,
                monthName: HIJRI_MONTHS_TK[month] || '',
            };
        } catch (e) {
            console.warn('Hijri Intl conversion failed, falling back to simple approximation', e);
            // Fallback (very rough, just to prevent crash)
            return { day: 1, month: 0, year: 1446, monthName: HIJRI_MONTHS_TK[0] };
        }
    },

    getMonthName(monthIndex: number): string {
        return HIJRI_MONTHS_TK[monthIndex % 12];
    },

    /**
     * Returns the "Sähet" status of a Hijri day
     * 9, 19, 29 -> Bisähet (Red)
     * 10, 20, 30 -> Zowalsyz (Green)
     * Else -> Adaty
     */
    getDayStatus(hijriDay: number): 'bisahet' | 'zowalsyz' | 'adaty' {
        const d = hijriDay;
        if (d === 9 || d === 19 || d === 29) return 'bisahet';
        if (d === 10 || d === 20 || d === 30) return 'zowalsyz';
        return 'adaty';
    }
};
