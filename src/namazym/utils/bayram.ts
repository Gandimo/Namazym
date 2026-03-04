import holidaysData from '../../data/islamic_holidays/tm_islamic_holidays.json';

export interface Holiday {
    id: string;
    title: string;
    date_gregorian: string;
    date_hijri: string;
}

export const BayramUtils = {
    /**
     * Returns the list of holidays for a specific year from the dataset.
     * Returns empty list if no data for that year.
     */
    getHolidays(year: number): Holiday[] {
        const y = String(year);
        // @ts-ignore - Importing JSON directly
        return (holidaysData.years as any)[y] || [];
    },

    /**
     * Checks if the given date matches any holiday in the dataset.
     * Returns the Holiday object or null.
     */
    checkBayram(date: Date): Holiday | null {
        // Format date to YYYY-MM-DD to match dataset
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dateString = `${yyyy}-${mm}-${dd}`;

        const holidays = this.getHolidays(yyyy);
        return holidays.find(h => h.date_gregorian === dateString) || null;
    },

    /**
     * Calculates days remaining until the holiday.
     * Returns 0 if today, negative if passed.
     */
    getDaysRemaining(holidayDateStr: string): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const target = new Date(holidayDateStr);
        target.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
};
