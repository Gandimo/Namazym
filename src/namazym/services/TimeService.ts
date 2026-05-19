import { format } from 'date-fns-tz';
import { DEMO_MODE } from '../constants/demo';
import { getDemoDateTime } from '../constants/demoData';

export const TimeService = {
    /**
     * Returns the current device wall-clock time.
     * Prayer timetable values are local HH:MM values, so current/next comparisons
     * must use the same visible wall-clock that the user is testing in Expo Go.
     * DEMO_MODE aktifse sabit demo zamanı döndürür.
     */
    now: (): Date => {
        if (DEMO_MODE) {
            return getDemoDateTime();
        }
        return new Date();
    },

    /**
     * Bugünün tarihini YYYY-MM-DD formatında döndürür.
     */
    getTodayDateString: (): string => {
        if (DEMO_MODE) {
            return format(getDemoDateTime(), 'yyyy-MM-dd');
        }
        return format(new Date(), 'yyyy-MM-dd');
    },

    /**
     * Yılın kaçıncı günü olduğunu döndürür (1-366).
     */
    getDayOfYear: (): number => {
        const now = TimeService.now();
        const start = new Date(now.getFullYear(), 0, 1);
        const diff = now.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay) + 1;
    },

    /**
     * Verilen saatin (HH:MM) şu an geçip geçmediğini kontrol eder.
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
