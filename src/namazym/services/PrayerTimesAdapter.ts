import prayerTimesCache from '../data/prayer_times_cache.json';
import { TimeService } from './TimeService';
import { DEMO_MODE } from '../constants/demo';
import { DEMO_CITY_ID, DEMO_DATE } from '../constants/demoData';

// UI MODEL Interface
export interface PrayerTimeDisplay {
    city_id: number;
    date: string;
    timings: {
        Fajr: string;
        Sunrise: string;
        Dhuhr: string;
        Asr: string;
        Maghrib: string;
        Isha: string;
    };
    method: string;
    school: string;
    source: string;
}

// Raw Data Interface (from prayer_times_cache.json)
interface RawPrayerTimeEntry {
    city_id: number;
    date: string;
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
}

export const PrayerTimesAdapter = {
    /**
     * Belirtilen şehir ve tarih için namaz vakitlerini UI modeline çevirir.
     * @param cityId Şehir ID (1-6)
     * @param dateStr YYYY-MM-DD (Opsiyonel, verilmezse bugün)
     */
    getPrayerTimes: (cityId: number, dateStr?: string): PrayerTimeDisplay | null => {
        const targetDate = dateStr || TimeService.getTodayDateString();

        // Cache içinden bul
        const entry = (prayerTimesCache.prepacked as RawPrayerTimeEntry[]).find(
            (item) => item.city_id === cityId && item.date === targetDate
        );

        if (!entry) return null;

        // UI Modeline Çevir (MAPPING)
        return {
            city_id: entry.city_id,
            date: entry.date,
            timings: {
                Fajr: entry.fajr,
                Sunrise: entry.sunrise,
                Dhuhr: entry.dhuhr,
                Asr: entry.asr,
                Maghrib: entry.maghrib,
                Isha: entry.isha
            },
            method: "MWL",
            school: "Hanafi",
            source: "AlAdhan"
        };
    },

    /**
     * Bugünün namaz vakitlerini getirir (Helper)
     * DEMO_MODE aktifse sabit demo şehir ve tarih kullanır.
     */
    getToday: (cityId: number): PrayerTimeDisplay | null => {
        if (DEMO_MODE) {
            return PrayerTimesAdapter.getPrayerTimes(DEMO_CITY_ID, DEMO_DATE);
        }
        return PrayerTimesAdapter.getPrayerTimes(cityId);
    }
};
