import { TURKMEN_SURAH_NAMES } from '../constants/surahNames';
import { getDailyIndex } from '../utils/localizationUtils';
import type { WidgetDailyVerse } from '../types/widget';
import { DataService } from './DataService';

const WIDGET_VERSE_MAX_LENGTH = 150;

const sanitizeWhitespace = (value: string): string => {
    return value.replace(/\s+/g, ' ').trim();
};

const truncateForWidget = (value: string): string => {
    const text = sanitizeWhitespace(value);

    if (text.length <= WIDGET_VERSE_MAX_LENGTH) {
        return text;
    }

    return `${text.slice(0, WIDGET_VERSE_MAX_LENGTH - 1).trimEnd()}…`;
};

export const WidgetDailyVerseService = {
    getDailyVerse(now: Date): WidgetDailyVerse | undefined {
        const quranData = DataService.getQuran('tk');
        const versesPool: { surah: number; ayah: number; text: string }[] = [];

        if (!quranData?.surahs) {
            return undefined;
        }

        for (const surah of quranData.surahs) {
            if (!surah?.ayahs) {
                continue;
            }

            for (const ayah of surah.ayahs) {
                const text = sanitizeWhitespace(DataService.getVerseText(ayah, 'tk'));

                if (!text) {
                    continue;
                }

                versesPool.push({
                    surah: surah.number,
                    ayah: ayah.number,
                    text,
                });
            }
        }

        if (versesPool.length === 0) {
            return undefined;
        }

        const verse = versesPool[getDailyIndex(now, versesPool.length)];
        const surahName = TURKMEN_SURAH_NAMES[verse.surah - 1] || `Süre ${verse.surah}`;

        return {
            text: truncateForWidget(verse.text),
            reference: `${surahName}, ${verse.ayah}`,
            source: 'Gurhan',
        };
    },
};
