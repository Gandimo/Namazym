/**
 * Mary RTF → mary.ts import script
 *
 * Reads /tmp/mary_plain.txt (extracted from mary.rtf via textutil)
 * and generates src/namazym/data/prayer/cities/mary.ts
 *
 * Handles:
 *  - Normal per-day rows: day number + 7 time fields
 *  - Monthly-block rows: "1-31" format → same times for every day in that range
 *  - Repeated header blocks (Aý / Gün / ...)
 *
 * Known source data corrections (applied with full transparency):
 *  - 05-17: Source RTF has isha=19:00 which is behind maghrib=20:00.
 *           Adjacent days (05-16 isha=21:19, 05-18 isha=21:21) confirm this is a typo.
 *           Corrected to 21:00.
 */

const fs   = require('fs');
const path = require('path');

const INPUT_PATH  = '/tmp/mary_plain.txt';
const OUTPUT_PATH = path.join(__dirname, '../src/namazym/data/prayer/cities/mary.ts');

// ─── Month map ────────────────────────────────────────────────────────────────
const MONTHS = {
    'Ýanwar':'01','Fewral':'02','Mart':'03','Aprel':'04','Maý':'05','Iýun':'06',
    'Iýul':'07','Awgust':'08','Sentýabr':'09','Oktýabr':'10','Noýabr':'11','Dekabr':'12',
};

const DAYS_IN_MONTH = {
    '01':31,'02':29,'03':31,'04':30,'05':31,'06':30,
    '07':31,'08':31,'09':30,'10':31,'11':30,'12':31,
};

// ─── Header token list (to skip these lines) ──────────────────────────────────
const HEADER_TOKENS = new Set([
    'Aý','Gün','Agyz beklenýän','Ertir namazy','Günüň dogýan',
    'Öýle namazy','Ikindi namazy','Agşam namazy','Ýassy namazy',
]);

function norm(t) {
    const s = t.trim();
    const m = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) throw new Error(`Bad time: "${s}"`);
    return String(parseInt(m[1])).padStart(2,'0') + ':' + m[2];
}
function toMins(t) { const [h,m]=t.split(':').map(Number); return h*60+m; }
const ORDER = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];

// ─── Parse ────────────────────────────────────────────────────────────────────
const raw = fs.readFileSync(INPUT_PATH, 'utf8');
const tokens  = raw.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);

const result  = {};  // MM-DD → { fajr, sunrise, dhuhr, asr, maghrib, isha }
let currentMM = null;

let i = 0;
while (i < tokens.length) {
    const tok = tokens[i];

    // Skip header tokens
    if (HEADER_TOKENS.has(tok)) { i++; continue; }

    // Month name?
    if (MONTHS[tok]) {
        currentMM = MONTHS[tok];
        i++;
        continue;
    }

    if (!currentMM) { i++; continue; }

    // Day token: either "N" or "N-M" (range)
    const rangeMatch = tok.match(/^(\d+)-(\d+)$/);
    const singleMatch = tok.match(/^(\d{1,2})$/);

    if (!rangeMatch && !singleMatch) { i++; continue; }

    // Attempt to read 7 time fields after the day token
    // (skip imsak, read: fajr, sunrise, dhuhr, asr, maghrib, isha)
    const dayTok = tok;
    i++;

    // Read exactly 7 time values (some may be empty — flag and skip)
    const times = [];
    let j = i;
    while (times.length < 7 && j < tokens.length) {
        const t = tokens[j];
        if (MONTHS[t] || HEADER_TOKENS.has(t)) break;
        if (/^\d+(-\d+)?$/.test(t) && !t.includes(':')) break; // next day number
        if (/^\d{1,2}:\d{2}$/.test(t)) { times.push(t); j++; }
        else { j++; } // blank or unexpected
    }
    i = j;

    if (times.length < 7) {
        console.warn(`⚠ Only got ${times.length} time values for ${currentMM} ${dayTok}, skipping`);
        continue;
    }

    // cols: [imsak(0), fajr(1), sunrise(2), dhuhr(3), asr(4), maghrib(5), isha(6)]
    let fajr, sunrise, dhuhr, asr, maghrib, isha;
    try {
        fajr    = norm(times[1]);
        sunrise = norm(times[2]);
        dhuhr   = norm(times[3]);
        asr     = norm(times[4]);
        maghrib = norm(times[5]);
        isha    = norm(times[6]);
    } catch(e) {
        console.warn(`⚠ Bad time values for ${currentMM} ${dayTok}: ${e.message}`);
        continue;
    }

    const entry = { fajr, sunrise, dhuhr, asr, maghrib, isha };

    // Expand range or single day
    let startDay, endDay;
    if (rangeMatch) {
        startDay = parseInt(rangeMatch[1]);
        endDay   = parseInt(rangeMatch[2]);
    } else {
        startDay = endDay = parseInt(singleMatch[1]);
    }

    const maxDay = DAYS_IN_MONTH[currentMM];
    endDay = Math.min(endDay, maxDay);

    for (let d = startDay; d <= endDay; d++) {
        const dd  = String(d).padStart(2,'0');
        const key = `${currentMM}-${dd}`;
        if (result[key]) {
            console.warn(`⚠ Duplicate key: ${key} — overwriting`);
        }
        result[key] = { ...entry };
    }
}

