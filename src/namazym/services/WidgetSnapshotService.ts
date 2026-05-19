import type { PrayerTimeDisplay } from './PrayerTimesAdapter';
import { getCurrentPrayer, getNextPrayer } from '../utils/prayerUtils';
import type {
    NamazymWidgetSnapshotV1,
    PrayerWidgetKey,
    WidgetPrayerSummary,
    WidgetPrayerTime,
    WidgetVisualMood,
} from '../types/widget';

interface BuildWidgetSnapshotParams {
    placeKey: string;
    placeLabel: string;
    prayerTimes: PrayerTimeDisplay;
    now: Date;
}

const PRAYER_WIDGET_ORDER: PrayerWidgetKey[] = [
    'Fajr',
    'Sunrise',
    'Dhuhr',
    'Asr',
    'Maghrib',
    'Isha',
];

const WIDGET_PRAYER_LABELS: Record<PrayerWidgetKey, string> = {
    Fajr: 'Ertir',
    Sunrise: 'Gün',
    Dhuhr: 'Öýle',
    Asr: 'Ikindi',
    Maghrib: 'Agşam',
    Isha: 'Ýassy',
};

const VISUAL_MOODS: Record<PrayerWidgetKey, WidgetVisualMood> = {
    Fajr: {
        key: 'Fajr',
        accentColor: '#C88A32',
        backgroundColor: '#F7EFE2',
    },
    Sunrise: {
        key: 'Sunrise',
        accentColor: '#E3A23A',
        backgroundColor: '#FFF3D7',
    },
    Dhuhr: {
        key: 'Dhuhr',
        accentColor: '#4F9D8F',
        backgroundColor: '#EAF7F3',
    },
    Asr: {
        key: 'Asr',
        accentColor: '#C47A3C',
        backgroundColor: '#F4E7D4',
    },
    Maghrib: {
        key: 'Maghrib',
        accentColor: '#B85842',
        backgroundColor: '#F6E1D7',
    },
    Isha: {
        key: 'Isha',
        accentColor: '#5665A8',
        backgroundColor: '#E9EBF7',
    },
};

const isPrayerWidgetKey = (key: string | undefined): key is PrayerWidgetKey => {
    return PRAYER_WIDGET_ORDER.includes(key as PrayerWidgetKey);
};

const getTimezone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
};

const getPrayerDate = (dateISO: string, time: string): Date => {
    const [year, month, day] = dateISO.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const toPrayerSummary = (
    prayer: { key: string; time: string; dateObj?: Date } | null,
): WidgetPrayerSummary | null => {
    if (!prayer || !isPrayerWidgetKey(prayer.key)) {
        return null;
    }

    return {
        key: prayer.key,
        label: WIDGET_PRAYER_LABELS[prayer.key],
        time: prayer.time,
        timestampISO: prayer.dateObj?.toISOString(),
    };
};

export const formatRemainingDisplay = (totalMinutes: number): string => {
    const safeMinutes = Math.max(0, Math.floor(totalMinutes));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;

    if (hours <= 0) {
        return `${minutes} min galdy`;
    }

    if (minutes <= 0) {
        return `${hours} sag galdy`;
    }

    return `${hours} sag ${minutes} min galdy`;
};

export const getWidgetVisualMood = (key: PrayerWidgetKey | null | undefined): WidgetVisualMood => {
    return VISUAL_MOODS[key ?? 'Fajr'] ?? VISUAL_MOODS.Fajr;
};

export const buildWidgetSnapshot = ({
    placeKey,
    placeLabel,
    prayerTimes,
    now,
}: BuildWidgetSnapshotParams): NamazymWidgetSnapshotV1 => {
    const timings = prayerTimes.timings as Record<string, string>;
    const current = getCurrentPrayer(now, timings);
    const next = getNextPrayer(now, timings);
    const currentPrayer = toPrayerSummary(current);
    const nextPrayer = toPrayerSummary(next);
    const moodKey = currentPrayer?.key ?? nextPrayer?.key ?? 'Fajr';

    const prayers: WidgetPrayerTime[] = PRAYER_WIDGET_ORDER.map((key) => {
        const time = prayerTimes.timings[key];
        return {
            key,
            label: WIDGET_PRAYER_LABELS[key],
            time,
            timestampISO: getPrayerDate(prayerTimes.date, time).toISOString(),
        };
    });

    const totalMinutes = next
        ? Math.max(0, Math.floor((next.dateObj.getTime() - now.getTime()) / 60000))
        : null;

    return {
        schemaVersion: 1,
        generatedAtISO: now.toISOString(),
        localDateISO: prayerTimes.date,
        timezone: getTimezone(),
        city: {
            key: placeKey,
            name: placeLabel,
        },
        prayers,
        currentPrayer,
        nextPrayer,
        remaining: totalMinutes === null
            ? null
            : {
                totalMinutes,
                display: formatRemainingDisplay(totalMinutes),
            },
        visualMood: getWidgetVisualMood(moodKey),
    };
};
