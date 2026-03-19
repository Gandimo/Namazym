import globalVakitler from "../data/global_vakitler_v3.json";
import { CITIES } from "../constants/cities";
import { PrayerTimeDisplay } from "./PrayerTimesAdapter";
import { TimeService } from "./TimeService";

export class PrayerTimesService {
    /**
     * Retrieves prayer times from the master JSON (v3.0 - Compact)
     * Auto-selects the year and region based on parameters.
     */
    static getPrayerTimes(dateISO: string, placeKey: string): PrayerTimeDisplay | null {
        try {
            const currentYear = dateISO.split('-')[0];
            const yearData = (globalVakitler.years as any)[currentYear];

            if (!yearData) return null;

            const regionData = yearData.regions[placeKey];
            if (!regionData || !regionData.days) return null;

            // Lookup specific day in the array (dt = date)
            const dayData = regionData.days.find((d: any) => d.dt === dateISO);
            if (!dayData) return null;

            const place = CITIES.find(p => p.key === placeKey) || CITIES[0];

            // f=Fajr, e=Ertir, o=Oyle, i=Ikindi, a=Agzacar, y=Yassy, ir=is_ramadan
            return {
                city_id: place.cityId,
                date: dateISO,
                timings: {
                    Fajr: dayData.f || "00:00",
                    Sunrise: dayData.e || "00:00",
                    Dhuhr: dayData.o || "00:00",
                    Asr: dayData.i || "00:00",
                    Maghrib: dayData.a || "00:00",
                    Isha: dayData.y || "00:00"
                },
                ir: dayData.ir || false,
                method: "Authoritative",
                school: "Hanafi",
                source: "Official TKM"
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
