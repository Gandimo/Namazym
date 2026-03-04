import { DataService } from './DataService';

export class ContentLoaderService {
    private static cache: Record<string, any> = {};

    /**
     * Lazy loads Quran translation for the selected language.
     * Delegates to DataService for normalization and path management.
     */
    static async loadQuran(lang: string): Promise<any> {
        if (this.cache[`quran_${lang}`]) return this.cache[`quran_${lang}`];
        const data = DataService.getQuran(lang);
        this.cache[`quran_${lang}`] = data;
        return data;
    }

    /**
     * Lazy loads localized Hadith data.
     */
    static async loadHadith(lang: string): Promise<any> {
        const data = DataService.getHadiths(lang);
        this.cache[`hadith_${lang}`] = data;
        return data;
    }

    static clearCache() {
        this.cache = {};
    }
}
