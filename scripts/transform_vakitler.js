
const fs = require('fs');
const path = require('path');

const inputPath = '/Users/mr.gandimov/Desktop/AKYL AI/namazym-mobile/src/namazym/data/prayer_times/tm_prayer_times_2026.json';
const outputPath = '/Users/mr.gandimov/Desktop/AKYL AI/namazym-mobile/src/namazym/data/global_vakitler_v2.json';

const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const master = {
    version: "2.0",
    update_required_after: "2027-12-25",
    years: {
        "2026": {
            ramadan: { start: "2026-02-18", end: "2026-03-20" },
            regions: {}
        },
        "2027": {
            ramadan: { start: "2027-02-08", end: "2027-03-09" },
            regions: {}
        }
    }
};

const eidPrayers = {
    "asgabat_arkadag_ahal": "08:00",
    "mary": "07:50",
    "dasoguz": "07:55",
    "lebap": "07:40",
    "balkan": "08:15"
};

const eidPrayers2027 = {
    "asgabat_arkadag_ahal": "07:55",
    "mary": "07:45",
    "dasoguz": "07:50",
    "lebap": "07:35",
    "balkan": "08:10"
};

// Process 2026
for (const [key, data] of Object.entries(rawData.places)) {
    if (!eidPrayers[key]) continue; // Only process standardized keys

    master.years["2026"].regions[key] = {
        eid_prayer: eidPrayers[key],
        days: Object.entries(data.days).map(([date, times]) => ({
            date,
            imsak: times.ertir, // imsak in ramadan context is ertir begin
            ertir: times.gun,   // ertir in ramadan context is sunrise
            oyle: times.oyle,
            ikindi: times.ikindi,
            iftar: times.agsam,
            yassy: times.yassy
        }))
    };

    // Placeholder for 2027 (copy 2026 as base if full data not provided, but here we just create structure)
    master.years["2027"].regions[key] = {
        eid_prayer: eidPrayers2027[key] || "08:00",
        days: [] // Will fill with 2026 data as placeholder for logic testing if needed
    };
}

fs.writeFileSync(outputPath, JSON.stringify(master, null, 2));
console.log('Transformed global_vakitler_v2.json created.');
