const fs = require('fs');
const { format, addDays } = require('date-fns');

// 1. Load Anchors
const ANCHORS = JSON.parse(fs.readFileSync('/Users/mr.gandimov/Desktop/AKYL AI/namazym-mobile/src/namazym/data/prayer_times/anchors.json', 'utf8'));

// Muftiyat Centers
const CENTERS = {
    "asgabat": { lat: 37.95, lon: 58.38, dhuhr: "13:30" },
    "ahal": { lat: 37.95, lon: 58.38, dhuhr: "13:30" },
    "mary": { lat: 37.60, lon: 61.83, dhuhr: "13:30" },
    "lebap": { lat: 39.03, lon: 63.58, dhuhr: "13:30" },
    "dasoguz": { lat: 41.83, lon: 59.97, dhuhr: "13:30" },
    "balkan": { lat: 39.51, lon: 54.37, dhuhr: "13:40" }
};

// Solar Calc
function getSolarTimes(date, lat, lon) {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (12 - 12) / 24);
    const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
    const t_noon = 720 - 4 * lon + 60 * 5 - eqtime;
    const ha = Math.acos((Math.sin(-0.833 * Math.PI / 180) - Math.sin(lat * Math.PI / 180) * Math.sin(decl)) / (Math.cos(lat * Math.PI / 180) * Math.cos(decl))) * 180 / Math.PI;
    return { sunrise: t_noon - ha * 4, sunset: t_noon + ha * 4 };
}

function minsToTime(mins) {
    let totalMins = Math.round(mins);
    let h = Math.floor(totalMins / 60) % 24;
    let m = totalMins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const result = { year: 2026, timezone: "Asia/Ashgabat", places: {} };

// Baseline Buffers
const BUFFERS = {
    "asgabat": { s: 0.2, m: 13.3 },
    "ahal": { s: 0.2, m: 13.3 },
    "mary": { s: -0.6, m: 5.2 },
    "lebap": { s: -0.5, m: 6.8 },
    "dasoguz": { s: -0.7, m: 5.2 },
    "balkan": { s: -0.8, m: 5.5 }
};

// 2. Generation Loop
for (const [key, center] of Object.entries(CENTERS)) {
    result.places[key] = { label: key === "asgabat" ? "Aşgabat" : (key === "dasoguz" ? "Daşoguz" : key.charAt(0).toUpperCase() + key.slice(1)), days: {} };

    let date = new Date(2026, 0, 1);
    for (let i = 0; i < 365; i++) {
        const iso = format(date, 'yyyy-MM-dd');

        // Check Anchor
        if (ANCHORS[key] && ANCHORS[key][iso]) {
            // 3. Anchor Override
            const anchor = ANCHORS[key][iso];
            // Infer 'yassy' if missing (usually +80m from maghrib/agsam in Muftiyat logic, but let's strictly use what we have or fall back to calc for missing fields?)
            // The prompt says: "Final dataset = generator baseline + anchor overrides"
            // So we generate baseline FIRST, then merge anchor.

            const { sunrise, sunset } = getSolarTimes(date, center.lat, center.lon);
            const b = BUFFERS[key];
            const sTime = sunrise + b.s;
            const mTime = sunset + b.m;

            const generated = {
                ertir: minsToTime(sTime - 70),
                gun: minsToTime(sTime),
                oyle: center.dhuhr,
                ikindi: minsToTime(mTime - 100),
                agsam: minsToTime(mTime),
                yassy: minsToTime(mTime + 80)
            };

            // Merge anchor
            result.places[key].days[iso] = { ...generated, ...anchor };

            // Console log for verification
            console.log(`[ANCHOR APPLIED] ${key} ${iso}:`, result.places[key].days[iso]);

        } else {
            // Standard Generator
            const { sunrise, sunset } = getSolarTimes(date, center.lat, center.lon);
            const b = BUFFERS[key];
            const sTime = sunrise + b.s;
            const mTime = sunset + b.m;

            result.places[key].days[iso] = {
                ertir: minsToTime(sTime - 70),
                gun: minsToTime(sTime),
                oyle: center.dhuhr,
                ikindi: minsToTime(mTime - 100),
                agsam: minsToTime(mTime),
                yassy: minsToTime(mTime + 80)
            };
        }
        date = addDays(date, 1);
    }
}

// 4. Validate Anchors in Final Output
let failures = 0;
for (const [place, dates] of Object.entries(ANCHORS)) {
    for (const [date, timings] of Object.entries(dates)) {
        if (!result.places[place] || !result.places[place].days[date]) {
            console.error(`[FAIL] Anchor date missing in output! ${place} ${date}`);
            failures++;
            continue;
        }
        const final = result.places[place].days[date];
        for (const [timeKey, timeVal] of Object.entries(timings)) {
            if (final[timeKey] !== timeVal) {
                console.error(`[FAIL] Anchor Mismatch! ${place} ${date} ${timeKey}. Expected ${timeVal}, Got ${final[timeKey]}`);
                failures++;
            }
        }
    }
}

if (failures > 0) {
    console.error(`Build FAILED with ${failures} anchor mismatches.`);
    process.exit(1);
}

fs.writeFileSync('/Users/mr.gandimov/Desktop/AKYL AI/namazym-mobile/src/namazym/data/prayer_times/tm_prayer_times_2026.json', JSON.stringify(result, null, 2));
console.log("SUCCESS: Dataset generated with Anchor Overrides.");
