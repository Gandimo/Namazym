import type { PrayerTimeDisplay } from './PrayerTimesAdapter';
import { TimeService } from './TimeService';
import { WidgetBridge } from './WidgetBridge';
import { buildWidgetSnapshot } from './WidgetSnapshotService';

interface RefreshWidgetParams {
    placeKey: string;
    placeLabel: string;
    prayerTimes?: PrayerTimeDisplay | null;
    now?: Date;
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
            const snapshot = buildWidgetSnapshot({
                placeKey,
                placeLabel,
                prayerTimes,
                now,
            });

            await WidgetBridge.writeSnapshot(JSON.stringify(snapshot));
        } catch (error) {
            console.warn('Widget refresh failed:', error);
        }
    },
};
