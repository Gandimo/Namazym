import type { PrayerTimeDisplay } from './PrayerTimesAdapter';
import { TimeService } from './TimeService';
import { WidgetBridge } from './WidgetBridge';
import { WidgetDailyVerseService } from './WidgetDailyVerseService';
import { buildWidgetSnapshot, type WidgetSnapshotDayInput } from './WidgetSnapshotService';
import { PrayerEngine } from './prayer/engine';
import { resolveCanonicalPrayerCity } from './prayer/cityResolver';

interface RefreshWidgetParams {
    placeKey: string;
    placeLabel: string;
    prayerTimes?: PrayerTimeDisplay | null;
    now?: Date;
}

/**
 * Days of prayer data written into the widget snapshot BEYOND today.
 * With 6 extra days the widgets keep resolving correct times for a full week
 * even if the app is never opened in between.
 */
const WIDGET_EXTRA_DAYS = 6;

function toDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function buildExtraDays(placeKey: string, now: Date): WidgetSnapshotDayInput[] {
    const canonicalCity = resolveCanonicalPrayerCity(placeKey);
    if (!canonicalCity) {
        return [];
    }

    const extraDays: WidgetSnapshotDayInput[] = [];
    for (let offset = 1; offset <= WIDGET_EXTRA_DAYS; offset += 1) {
        const date = new Date(now);
        date.setDate(date.getDate() + offset);
        const dateISO = toDateISO(date);
        try {
            const times = PrayerEngine.getPrayerTimes(canonicalCity, dateISO);
            extraDays.push({
                dateISO,
                timings: {
                    Fajr: times.fajr,
                    Sunrise: times.sunrise,
                    Dhuhr: times.dhuhr,
                    Asr: times.asr,
                    Maghrib: times.maghrib,
                    Isha: times.isha,
                },
                dailyVerse: WidgetDailyVerseService.getDailyVerse(date),
            });
        } catch {
            // Dataset boundary (e.g. year end) — ship what we have.
            break;
        }
    }
    return extraDays;
}

export const WidgetRefreshService = {
    async refresh({
        placeKey,
        placeLabel,
        prayerTimes,
        now = TimeService.now(),
    }: RefreshWidgetParams): Promise<void> {
        if (!prayerTimes) {
            return;
        }

        try {
            const dailyVerse = WidgetDailyVerseService.getDailyVerse(now);
            const snapshot = buildWidgetSnapshot({
                placeKey,
                placeLabel,
                prayerTimes,
                now,
                dailyVerse,
                extraDays: buildExtraDays(placeKey, now),
            });

            await WidgetBridge.writeSnapshot(JSON.stringify(snapshot));
        } catch (error) {
            console.warn('Widget refresh failed:', error);
        }
    },
};
