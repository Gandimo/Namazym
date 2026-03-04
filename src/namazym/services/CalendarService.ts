export interface HijriDate {
    day: number;
    month: number;
    year: number;
    monthName: string;
}

const HIJRI_MONTHS = [
    "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani",
    "Jumada al-ula", "Jumada al-akhira", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

const TKM_MONTHS = [
    "Muharrem", "Sefer", "Rebiýelewwel", "Rebiýelähyr",
    "Jumada-ul-ula", "Jumada-ul-ahyr", "Rejep", "Şaban",
    "Remezan", "Şewwal", "Zülkada", "Zülhijje"
];

import specialDaysData from "../data/special_days.json";

export class CalendarService {
    /**
     * Mathematical Hijri conversion (Kuwaiti algorithm/Civil Hijri)
     */
    static getTodayHijri(): HijriDate {
        const date = new Date();
        // Adjust for Ashgabat time (UTC+5)
        const tkmOffset = 5 * 60;
        const localOffset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() + (tkmOffset + localOffset) * 60 * 1000);

        let jd = Math.floor(adjustedDate.getTime() / 86400000) + 2440588;

        let l = jd - 1948440 + 10632;
        let n = Math.floor((l - 1) / 10631);
        l = l - 10631 * n + 354;
        let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
        l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;

        let month = Math.floor((24 * l) / 709);
        let day = l - Math.floor((709 * month) / 24);
        let year = 30 * n + j - 30;

        // One day adjustment usually required for TKM/Muftiyat
        // For 2026, we might need a dynamic offset
        const adjustment = -1;
        day += adjustment;

        if (day < 1) {
            month--;
            if (month < 1) {
                month = 12;
                year--;
            }
            day = 30; // Approximation
        }

        return {
            day,
            month,
            year,
            monthName: TKM_MONTHS[month - 1] || HIJRI_MONTHS[month - 1]
        };
    }

    /**
     * Get special Turkmenistan religious day for given date
     * @param dateStr YYYY-MM-DD
     */
    static getSpecialDay(dateStr: string): string | null {
        const year = dateStr.split("-")[0];
        const yearData = (specialDaysData as any)[year];
        if (!yearData) return null;

        const day = yearData.special_days?.find((d: any) => d.date === dateStr);
        return day ? day.name_tm : null;
    }
}
