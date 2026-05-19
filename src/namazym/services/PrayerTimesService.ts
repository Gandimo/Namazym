import { CITIES } from "../constants/cities";
import { PrayerTimeDisplay } from "./PrayerTimesAdapter";
import { TimeService } from "./TimeService";
import { OfflinePrayerEngine } from "./prayer/offlinePrayerEngine";
import type { SupportedCity } from "./prayer/types";
import { resolveCanonicalPrayerCity } from "./prayer/cityResolver";

export class PrayerTimesService {
    static resolveCanonicalCity(placeKey: string): SupportedCity | null {
        return resolveCanonicalPrayerCity(placeKey);
    }

    static getPrayerTimes(dateISO: string, placeKey: string): PrayerTimeDisplay | null {
        try {
            const canonicalCity = this.resolveCanonicalCity(placeKey);
            if (!canonicalCity) {
                return null;
            }

            const result = OfflinePrayerEngine.getPrayerTimes(canonicalCity, dateISO);
            if (!result.ok || !result.data) {
                return null;
            }
            const canonicalTimes = result.data;

            const place = CITIES.find((item) => item.key === placeKey)
                || CITIES.find((item) => item.key === 'asgabat_arkadag_ahal')
                || CITIES[0];

            return {
                city_id: place.cityId,
                date: dateISO,
                timings: {
                    Fajr: canonicalTimes.fajr,
                    Sunrise: canonicalTimes.sunrise,
                    Dhuhr: canonicalTimes.dhuhr,
                    Asr: canonicalTimes.asr,
                    Maghrib: canonicalTimes.maghrib,
                    Isha: canonicalTimes.isha,
                },
                method: "Authoritative",
                school: "Hanafi",
                source: `${canonicalCity} canonical dataset`
            };
        } catch (e) {
            console.error("PrayerTimesService.getPrayerTimes Error:", e);
            return null;
        }
    }

    static getToday(placeKey: string): PrayerTimeDisplay | null {
        return this.getPrayerTimes(TimeService.getTodayDateString(), placeKey);
    }
}
