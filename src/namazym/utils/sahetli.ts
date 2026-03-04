/**
 * Logic for Sähetli Gün (Auspicious Day) feature.
 */

export interface SahetliResult {
    day: number;
    starPosition: string;
    starPositionId: number;
    status: "bisähet" | "zowalsyz" | "adaty";
    statusLabel: string;
    description: string;
    isManual?: boolean;
}

const STAR_POSITIONS: Record<number, string> = {
    1: "Çep öň burç (Gündogar burç)",
    2: "Öňki diwar (Gabat öň)",
    3: "Sag öň burç",
    4: "Sag gapdal diwar",
    5: "Sag yzky burç",
    6: "Yzky diwar",
    7: "Çep yzky burç",
    8: "Çep gapdal diwar",
    9: "Ýerde",
    10: "Asmanda"
};

export const getHijriDay = (date: Date): number => {
    // fast approx or Intl based
    try {
        // Use Intl to get Islamic day
        const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-civil', {
            day: 'numeric',
        }).formatToParts(date);
        const dayPart = parts.find(p => p.type === 'day');
        return dayPart ? parseInt(dayPart.value, 10) : 1;
    } catch (e) {
        console.warn("Hijri calculation failed, defaulting to 1", e);
        return 1;
    }
};

export const isRamadan = (): boolean => {
    try {
        const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-civil', {
            month: 'numeric',
        }).formatToParts(new Date());
        const monthPart = parts.find(p => p.type === 'month');
        // Ramadan is the 9th month
        return monthPart ? parseInt(monthPart.value, 10) === 9 : false;
    } catch (e) {
        return false;
    }
};

export const calculateSahetliGun = (hijriDay: number): SahetliResult => {
    // Ensure day is 1-30
    const day = Math.max(1, Math.min(30, hijriDay));

    // r = ((day - 1) % 10) + 1
    const r = ((day - 1) % 10) + 1;

    let status: "bisähet" | "zowalsyz" | "adaty" = "adaty";
    let statusLabel = "Adaty gün";
    let description = "Başga günlerde ýyldyz alnyňda bolmasa gelin getirmek bolýar diýilýär.";

    if ([9, 19, 29].includes(day)) {
        status = "bisähet";
        statusLabel = "Iň bisähet gün";
        description = "Türkmen aýynyň 9, 19, 29 günleri ýyldyz ýerde hasaplanýar, bisähet diýilýär.";
    } else if ([10, 20, 30].includes(day)) {
        status = "zowalsyz";
        statusLabel = "Zowalsyz gün";
        description = "Türkmen aýynyň 10, 20, 30 günleri ýyldyz asmanda hasaplanýar, zowalsyz diýilýär.";
    }

    return {
        day,
        starPosition: STAR_POSITIONS[r] || "Belgilenmedik",
        starPositionId: r,
        status,
        statusLabel,
        description
    };
};
