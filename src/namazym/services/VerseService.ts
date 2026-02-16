import dailyCards from "../data/daily_cards.json";
import quranAr from "../data/quran_ar.json";

export type DailyContent = {
    dayOfYear: number;
    ayat: {
        surah: number;
        ayah: number;
        text_tm: string;
        reference: string;
        text_ar?: string;
    };
    hadith: {
        text_tm: string;
        source: string;
        number: string;
    };
};

export class VerseService {
    /**
     * Get Turkmenistan Day of Year (UTC+5)
     */
    static getDayOfYear(): number {
        const now = new Date();
        const tkmOffset = 5 * 60; // TKM is UTC+5
        const localOffset = now.getTimezoneOffset(); // in minutes
        const tkmDate = new Date(now.getTime() + (tkmOffset + localOffset) * 60 * 1000);

        const start = new Date(tkmDate.getFullYear(), 0, 0);
        const diff = (tkmDate.getTime() - start.getTime()) + ((start.getTimezoneOffset() - tkmDate.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);
        return day;
    }

    /**
     * Get daily content from daily_cards.json
     */
    static getTodayContent(): DailyContent | null {
        const day = this.getDayOfYear();
        const card = (dailyCards as any).cards.find((c: any) => c.day_of_year === day);

        if (!card) return null;

        // Fetch Arabic text systematically from quran_ar.json
        const arabicSurah = (quranAr as any[]).find(s => s.id === card.ayat.surah);
        const arabicAyah = arabicSurah?.verses.find((v: any) => v.id === card.ayat.ayah);

        return {
            dayOfYear: card.day_of_year,
            ayat: {
                surah: card.ayat.surah,
                ayah: card.ayat.ayah,
                text_tm: card.ayat.text_tm,
                reference: card.ayat.reference,
                text_ar: arabicAyah?.text
            },
            hadith: {
                text_tm: card.hadith.text_tm,
                source: card.hadith.source,
                number: card.hadith.number
            }
        };
    }
}
