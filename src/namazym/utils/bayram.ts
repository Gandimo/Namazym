import holidaysData from '../../data/islamic_holidays/tm_islamic_holidays.json';

export interface Holiday {
    day: number;
    month_short: string;
    title: string;
    hijri: string;
    relative: string;
}

export interface HolidayMonth {
    month: string;
    items: Holiday[];
}

export interface HolidayYear {
    year: number;
    months: HolidayMonth[];
}

export interface HolidaysDataset {
    title: string;
    subtitle: string;
    years: HolidayYear[];
}

const MONTH_SHORT_MAP = [
    'Ýan', 'Few', 'Mart', 'Apr', 'Maý', 'Iýun',
    'Iýul', 'Awg', 'Sen', 'Okt', 'Noý', 'Dek'
];

export const BayramUtils = {
    /**
     * Returns the list of holidays for a specific year from the dataset.
     * Returns empty list if no data for that year.
     */
    getHolidays(year: number): HolidayMonth[] {
        const data = holidaysData as HolidaysDataset;
        return data.years.find((entry) => entry.year === year)?.months || [];
    },

    /**
     * Checks if the given date matches any holiday in the dataset.
     * Returns the Holiday object or null.
     */
    checkBayram(date: Date): Holiday | null {
        const targetYear = date.getFullYear();
        const targetDay = date.getDate();
        const shortMonth = MONTH_SHORT_MAP[date.getMonth()];

        const holidays = this.getHolidays(targetYear);
        for (const month of holidays) {
            const match = month.items.find(
                (item) =>
                    item.day === targetDay &&
                    item.month_short === shortMonth
            );

            if (match) return match;
        }

        return null;
    },

    /**
     * Returns parsed countdown value from the canonical relative text.
     * Positive = future, negative = past.
     */
    getDaysRemaining(relativeText: string): number {
        if (relativeText.includes('galdy')) {
            return Number(relativeText.replace(/\D/g, '')) || 0;
        }

        if (relativeText.includes('öň')) {
            return -(Number(relativeText.replace(/\D/g, '')) || 0);
        }

        return 0;
    }
};
