const fs = require('fs');
const path = require('path');

const cachePath = path.join(__dirname, '../src/namazym/data/prayer_times_cache.json');
const raw = fs.readFileSync(cachePath, 'utf-8');
const cache = JSON.parse(raw);

// Simulate Adapter Logic
function getPrayerTimes(cityId, dateStr) {
    const entry = cache.prepacked.find(item => item.city_id === cityId && item.date === dateStr);
    if (!entry) return null;

    return {
        city_id: entry.city_id,
        date: entry.date,
        timings: {
            Fajr: entry.fajr,
            Sunrise: entry.sunrise,
            Dhuhr: entry.dhuhr,
            Asr: entry.asr,
            Maghrib: entry.maghrib,
            Isha: entry.isha
        },
        method: "MWL",
        school: "Hanafi",
        source: "AlAdhan"
    };
}

const result = getPrayerTimes(1, "2026-01-01");
console.log(JSON.stringify(result, null, 2));
