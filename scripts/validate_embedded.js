/**
 * Validate dataset.ts embedded data — no adhan.js, no JSON, no calculations.
 * Pure structural + content check on the 366-day Dashoguz dataset.
 */
const fs   = require('fs');
const path = require('path');

// ─── Pull the RAW block directly from dataset.ts ──────────────────────────────
const datasetFile = fs.readFileSync(
    path.join(__dirname, '../src/namazym/services/prayer/dataset.ts'), 'utf8',
);

// Extract everything between the first `` ` `` after `const RAW` and the closing `` `; ``
const rawMatch = datasetFile.match(/const RAW = `([^`]+)`/s);
if (!rawMatch) { console.error('Cannot extract RAW from dataset.ts'); process.exit(1); }

const RAW = rawMatch[1].trim();

// ─── Parse ────────────────────────────────────────────────────────────────────
const MONTHS = {
    'Ýanwar':'01','Fewral':'02','Mart':'03','Aprel':'04','Maý':'05','Iýun':'06',
    'Iýul':'07','Awgust':'08','Sentýabr':'09','Oktýabr':'10','Noýabr':'11','Dekabr':'12',
};
function norm(t) {
    const [h,m] = t.trim().split(':');
    return String(parseInt(h,10)).padStart(2,'0') + ':' + m.padStart(2,'0');
}

const lines = RAW.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const dataset = {};
const errors  = [];

for (const line of lines) {
    if (line.startsWith('Aý;') || line.startsWith('Ay;')) continue;
    const cols = line.split(';');
    if (cols.length !== 9) { errors.push(`Bad columns (${cols.length}): ${line}`); continue; }
    const mm = MONTHS[cols[0].trim()];
    if (!mm) { errors.push(`Unknown month: "${cols[0]}"`); continue; }
    const dd = String(parseInt(cols[1],10)).padStart(2,'0');
    const key = `${mm}-${dd}`;
    if (dataset[key]) { errors.push(`Duplicate: ${key}`); continue; }
    try {
        dataset[key] = {
            fajr:    norm(cols[3]),
            sunrise: norm(cols[4]),
            dhuhr:   norm(cols[5]),
            asr:     norm(cols[6]),
            maghrib: norm(cols[7]),
            isha:    norm(cols[8]),
        };
    } catch(e) { errors.push(`Bad time at ${key}: ${e.message}`); }
}

// ─── Validate ─────────────────────────────────────────────────────────────────
function toMins(t) { const [h,m] = t.split(':').map(Number); return h*60+m; }

// Expected 366 MM-DD keys using year 2000 (leap)
const expected = new Set();
const d = new Date(Date.UTC(2000,0,1));
while (d.getUTCFullYear() === 2000) {
    const mm = String(d.getUTCMonth()+1).padStart(2,'0');
    const dd = String(d.getUTCDate()).padStart(2,'0');
    expected.add(`${mm}-${dd}`);
    d.setUTCDate(d.getUTCDate()+1);
}

const keys = Object.keys(dataset).sort();
const total = keys.length;
let orderErrors = 0;
const orderExamples = [];
const ORDER = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];

for (const key of keys) {
    const r = dataset[key];
    for (let i=1; i<ORDER.length; i++) {
        if (toMins(r[ORDER[i-1]]) >= toMins(r[ORDER[i]])) {
            orderErrors++;
            if (orderExamples.length<3) orderExamples.push(`${key}: ${ORDER[i-1]}=${r[ORDER[i-1]]} >= ${ORDER[i]}=${r[ORDER[i]]}`);
        }
    }
}

const missing = [...expected].filter(k => !dataset[k]);
const extra   = keys.filter(k => !expected.has(k));

// ─── Print Report ─────────────────────────────────────────────────────────────
const SEP = '═'.repeat(68);
console.log('\n' + SEP);
console.log('DASHOGUZ dataset.ts — EMBEDDED DATA VALIDATION');
console.log('Source: dataset.ts RAW (not v3 JSON or adhan.js)');
console.log(SEP);

console.log(`\nDay count:    ${total} / 366 ${total === 366 ? '✅' : '❌'}`);
console.log(`Parse errors: ${errors.length > 0 ? '❌ ' + errors.length : '✅ None'}`);
console.log(`Missing keys: ${missing.length > 0 ? '❌ ' + missing.slice(0,5).join(', ') : '✅ None'}`);
console.log(`Extra keys:   ${extra.length > 0 ? '❌ ' + extra.slice(0,5).join(', ') : '✅ None'}`);
console.log(`Time order:   ${orderErrors > 0 ? '❌ ' + orderErrors + ' violations' : '✅ All 366 days OK'}`);
if (orderExamples.length) orderExamples.forEach(e => console.log('  ⚠', e));

function printRow(label, key) {
    const r = dataset[key];
    if (!r) { console.log(`  ${label}: ${key} NOT FOUND`); return; }
    console.log(`  ${label}: ${key} | fajr=${r.fajr} sunrise=${r.sunrise} dhuhr=${r.dhuhr} asr=${r.asr} maghrib=${r.maghrib} isha=${r.isha}`);
}

console.log('\nFirst day:');
printRow('01-01', '01-01');
console.log('\nLast day:');
printRow('12-31', '12-31');
console.log('\nSample rows:');
const samples = ['02-29','03-21','06-01','07-15','10-01'];
for (const s of samples) printRow(s, s);

const overall = total===366 && errors.length===0 && missing.length===0 && orderErrors===0;
console.log(`\nOverall:   ${overall ? '✅ VALID — 366 days, no errors' : '❌ INVALID — see above'}`);
console.log(SEP + '\n');
