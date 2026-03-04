/**
 * Quran Dataset Adapter
 * 
 * Single source of truth for Quran data access.
 * Centralizes dataset selection and provides clean API.
 */

import quranTMData from "../quran_tm.json";
import quranARData from "../quran_ar_full.json";

// Export canonical dataset
export const QURAN_DATASET = quranTMData;

export interface SurahInfo {
    number: number;
    nameTurkmen: string;
    nameArabic: string;
    ayahCount: number;
}

export interface VerseInfo {
    ayahNumber: number;
    arabic: string;
    turkmen: string;
}

/**
 * Get list of all 114 surahs with metadata
 */
export function getSurahList(): SurahInfo[] {
    const surahs = (QURAN_DATASET as any).surahs || [];

    return surahs.map((surah: any) => ({
        number: surah.number,
        nameTurkmen: surah.name_turkmen || `Süre ${surah.number}`,
        nameArabic: surah.name_arabic || "",
        ayahCount: surah.ayah_count || surah.ayahs?.length || 0
    }));
}

/**
 * Get all verses for a specific surah
 */
export function getSurahVerses(surahNumber: number): VerseInfo[] {
    const surahs = (QURAN_DATASET as any).surahs || [];
    const surah = surahs.find((s: any) => s.number === surahNumber);

    if (!surah || !surah.ayahs) {
        return [];
    }

    // Get Arabic text from quran_ar_full.json using flat key format
    return surah.ayahs.map((ayah: any) => ({
        ayahNumber: ayah.number,
        arabic: (quranARData as any)[`${surahNumber}:${ayah.number}`] || "",
        turkmen: ayah.text_turkmen || ""
    }));
}

/**
 * Get a single verse's Turkmen translation
 */
export function getVerseTurkmen(surahNumber: number, ayahNumber: number): string {
    const verses = getSurahVerses(surahNumber);
    const verse = verses.find(v => v.ayahNumber === ayahNumber);
    return verse?.turkmen || "";
}
