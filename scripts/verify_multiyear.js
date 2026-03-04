
const fs = require('fs');
const path = require('path');

// Mock CITIES
const CITIES = [
    { key: "asgabat_arkadag_ahal", cityId: 1, label: "Aşgabat" },
    { key: "mary", cityId: 2, label: "Mary" }
];

// Mock TimeService
const TimeService = {
    getTodayDateString: () => "2026-03-04"
};

// Import the service logic (v3 Compact)
const globalVakitler = JSON.parse(fs.readFileSync('/Users/mr.gandimov/Desktop/AKYL AI/namazym-mobile/src/namazym/data/global_vakitler_v3.json', 'utf8'));

function getPrayerTimes(dateISO, placeKey) {
    const currentYear = dateISO.split('-')[0];
    const yearData = globalVakitler.years[currentYear];

    if (!yearData) return null;

    const regionData = yearData.regions[placeKey];
    if (!regionData || !regionData.days) return null;

    const dayData = regionData.days.find(d => d.dt === dateISO);
    if (!dayData) return null;

    const place = CITIES.find(p => p.key === placeKey) || CITIES[0];

    return {
        city_id: place.cityId,
        date: dateISO,
        timings: {
            Fajr: dayData.f || "00:00",
            Sunrise: dayData.e || "00:00",
            Dhuhr: dayData.o || "00:00",
            Asr: dayData.i || "00:00",
            Maghrib: dayData.a || "00:00",
            Isha: dayData.y || "00:00"
        },
        is_ramadan: dayData.ir
    };
}

// Test cases
console.log('--- Test Case 1: 2026 Normal Date ---');
const tc1 = getPrayerTimes("2026-03-04", "asgabat_arkadag_ahal");
console.log(tc1);
if (tc1 && tc1.date === "2026-03-04" && tc1.timings.Fajr === '06:26') console.log('PASS'); else console.log('FAIL');

console.log('--- Test Case 2: 2027 Date (Structure Check) ---');
const tc2 = getPrayerTimes("2027-01-01", "asgabat_arkadag_ahal");
console.log(tc2);
if (tc2 && tc2.timings.Fajr) console.log('PASS (Mechanism Works)'); else console.log('FAIL');

console.log('--- Test Case 3: Invalid Year ---');
const tc3 = getPrayerTimes("2025-01-01", "asgabat_arkadag_ahal");
if (tc3 === null) console.log('PASS'); else console.log('FAIL');

console.log('--- Test Case 4: Ramadan Check (v3 ir flag) ---');
const tc4 = getPrayerTimes("2026-02-18", "asgabat_arkadag_ahal");
console.log(`2026-02-18 is_ramadan: ${tc4.is_ramadan}`);
if (tc4.is_ramadan === true) console.log('PASS'); else console.log('FAIL');
