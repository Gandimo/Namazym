import * as Notifications from 'expo-notifications';
import { getTurkmenPrayerName } from '../../constants/prayerNames';
import { PrayerEngine } from '../prayer/engine';
import type { SupportedCity } from '../prayer/types';
import { PrayerNotificationStorage } from './prayerNotificationStorage';
import type { PrayerName, PrayerNotificationSettings, PrayerRebuildReport } from './prayerNotificationTypes';

type SoundType = 'azan_short' | 'standard' | 'silent';

const PRAYER_ORDER: Array<{ key: PrayerName; datasetKey: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; labelKey: 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha' }> = [
    { key: 'fajr', datasetKey: 'fajr', labelKey: 'Fajr' },
    { key: 'dhuhr', datasetKey: 'dhuhr', labelKey: 'Dhuhr' },
    { key: 'asr', datasetKey: 'asr', labelKey: 'Asr' },
    { key: 'maghrib', datasetKey: 'maghrib', labelKey: 'Maghrib' },
    { key: 'isha', datasetKey: 'isha', labelKey: 'Isha' },
];

function buildPerPrayerCounters(): PrayerRebuildReport['perPrayer'] {
    return {
        fajr: { today: 0, tomorrow: 0, skipped: 0 },
        dhuhr: { today: 0, tomorrow: 0, skipped: 0 },
        asr: { today: 0, tomorrow: 0, skipped: 0 },
        maghrib: { today: 0, tomorrow: 0, skipped: 0 },
        isha: { today: 0, tomorrow: 0, skipped: 0 },
    };
}

function toDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseTimeForDate(date: Date, hhmm: string): Date {
    const [hours, minutes] = hhmm.split(':').map(Number);
    const scheduleDate = new Date(date);
    scheduleDate.setHours(hours, minutes, 0, 0);
    return scheduleDate;
}

export async function cancelTrackedPrayerNotifications(): Promise<number> {
    const trackedIds = await PrayerNotificationStorage.getScheduledIds();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const discoveredIds = scheduled
        .filter((request) => request.content.data?.type === 'prayer')
        .map((request) => request.identifier);
    const idsToCancel = Array.from(new Set([...trackedIds, ...discoveredIds]));

    if (idsToCancel.length === 0) {
        return 0;
    }

    await Promise.allSettled(
        idsToCancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
    );
    await PrayerNotificationStorage.clearScheduledIds();
    return idsToCancel.length;
}

export async function scheduleCanonicalPrayerNotifications(input: {
    city: SupportedCity;
    placeKey: string;
    settings: PrayerNotificationSettings;
    soundType: SoundType;
    now?: Date;
}): Promise<PrayerRebuildReport> {
    const now = input.now ?? new Date();
    const todayDate = new Date(now);
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const todayISO = toDateISO(todayDate);
    const tomorrowISO = toDateISO(tomorrowDate);

    const report: PrayerRebuildReport = {
        city: input.city,
        placeKey: input.placeKey,
        today: todayISO,
        scheduledToday: 0,
        scheduledTomorrow: 0,
        cancelledPrevious: 0,
        skippedPast: 0,
        permissionStatus: 'granted',
        result: 'success',
        errors: [],
        perPrayer: buildPerPrayerCounters(),
    };

    report.cancelledPrevious = await cancelTrackedPrayerNotifications();

    if (!input.settings.enabled) {
        report.result = 'disabled';
        await PrayerNotificationStorage.clearScheduleMeta();
        return report;
    }

    const scheduledIds: string[] = [];
    const channelId = input.soundType === 'azan_short' ? 'azan_channel' : 'default_content';
    const sound: string | boolean = input.soundType === 'silent'
        ? false
        : (input.soundType === 'azan_short' ? 'namaz_chime.wav' : true);

    const targets = [
        { dateObj: todayDate, dateISO: todayISO, bucket: 'today' as const },
        { dateObj: tomorrowDate, dateISO: tomorrowISO, bucket: 'tomorrow' as const },
    ];

    for (const target of targets) {
        let times: Awaited<ReturnType<typeof PrayerEngine.getPrayerTimes>>;
        try {
            times = PrayerEngine.getPrayerTimes(input.city, target.dateISO);
        } catch (error) {
            report.errors.push(
                `[${target.dateISO}] ${(error as Error)?.message || String(error)}`,
            );
            continue;
        }

        for (const prayer of PRAYER_ORDER) {
            if (!input.settings.prayers[prayer.key]) continue;

            const prayerTime = times[prayer.datasetKey];
            const scheduledFor = parseTimeForDate(target.dateObj, prayerTime);
            scheduledFor.setMinutes(scheduledFor.getMinutes() - input.settings.leadMinutes);

            if (scheduledFor <= now) {
                report.skippedPast += 1;
                report.perPrayer[prayer.key].skipped += 1;
                continue;
            }

            const localizedName = getTurkmenPrayerName(prayer.labelKey);
            const body = input.settings.leadMinutes > 0
                ? `${localizedName} namazyna ${input.settings.leadMinutes} minut galdy.`
                : `${localizedName} namazynyň wagty boldy.`;

            const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `🕌 ${localizedName}`,
                    body,
                    data: {
                        type: 'prayer',
                        prayer: prayer.key,
                        city: input.city,
                        date: target.dateISO,
                        leadMinutes: input.settings.leadMinutes,
                    },
                    sound,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: scheduledFor,
                    channelId,
                } as any,
            });

            scheduledIds.push(identifier);
            if (target.bucket === 'today') {
                report.scheduledToday += 1;
                report.perPrayer[prayer.key].today += 1;
            } else {
                report.scheduledTomorrow += 1;
                report.perPrayer[prayer.key].tomorrow += 1;
            }
        }
    }

    if (scheduledIds.length > 0) {
        await PrayerNotificationStorage.saveScheduledIds(scheduledIds);
        await PrayerNotificationStorage.saveScheduleMeta({
            city: input.city,
            placeKey: input.placeKey,
            scheduledForDates: [todayISO, tomorrowISO],
            rebuiltAt: new Date().toISOString(),
            leadMinutes: input.settings.leadMinutes,
        });
    } else {
        await PrayerNotificationStorage.clearScheduledIds();
        await PrayerNotificationStorage.clearScheduleMeta();
    }

    if (report.errors.length > 0 && (report.scheduledToday + report.scheduledTomorrow) > 0) {
        report.result = 'partial_failure';
    } else if (report.errors.length > 0) {
        report.result = 'missing_dataset';
    }

    return report;
}
