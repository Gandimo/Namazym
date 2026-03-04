import { format, utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import { DEMO_MODE } from '../constants/demo';
import { getDemoDateTime } from '../constants/demoData';

// KİLİTLİ TIMEZONE: Türkmenistan
const TIMEZONE = 'Asia/Ashgabat';

export const TimeService = {
    /**
     * Şu anki zamanı Türkmenistan saatine göre döndürür.
     * Cihazın nerede olduğu önemsiz.
     * DEMO_MODE aktifse sabit demo zamanı döndürür.
     */
    now: (): Date => {
        if (DEMO_MODE) {
            return getDemoDateTime();
        }
        return utcToZonedTime(new Date(), TIMEZONE);
    },

    /**
     * Bugünün tarihini YYYY-MM-DD formatında döndürür (Türkmenistan saati).
     */
    getTodayDateString: (): string => {
        if (DEMO_MODE) {
            return format(getDemoDateTime(), 'yyyy-MM-dd', { timeZone: TIMEZONE });
        }
        return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
    },

    /**
     * Yılın kaçıncı günü olduğunu döndürür (1-366) (Türkmenistan saati).
     */
    getDayOfYear: (): number => {
        const now = TimeService.now();
        const start = utcToZonedTime(new Date(Date.UTC(now.getFullYear(), 0, 1, 0, 0, 0)), TIMEZONE);
        const diff = now.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay) + 1;
    },

    /**
     * Verilen saatin (HH:MM) şu an geçip geçmediğini kontrol eder (Türkmenistan saati).
     */
    isTimePassed: (timeStr: string): boolean => {
        const now = TimeService.now();
        const [hours, minutes] = timeStr.split(':').map(Number);

        // Compare only hours/minutes
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();

        if (currentHours > hours) return true;
        if (currentHours === hours && currentMinutes >= minutes) return true;
        return false;
    }
};
