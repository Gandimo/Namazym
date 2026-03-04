import dailyCards from "../data/daily_cards.json";
import quranAR from "../data/quran_ar_full.json";
import quranTM from "../data/quran_tm_full.json";

export type DailyContent = {
    dayOfYear: number;
    ayat: {
        surah: number;
        ayah: number;
        text_tm: string;
        reference: string;
        text_ar: string;
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
     * Verse counts for all 114 Surahs (1-114)
     */
    private static SURAH_VERSE_COUNTS = [
        7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
        112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53,
        89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12,
        12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26,
        30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
    ];

    /**
     * Get daily content from daily_cards.json
     */
    static getTodayContent(): DailyContent | null {
        const day = this.getDayOfYear();
        const cards = (dailyCards as any).cards;

        // 1. Deterministic Verse Selection (Surah Hopping)
        // Ensures we rotate through Surahs daily: 1->2->3...->114->1
        const surahIndex = (day % 114); // 0-113
        const surah = surahIndex + 1;   // 1-114

        // Calculate Ayah loop based on how many times we've passed this Surah
        const surahPass = Math.floor(day / 114);
        const totalAyahs = this.SURAH_VERSE_COUNTS[surahIndex];
        const ayah = (surahPass % totalAyahs) + 1;

        const key = `${surah}:${ayah}`;
        const arabicText = (quranAR as Record<string, string>)[key];
        const turkmenText = (quranTM as Record<string, string>)[key];

        // 2. Deterministic Hadith Selection
        // Rotate through available hadith cards
        const cardIndex = day % cards.length;
        const hadithCard = cards[cardIndex];

        // If text is missing (edge case), fallback to first ayah of surah
        if (!turkmenText) {
            return null;
        }

        return {
            dayOfYear: day,
            ayat: {
                surah: surah,
                ayah: ayah,
                text_tm: turkmenText,
                reference: `${surah}:${ayah}`, // Will be formatted by UI
                text_ar: arabicText || ""
            },
            hadith: {
                text_tm: hadithCard.hadith.text_tm,
                source: hadithCard.hadith.source,
                number: hadithCard.hadith.number
            }
        };
    }
}
