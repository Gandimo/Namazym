import { Share, Platform, Alert } from 'react-native';

interface ShareOptions {
    title?: string;
    message: string;
}

/**
 * Share text content using the native share sheet.
 * Handles platform differences (iOS/Android).
 */
export const shareText = async ({ title, message }: ShareOptions) => {
    try {
        const result = await Share.share(
            Platform.select({
                ios: {
                    message,
                },
                default: {
                    title,
                    message,
                },
            }),
            Platform.select({
                ios: {
                    // iOS exclusive options if needed
                },
                default: {
                    dialogTitle: title, // Android only
                },
            })
        );

        if (result.action === Share.sharedAction) {
            if (result.activityType) {
                // shared with activity type of result.activityType
            } else {
                // shared
            }
        } else if (result.action === Share.dismissedAction) {
            // dismissed
        }
    } catch (error: any) {
        // Silently fail or log in prod, but don't crash app
        console.warn("Share failed:", error.message);
    }
};

/**
 * Formats a clean share message for a Quran verse.
 */
export const buildAyahShareMessage = ({
    arabic,
    turkmen,
    surah,
    ayah,
    surahName
}: {
    arabic: string;
    turkmen: string;
    surah: number;
    ayah: number;
    surahName?: string;
}) => {
    return [
        arabic,
        "",
        turkmen,
        "",
        `${surahName ? surahName + ' ' : ''}Süre ${surah}, aýat ${ayah}`,
        "",
        "NAMAZYM"
    ].join('\n');
};

/**
 * Formats a clean share message for a Hadith.
 */
export const buildHadithShareMessage = ({
    text,
    source,
    number
}: {
    text: string;
    source?: string;
    number?: number | string;
}) => {
    const segments = [text, ""];

    if (source || number) {
        segments.push(`${source || ''} ${number ? '· № ' + number : ''}`.trim());
        segments.push("");
    }

    segments.push("NAMAZYM");
    return segments.join('\n');
};
