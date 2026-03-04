import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes, Madhab } from 'adhan';
import { PrayerTimeDisplay } from './PrayerTimesAdapter';

export class AdhanService {
    /**
     * Calculates prayer times using adhan.js for non-TKM locations.
     */
    static calculatePrayerTimes(
        latitude: number,
        longitude: number,
        date: Date,
        calculationMethod: string = 'Turkey'
    ): PrayerTimeDisplay {
        const coords = new Coordinates(latitude, longitude);

        let params;
        switch (calculationMethod) {
            case 'Turkey':
                params = CalculationMethod.Turkey();
                break;
            case 'Russia':
                params = CalculationMethod.MoonsightingCommittee(); // Often used in RU
                break;
            case 'France':
                params = CalculationMethod.MuslimWorldLeague();
                break;
            case 'NorthAmerica':
                params = CalculationMethod.NorthAmerica();
                break;
            default:
                params = CalculationMethod.MuslimWorldLeague();
        }

        params.madhab = Madhab.Hanafi;

        const prayerTimes = new PrayerTimes(coords, date, params);
        const sunnahTimes = new SunnahTimes(prayerTimes);

        const formatTime = (date: Date) => {
            return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        };

        return {
            city_id: 0, // Dynamic GPS
            date: date.toISOString().split('T')[0],
            timings: {
                Fajr: formatTime(prayerTimes.fajr),
                Sunrise: formatTime(prayerTimes.sunrise),
                Dhuhr: formatTime(prayerTimes.dhuhr),
                Asr: formatTime(prayerTimes.asr),
                Maghrib: formatTime(prayerTimes.maghrib),
                Isha: formatTime(prayerTimes.isha)
            },
            method: calculationMethod,
            school: "Hanafi",
            source: "adhan.js"
        };
    }
}
