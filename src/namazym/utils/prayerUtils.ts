import { TimeService } from '../services/TimeService';

export interface Prayer {
    key: string;
    label: string;
    time: string;
    dateObj: Date;
}

export const ORDER = [
    { key: 'Fajr', label: 'Ertir' },
    { key: 'Sunrise', label: 'Gün dogmagy' },
    { key: 'Dhuhr', label: 'Öýle' },
    { key: 'Asr', label: 'Ikindi' },
    { key: 'Maghrib', label: 'Agşam' },
    { key: 'Isha', label: 'Ýatsy' },
];

export const getNextPrayer = (now: Date, timings: Record<string, string>): Prayer | null => {
    if (!timings) return null;

    const nowTime = now.getTime();

    for (const item of ORDER) {
        const timeStr = timings[item.key];
        if (!timeStr) continue;

        const [hours, minutes] = timeStr.split(':').map(Number);
        const prayerDate = new Date(now);
        prayerDate.setHours(hours, minutes, 0, 0);

        if (prayerDate.getTime() > nowTime) {
            return {
                ...item,
                time: timeStr,
                dateObj: prayerDate
            };
        }
    }

    // If all passed, return Fajr of next day
    const fajrTimeStr = timings['Fajr'];
    if (fajrTimeStr) {
        const [hours, minutes] = fajrTimeStr.split(':').map(Number);
        const nextFajr = new Date(now);
        nextFajr.setDate(nextFajr.getDate() + 1);
        nextFajr.setHours(hours, minutes, 0, 0);
        return {
            key: 'Fajr',
            label: 'Ertir',
            time: fajrTimeStr,
            dateObj: nextFajr
        };
    }

    return null;
};

export const getCurrentPrayer = (now: Date, timings: Record<string, string>): Prayer | null => {
    if (!timings) return null;

    const nowTime = now.getTime();
    let current: Prayer | null = null;

    for (const item of ORDER) {
        const timeStr = timings[item.key];
        if (!timeStr) continue;

        const [hours, minutes] = timeStr.split(':').map(Number);
        const prayerDate = new Date(now);
        prayerDate.setHours(hours, minutes, 0, 0);

        if (prayerDate.getTime() <= nowTime) {
            current = {
                ...item,
                time: timeStr,
                dateObj: prayerDate
            };
        } else {
            break;
        }
    }

    // If before Fajr, it's technically Isha of previous day, but visually usually just "-" or nothing?
    // Or we show Isha.
    // If current is null, it means we are before Fajr.
    // Should we return Isha of yesterday? 
    // For now return null or handle in UI.
    // Logic: if current is null, then it's technically "Isha" (last prayer) time until Fajr.
    if (!current) {
        const ishaTimeStr = timings['Isha'];
        if (ishaTimeStr) {
            const [hours, minutes] = ishaTimeStr.split(':').map(Number);
            const prevIsha = new Date(now);
            prevIsha.setDate(prevIsha.getDate() - 1);
            prevIsha.setHours(hours, minutes, 0, 0);
            return {
                key: 'Isha',
                label: 'Ýatsy',
                time: ishaTimeStr,
                dateObj: prevIsha
            }
        }
    }

    return current;
};
