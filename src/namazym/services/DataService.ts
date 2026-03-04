/**
 * DataService.ts - Full multilingual support
 * tk, ru, en, tr, fr
 */

const QURAN_MAP: Record<string, any> = {
    tk: require('../data/quran_tm.json'),
    ru: require('../data/quran_ru.json'),
    en: require('../data/quran_en.json'),
    tr: require('../data/quran_tr.json'),
    fr: require('../data/quran_fr.json'),
};

const HADITH_MAP: Record<string, any> = {
    tk: require('../data/hadith.json'),
    ru: require('../data/hadith_ru.json'),
    en: require('../data/hadith_en.json'),
    tr: require('../data/hadith_tr.json'),
    fr: require('../data/hadith_fr.json'),
};

export class DataService {
    static getQuran(lang: string) {
        return QURAN_MAP[lang] || QURAN_MAP.tk;
    }

    static getHadiths(lang: string) {
        return HADITH_MAP[lang] || HADITH_MAP.tk;
    }

    static getVerseText(verse: any, lang: string): string {
        switch (lang) {
            case 'ru': return verse.text_russian || verse.text_english || verse.text_tm || "";
            case 'en': return verse.text_english || verse.text_tm || "";
            case 'tr': return verse.text_turkish || verse.text_english || verse.text_tm || "";
            case 'fr': return verse.text_french || verse.text_english || verse.text_tm || "";
            default: return verse.text_tm || verse.text_turkmen || verse.text || verse.translation || "";
        }
    }

    static getHadithText(hadith: any, lang: string): string {
        switch (lang) {
            case 'ru': return hadith.text_ru || hadith.text_en || hadith.text_tm || "";
            case 'en': return hadith.text_en || hadith.text_tm || "";
            case 'tr': return hadith.text_tr || hadith.text_en || hadith.text_tm || "";
            case 'fr': return hadith.text_fr || hadith.text_en || hadith.text_tm || "";
            default: return hadith.text_tm || "";
        }
    }
}
