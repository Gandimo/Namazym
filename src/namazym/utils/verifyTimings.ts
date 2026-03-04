import { PrayerTimesService } from "../services/PrayerTimesService";

export const verifyAllPrayerTimes = () => {
    // Standard verify dates (Feb 10-14)
    const dates = ["2026-02-10", "2026-02-11", "2026-02-12", "2026-02-13", "2026-02-14"];

    const referenceData: any = {
        "asgabat": {
            "2026-02-10": { "Fajr": "06:53", "Sunrise": "08:03", "Dhuhr": "13:30", "Asr": "17:11", "Maghrib": "18:51", "Isha": "20:11" },
            "2026-02-11": { "Fajr": "06:52", "Sunrise": "08:02", "Dhuhr": "13:30", "Asr": "17:12", "Maghrib": "18:52", "Isha": "20:12" },
            "2026-02-12": { "Fajr": "06:50", "Sunrise": "08:00", "Dhuhr": "13:30", "Asr": "17:13", "Maghrib": "18:53", "Isha": "20:13" },
            "2026-02-13": { "Fajr": "06:49", "Sunrise": "07:59", "Dhuhr": "13:30", "Asr": "17:15", "Maghrib": "18:55", "Isha": "20:15" },
            "2026-02-14": { "Fajr": "06:48", "Sunrise": "07:58", "Dhuhr": "13:30", "Asr": "17:16", "Maghrib": "18:56", "Isha": "20:16" }
        },
        "mary": {
            "2026-02-10": { "Fajr": "06:38", "Sunrise": "07:48", "Dhuhr": "13:30", "Asr": "16:50", "Maghrib": "18:30", "Isha": "19:50" },
            "2026-02-11": { "Fajr": "06:37", "Sunrise": "07:47", "Dhuhr": "13:30", "Asr": "16:51", "Maghrib": "18:31", "Isha": "19:51" },
            "2026-02-12": { "Fajr": "06:36", "Sunrise": "07:46", "Dhuhr": "13:30", "Asr": "16:52", "Maghrib": "18:32", "Isha": "19:52" },
            "2026-02-13": { "Fajr": "06:35", "Sunrise": "07:45", "Dhuhr": "13:30", "Asr": "16:53", "Maghrib": "18:33", "Isha": "19:53" },
            "2026-02-14": { "Fajr": "06:34", "Sunrise": "07:44", "Dhuhr": "13:30", "Asr": "16:54", "Maghrib": "18:34", "Isha": "19:54" }
        },
        "lebap": {
            "2026-02-10": { "Fajr": "06:34", "Sunrise": "07:44", "Dhuhr": "13:30", "Asr": "16:42", "Maghrib": "18:22", "Isha": "19:42" },
            "2026-02-11": { "Fajr": "06:33", "Sunrise": "07:43", "Dhuhr": "13:30", "Asr": "16:43", "Maghrib": "18:23", "Isha": "19:43" },
            "2026-05-04": { "Fajr": "04:34", "Sunrise": "05:44", "Dhuhr": "13:30", "Asr": "18:07", "Maghrib": "19:42" } // Anchor
        },
        "ahal": {
            "2026-04-25": { "Fajr": "05:07", "Sunrise": "06:17", "Dhuhr": "13:30", "Asr": "18:24", "Maghrib": "20:11" } // Anchor
        },
        "dasoguz": {
            "2026-06-12": { "Fajr": "04:15", "Sunrise": "05:25", "Dhuhr": "13:30", "Asr": "18:59", "Maghrib": "19:50" } // Anchor
        },
        "balkan": {
            "2026-06-27": { "Fajr": "04:47", "Sunrise": "05:57", "Dhuhr": "13:40", "Asr": "19:18", "Maghrib": "20:17" } // Anchor
        }
    };

    let errors = [];

    // 1. Verify Standard Dates (Feb 10-14, loops through referenceData keys)
    for (const placeKey of ["asgabat", "mary", "lebap"]) { // Only checking places with full history in this loop or careful
        // Actually, let's just loop through what we defined in referenceData
        // But referenceData now has mixed structure (some have full dates, some only anchors)
    }

    // Better verification loop:
    for (const [placeKey, dateMap] of Object.entries(referenceData as object)) {
        for (const [date, expected] of Object.entries(dateMap as object)) {
            const result = PrayerTimesService.getPrayerTimes(date, placeKey);

            if (!result) {
                errors.push(`[${placeKey}] ${date}: result is null`);
                continue;
            }

            for (const key of Object.keys(expected as object)) {
                if ((result.timings as any)[key] !== (expected as any)[key]) {
                    errors.push(`[${placeKey}] ${date} ${key}: expected ${(expected as any)[key]}, got ${(result.timings as any)[key]}`);
                }
            }
        }
    }

    if (errors.length > 0) {
        console.error("Verification Failed:\n" + errors.join("\n"));
        throw new Error("PRAYER_TIMES_VERIFICATION_FAILED: See console for details.");
    } else {
        console.log("✅ PRAYER_TIMES_VERIFICATION_PASSED for refined dataset & Anchors.");
    }
};
