export type DailyVerse = {
    id: string;
    ref: string;        // e.g., Bakara 2:43
    arabic: string;     // Arabic text
    tm: string;         // Turkmen translation
};

export const DAILY_VERSE_TODAY: DailyVerse = {
    id: "2:43",
    ref: "Bakara 2:43",
    arabic: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ",
    tm: "Namaz okaň, zekat beriň we ruku edýänler bilen bile ruku ediň.",
};
