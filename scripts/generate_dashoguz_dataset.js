/**
 * Extracts Dashoguz 2026 data from global_vakitler_v3.json,
 * converts to the normalized PrayerDataset schema, validates, and writes dataset.json.
 *
 * Compact key mapping (from PrayerTimesService.ts):
 *   f → fajr    e → sunrise    o → dhuhr
 *   i → asr     a → maghrib    y → isha
 */

const fs   = require('fs');
const path = require('path');

const PROJECT = path.join(__dirname, '..');
const SRC     = path.join(PROJECT, 'src/namazym');

// ─── Load source ──────────────────────────────────────────────────────────────
const v3 = JSON.parse(
    fs.readFileSync(path.join(SRC, 'data/global_vakitler_v3.json'), 'utf8'),
);

const YEARS_TO_PROCESS = Object.keys(v3.years);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
function daysInYear(y) { return isLeap(y) ? 366 : 365; }
function allDatesInYear(y) {
    const dates = [];
    const d = new Date(Date.UTC(y, 0, 1));
    while (d.getUTCFullYear() === y) {
        dates.push(
            d.getUTCFullYear() + '-' +
            String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
            String(d.getUTCDate()).padStart(2, '0'),
        );
        d.setUTCDate(d.getUTCDate() + 1);
    }
    return dates;
}
function toMins(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

const PRAYER_KEYS = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];

// ─── Find Dashoguz region key (handles 'dasoguz' vs 'dashoguz') ───────────────
function getDashoguzDays(yearBlock) {
    const regions  = yearBlock.regions;
    const key = Object.keys(regions).find(k =>
        k.toLowerCase().includes('das') &&
        (k.toLowerCase().includes('oguz') || k.toLowerCase().includes('hoguz'))
    );
    if (!key) { console.error('  ❌ No Dashoguz region found in year block'); return null; }
    return { key, days: regions[key].days };
}

// ─── Build accumulated dataset ────────────────────────────────────────────────
const dataset = { city: 'dashoguz', years: {} };
const summary = [];

for (const yearStr of YEARS_TO_PROCESS) {
    const yearBlock = v3.years[yearStr];
    if (!yearBlock || !yearBlock.regions) continue;

    const result = getDashoguzDays(yearBlock);
    if (!result) continue;

    const { key: regionKey, days: rawDays } = result;
    const yearNum   = parseInt(yearStr, 10);
    const errors    = [];
    const warnings  = [];
    const yearData  = {};

    // Convert compact → semantic keys
    for (const d of rawDays) {
        const entry = {
            fajr:    d.f,
            sunrise: d.e,
            dhuhr:   d.o,
            asr:     d.i,
            maghrib: d.a,
            isha:    d.y,
        };
        yearData[d.dt] = entry;
    }

    const sortedDates = Object.keys(yearData).sort();
    const totalDays   = sortedDates.length;
    const expectedDays = daysInYear(yearNum);

    // Day count
    if (totalDays !== expectedDays) {
        errors.push(`Day count: expected ${expectedDays}, got ${totalDays}`);
    }

    // Gap check
    const dateSet = new Set(sortedDates);
    for (const iso of allDatesInYear(yearNum)) {
        if (!dateSet.has(iso)) errors.push(`Missing: ${iso}`);
    }

    // Overflow dates
    for (const dt of sortedDates) {
        if (!dt.startsWith(yearStr + '-')) errors.push(`Wrong year in date: ${dt}`);
    }

    // Time ordering per day
    let orderErrors = 0;
    for (const [dt, r] of Object.entries(yearData)) {
        const vals = [r.fajr, r.sunrise, r.dhuhr, r.asr, r.maghrib, r.isha];
        for (let k = 1; k < vals.length; k++) {
            if (toMins(vals[k-1]) >= toMins(vals[k])) {
                orderErrors++;
                if (orderErrors <= 3) {
                    warnings.push(`${dt}: ${PRAYER_KEYS[k-1]}=${vals[k-1]} >= ${PRAYER_KEYS[k]}=${vals[k]}`);
                }
            }
        }
    }
    if (orderErrors > 3) warnings.push(`... and ${orderErrors - 3} more ordering issues`);

    const isValid = errors.length === 0;
    dataset.years[yearStr] = yearData;

    summary.push({
        year: yearStr, regionKey, totalDays, expectedDays,
        isValid, orderErrors, errorCount: errors.length, errors, warnings,
    });
}

// ─── Print validation report ──────────────────────────────────────────────────
const SEP = '═'.repeat(68);
console.log('\n' + SEP);
console.log('DASHOGUZ DATASET — GENERATION & VALIDATION REPORT');
console.log(SEP);

for (const s of summary) {
    console.log(`\nYear: ${s.year}  (region key in source: "${s.regionKey}")`);
    console.log(`  Days:       ${s.totalDays} / ${s.expectedDays}  ${s.totalDays === s.expectedDays ? '✅' : '❌'}`);
    console.log(`  Gaps:       ${s.errorCount === 0 ? '✅ None' : '❌ ' + s.errorCount + ' errors'}`);
    console.log(`  Ordering:   ${s.orderErrors === 0 ? '✅ All ' + s.totalDays + ' days OK' : '⚠️ ' + s.orderErrors + ' violations'}`);
    if (s.errors.length) { console.log('  Errors:'); s.errors.slice(0,5).forEach(e => console.log('    -', e)); }
    if (s.warnings.length) { console.log('  Warnings:'); s.warnings.forEach(w => console.log('    -', w)); }
    console.log(`  Status:     ${s.isValid && s.orderErrors === 0 ? '✅ VALID — ready for dataset' : '⚠️ CHECK WARNINGS'}`);
}

// ─── Sample output ────────────────────────────────────────────────────────────
const firstYear = summary[0]?.year;
if (firstYear && dataset.years[firstYear]) {
    const sorted = Object.keys(dataset.years[firstYear]).sort();
    const first  = sorted[0];
    const last   = sorted[sorted.length - 1];
    const samples = [
        sorted[Math.floor(sorted.length * 0.25)],
        sorted[Math.floor(sorted.length * 0.50)],
        sorted[Math.floor(sorted.length * 0.75)],
    ];

    console.log(`\n── Sample Lookups (${firstYear}) ${'─'.repeat(38)}`);
    const printRow = (label, dt) => {
        const r = dataset.years[firstYear][dt];
        if (!r) return;
        console.log(`  ${label}: ${dt} | fajr=${r.fajr} sunrise=${r.sunrise} dhuhr=${r.dhuhr} asr=${r.asr} maghrib=${r.maghrib} isha=${r.isha}`);
    };
    printRow('First   ', first);
    samples.forEach((dt, i) => printRow(`Sample ${i+1}`, dt));
    printRow('Last    ', last);
}

// ─── Write dataset.json ───────────────────────────────────────────────────────
const outPath = path.join(SRC, 'data/prayer/dashoguz/dataset.json');
fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2), 'utf8');

const totalDays = summary.reduce((s, r) => s + r.totalDays, 0);
const totalYears = summary.length;
console.log(`\n${'─'.repeat(68)}`);
console.log(`✅ Written: ${outPath}`);
console.log(`   ${totalYears} year(s), ${totalDays} total days`);
console.log(`   File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
console.log(SEP + '\n');
