/**
 * Formats a name (Surah or other) to match Turkmen orthography rules.
 * Rule 1: 'c' -> 'j' (e.g. Cin -> Jin/Jyn)
 * Rule 2: 'ı' -> 'y' (Turkish dotless i)
 * Rule 3: 'y' at start or middle often -> 'ý' (contextual)
 * Rule 4: 'q' -> 'k' (e.g. Tariq -> Taryk)
 */
export function formatSurahNameToTurkmen(name: string): string {
    if (!name) return name;

    let formatted = name.toLowerCase();

    // c -> j
    formatted = formatted.replace(/c/g, 'j');

    // ı -> y (for Turkish inputs)
    formatted = formatted.replace(/ı/g, 'y');

    // q -> k
    formatted = formatted.replace(/q/g, 'k');

    // Simple Y to Ý for specific common Surah patterns if needed, 
    // but we have to be careful not to break everything.
    // Generally Turkish 'y' maps to Turkmen 'ý'.
    // Turkmen 'y' is different.
    // If input is Turkish: 
    // 'y' -> 'ý'
    // 'ş' -> 'ş' (same)
    // 'ç' -> 'ç' (same)
    // 'ö' -> 'ö' (same)
    // 'ü' -> 'ü' (same)

    // Apply Y -> Ý mapping for Turkmen context
    // In Turkmen: 'y' is /ɯ/ (like Turkish dotless ı), 'ý' is /j/ (like English y).
    // If the input 'name' uses 'y' as /j/, it must become 'ý'.

    // We'll handle 'y' -> 'ý' globally for names if they are transliterations.
    formatted = formatted.replace(/y/g, 'ý');

    // And finally, if we had any 'ı' that became 'y', it stays 'y'.
    // Capitalize first letter
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Generates a deterministic index for a given date string (YYYY-MM-DD).
 */
export function getDailyIndex(date: Date, totalCount: number): number {
    if (totalCount === 0) return 0;
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        const char = dateString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash) % totalCount;
}