// ─── Validate ─────────────────────────────────────────────────────────────────
const d2 = new Date(Date.UTC(2000,0,1));
const expectedKeys = [];
while (d2.getUTCFullYear() === 2000) {
    expectedKeys.push(
        String(d2.getUTCMonth()+1).padStart(2,'0') + '-' + String(d2.getUTCDate()).padStart(2,'0')
    );
    d2.setUTCDate(d2.getUTCDate()+1);
}

const missing    = expectedKeys.filter(k => !result[k]);
const extra      = Object.keys(result).filter(k => !new Set(expectedKeys).has(k));
let   orderErrs  = 0;
const orderExamples = [];
for (const [key, r] of Object.entries(result)) {
    for (let x=1; x<ORDER.length; x++) {
        if (toMins(r[ORDER[x-1]]) >= toMins(r[ORDER[x]])) {
            orderErrs++;
            if (orderExamples.length < 3) orderExamples.push(`${key}: ${ORDER[x-1]}=${r[ORDER[x-1]]} >= ${ORDER[x]}=${r[ORDER[x]]}`);
        }
    }
}

const SEP = '═'.repeat(64);
console.log('\n' + SEP);
console.log('VALIDATION');
console.log(SEP);
console.log(`Source file:    mary.rtf (RTF extracted via textutil)`);
console.log(`Tokens read:    ${tokens.length}`);
console.log(`Days generated: ${Object.keys(result).length}`);
console.log(`Missing keys:   ${missing.length === 0 ? '✅ None' : '❌ ' + missing.join(', ')}`);
console.log(`Extra keys:     ${extra.length   === 0 ? '✅ None' : '❌ ' + extra.join(', ')}`);
console.log(`Time ordering:  ${orderErrs === 0 ? '✅ All OK' : '❌ ' + orderErrs + ' violations'}`);
if (orderExamples.length) orderExamples.forEach(e => console.log('  ⚠', e));

// Sample rows
const allKeys = Object.keys(result).sort();
console.log(`\nFirst row:  ${allKeys[0]} →`, JSON.stringify(result[allKeys[0]]));
console.log(`Middle row: ${allKeys[182]} →`, JSON.stringify(result[allKeys[182]]));
console.log(`Last row:   ${allKeys[allKeys.length-1]} →`, JSON.stringify(result[allKeys[allKeys.length-1]]));

// ─── Known source corrections ─────────────────────────────────────────────────
// 05-17: RTF isha=19:00 is behind maghrib=20:00 (typo — neighbours are 21:19 / 21:21)
console.log('\n⚠  SOURCE CORRECTION applied: 05-17 isha: 19:00 → 21:00 (source RTF typo)');
if (result['05-17']) result['05-17'].isha = '21:00';

// Re-check ordering after correction
orderErrs = 0;
for (const [key, r] of Object.entries(result)) {
    for (let x=1; x<ORDER.length; x++) {
        if (toMins(r[ORDER[x-1]]) >= toMins(r[ORDER[x]])) orderErrs++;
    }
}
console.log(`Time ordering (post-fix): ${orderErrs === 0 ? '✅ All OK' : '❌ ' + orderErrs + ' violations'}`);

if (missing.length > 0 || extra.length > 0 || orderErrs > 0) {
    console.error('\n❌ VALIDATION FAILED — aborting write.');
    process.exit(1);
}

// ─── Generate mary.ts ─────────────────────────────────────────────────────────
// Reconstruct semicolon-delimited RAW block from parsed result
// so we can embed it in the same format as dataset.ts (re-usable by parseRaw)
const MONTH_NAMES = {
    '01':'Ýanwar','02':'Fewral','03':'Mart','04':'Aprel','05':'Maý','06':'Iýun',
    '07':'Iýul','08':'Awgust','09':'Sentýabr','10':'Oktýabr','11':'Noýabr','12':'Dekabr',
};

const rawLines = [
    'Aý;Gün;Agyz beklenýän wagty;Ertir namazy;Günüň dogýan wagty;Öýle namazy;Ikindi namazy;Agşam namazy;Ýassy namazy',
];
for (const key of expectedKeys) {
    const r = result[key];
    const [mm, dd] = key.split('-');
    const dayNum = parseInt(dd);
    // Reconstruct agyz as same as fajr-1min (placeholder; agyz is discarded by parser)
    // Actually we just need to put something — the parser ignores col[2]
    rawLines.push(`${MONTH_NAMES[mm]};${dayNum};${r.fajr};${r.fajr};${r.sunrise};${r.dhuhr};${r.asr};${r.maghrib};${r.isha}`);
}

const rawBlock = rawLines.join('\n').replace(/`/g,'\\`').replace(/\$\{/g,'\\${');

const ts = `/**
 * Mary — Official Prayer Timetable
 *
 * STATUS: ✅ Populated (${Object.keys(result).length} days, MM-DD keyed, year-agnostic)
 *
 * Source: mary.rtf (official, provided by user)
 * Imported: ${new Date().toISOString().slice(0,10)}
 * Note: July and August provided as monthly blocks (1-31) in the source.
 *
 * DO NOT EDIT — re-import from official source if data changes.
 */

import { parseRaw } from '../../../services/prayer/parser';

const RAW = \`${rawBlock}\`;

export const maryDataset = parseRaw(RAW);
`;

fs.writeFileSync(OUTPUT_PATH, ts, 'utf8');
console.log(`\n✅ Written: ${OUTPUT_PATH}`);
console.log(SEP);
console.log('✅ FINAL RESULT: PASS');
console.log(SEP + '\n');
