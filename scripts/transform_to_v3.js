
const fs = require('fs');
const path = require('path');

const inputPath = '/Users/mr.gandimov/Desktop/AKYL AI/namazym-mobile/src/namazym/data/global_vakitler_v2.json';
const outputPath = '/Users/mr.gandimov/Desktop/AKYL AI/namazym-mobile/src/namazym/data/global_vakitler_v3.json';

const v2Data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const v3 = {
    version: "3.0",
    update_required_after: "2027-12-25",
    years: {}
};

for (const [year, yearData] of Object.entries(v2Data.years)) {
    const ramadan = yearData.ramadan;
    v3.years[year] = {
        ramadan: ramadan,
        regions: {}
    };

    for (const [regionKey, regionData] of Object.entries(yearData.regions)) {
        v3.years[year].regions[regionKey] = {
            eid_prayer: regionData.eid_prayer,
            days: regionData.days.map(d => {
                // Determine is_ramadan
                const isRamadan = d.date >= ramadan.start && d.date <= ramadan.end;

                return {
                    dt: d.date,
                    f: d.imsak,
                    e: d.ertir,
                    o: d.oyle,
                    i: d.ikindi,
                    a: d.iftar,
                    y: d.yassy,
                    ir: isRamadan
                };
            })
        };
    }
}

fs.writeFileSync(outputPath, JSON.stringify(v3, null, 0)); // No pretty print to save space as requested for compact
console.log('Compact global_vakitler_v3.json created.');
