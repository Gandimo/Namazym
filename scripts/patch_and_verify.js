/**
 * Applies exact official corrections to the 5 mismatched rows in dataset.ts,
 * validates the result, and re-runs the full 9-row comparison.
 *
 * Official values come from user-provided verification rows (Step 626).
 * No calculations, no v3 JSON lookups, no interpolation.
 */
const fs   = require('fs');
const path = require('path');

const DS_PATH = path.join(__dirname, '../src/namazym/services/prayer/dataset.ts');

// ─── Official corrections (5 mismatched rows) ─────────────────────────────────
// Format: { key, search (current dataset line), replace (official raw line) }
const CORRECTIONS = [
    {
        key:     '06-23',
        search:  'Iýun;23;3:34;04:14;05:24;13:30;19:04;20:44;22:04',
        replace: 'Iýun;23;3:36;4:16;5:26;13:30;19:04;20:44;22:04',
    },
    {
        key:     '07-15',
        search:  'Iýul;15;3:47;04:27;05:37;13:30;19:00;20:40;22:00',
        replace: 'Iýul;15;3:48;4:28;5:38;13:30;18:59;20:39;21:59',
    },
    {
        key:     '08-22',
        search:  'Awgust;22;4:24;05:04;06:14;13:30;18:17;19:57;21:17',
        replace: 'Awgust;22;4:24;5:04;6:14;13:30;18:16;19:56;21:16',
    },
    {
        key:     '10-01',
        search:  'Oktýabr;1;5:05;05:45;06:55;13:30;17:09;18:49;20:09',
        replace: 'Oktýabr;1;5:05;5:45;6:55;13:30;17:08;18:48;20:08',
    },
    {
        key:     '11-25',
        search:  'Noýabr;25;6:10;06:50;08:00;13:30;15:59;17:39;18:59',
        replace: 'Noýabr;25;6:11;6:51;8:01;13:30;15:58;17:38;18:58',
    },
];

// ─── Read + patch dataset.ts ──────────────────────────────────────────────────
let content = fs.readFileSync(DS_PATH, 'utf8');
const applied = [];
const notFound = [];

for (const c of CORRECTIONS) {
    if (content.includes(c.search)) {
        content = content.replace(c.search, c.replace);
        applied.push(c.key);
    } else {
        notFound.push(c.key);
    }
}

if (notFound.length > 0) {
    console.error('❌ Could not find these rows to patch:', notFound.join(', '));
    console.error('Run this script only once — rows may already have been patched.');
    // Still write what we have
}

fs.writeFileSync(DS_PATH, content, 'utf8');
console.log(`\nPatched ${applied.length} rows: ${applied.join(', ')}`);
if (notFound.length) console.log(`Already patched / not found: ${notFound.join(', ')}`);

// ─── Re-parse and validate ────────────────────────────────────────────────────
const rawMatch = content.match(/const RAW = `([^`]+)`/s);
if (!rawMatch) { console.error('Cannot extract RAW'); process.exit(1); }
const RAW = rawMatch[1].trim();

const MONTHS = {
    'Ýanwar':'01','Fewral':'02','Mart':'03','Aprel':'04','Maý':'05','Iýun':'06',
    'Iýul':'07','Awgust':'08','Sentýabr':'09','Oktýabr':'10','Noýabr':'11','Dekabr':'12',
};
function norm(t) {
    const [h, m] = t.trim().split(':');
    return String(parseInt(h, 10)).padStart(2, '0') + ':' + m.trim().padStart(2, '0');
}
function toMins(t) { const [h, m] = t.split(':').map(Number); return h*60+m; }

const dataset = {};
const ORDER = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];
let parseErrors = 0;

for (const line of RAW.split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
    if (line.startsWith('Aý;') || line.startsWith('Ay;')) continue;
    const cols = line.split(';');
    if (cols.length < 9) { parseErrors++; continue; }
    const mm  = MONTHS[cols[0].trim()];
    if (!mm)  { parseErrors++; continue; }
    const dd  = String(parseInt(cols[1], 10)).padStart(2, '0');
    const key = `${mm}-${dd}`;
    dataset[key] = {
        raw:     line.trim(),
        fajr:    norm(cols[3]),
        sunrise: norm(cols[4]),
        dhuhr:   norm(cols[5]),
        asr:     norm(cols[6]),
        maghrib: norm(cols[7]),
        isha:    norm(cols[8]),
    };
}

// Expected 366 keys (leap year 2000)
const expected = new Set();
const d = new Date(Date.UTC(2000, 0, 1));
while (d.getUTCFullYear() === 2000) {
    const mm = String(d.getUTCMonth()+1).padStart(2,'0');
    const dd = String(d.getUTCDate()).padStart(2,'0');
    expected.add(`${mm}-${dd}`);
    d.setUTCDate(d.getUTCDate()+1);
}

const keys    = Object.keys(dataset);
const total   = keys.length;
const missing = [...expected].filter(k => !dataset[k]);
const extra   = keys.filter(k => !expected.has(k));
let orderErrors = 0;
const orderEx   = [];
for (const [key, r] of Object.entries(dataset)) {
    for (let i = 1; i < ORDER.length; i++) {
        if (toMins(r[ORDER[i-1]]) >= toMins(r[ORDER[i]])) {
            orderErrors++;
            if (orderEx.length < 3) orderEx.push(`${key}: ${ORDER[i-1]}=${r[ORDER[i-1]]} >= ${ORDER[i]}=${r[ORDER[i]]}`);
        }
    }
}

// ─── Print validation ─────────────────────────────────────────────────────────
const SEP = '═'.repeat(68);
console.log('\n' + SEP);
console.log('DASHOGUZ — REBUILT DATASET VALIDATION');
console.log(SEP);
console.log(`Source used:  dataset.ts embedded RAW — corrected with 5 official rows`);
console.log(`Parse errors: ${parseErrors > 0 ? '❌ ' + parseErrors : '✅ None'}`);
console.log(`Day count:    ${total} / 366 ${total === 366 ? '✅' : '❌'}`);
console.log(`Missing keys: ${missing.length > 0 ? '❌ ' + missing.slice(0,5).join(', ') : '✅ None'}`);
console.log(`Extra keys:   ${extra.length > 0 ? '❌ ' + extra.slice(0,5).join(', ') : '✅ None'}`);
console.log(`Time order:   ${orderErrors > 0 ? '❌ ' + orderErrors + ' violations' : '✅ All 366 days pass'}`);
if (orderEx.length) orderEx.forEach(e => console.log('  ⚠', e));

// ─── 9-row re-verification ────────────────────────────────────────────────────
const OFFICIAL = [
    'Ýanwar;1;6:37;7:17;8:27;13:30;16:04;17:44;19:04',
    'Fewral;29;5:47;6:27;7:37;13:30;17:14;18:54;20:14',
    'Mart;26;5:04;5:44;6:54;13:30;17:43;19:23;20:43',
    'Iýun;23;3:36;4:16;5:26;13:30;19:04;20:44;22:04',
    'Iýul;15;3:48;4:28;5:38;13:30;18:59;20:39;21:59',
    'Awgust;22;4:24;5:04;6:14;13:30;18:16;19:56;21:16',
    'Oktýabr;1;5:05;5:45;6:55;13:30;17:08;18:48;20:08',
    'Noýabr;25;6:11;6:51;8:01;13:30;15:58;17:38;18:58',
    'Dekabr;31;6:37;7:17;8:27;13:30;16:03;17:43;19:03',
];

function parseOfficial(raw) {
    const cols = raw.split(';');
    const mm  = MONTHS[cols[0].trim()];
    const dd  = String(parseInt(cols[1], 10)).padStart(2, '0');
    return {
        key:     `${mm}-${dd}`,
        fajr:    norm(cols[3]),
        sunrise: norm(cols[4]),
        dhuhr:   norm(cols[5]),
        asr:     norm(cols[6]),
        maghrib: norm(cols[7]),
        isha:    norm(cols[8]),
    };
}

console.log('\n' + SEP);
console.log('VERIFICATION TABLE — 9 Official Rows vs Rebuilt Dataset');
console.log(SEP);

let allPass   = true;
let passCount = 0;

for (const rawRow of OFFICIAL) {
    const off = parseOfficial(rawRow);
    const ds  = dataset[off.key];
    const diffs = ORDER.filter(f => !ds || off[f] !== ds[f]);
    const match = diffs.length === 0;
    if (!match) allPass = false;
    else passCount++;

    console.log(`\n  ${off.key}`);
    console.log(`  Official : ${rawRow}`);
    console.log(`  Rebuilt  : ${ds ? ds.raw : '(MISSING)'}`);
    for (const f of ORDER) {
        const o = off[f];
        const r = ds ? ds[f] : 'MISSING';
        const ok = o === r;
        console.log(`    ${f.padEnd(9)}: official=${o}  rebuilt=${r}  ${ok ? '✅' : '❌'}`);
    }
    console.log(`  → Exact match: ${match ? 'YES ✅' : 'NO ❌'}`);
}

console.log('\n' + SEP);
const validationOk = total === 366 && missing.length === 0 && orderErrors === 0 && parseErrors === 0;
console.log(`Validation : ${validationOk ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Verification: ${passCount} / ${OFFICIAL.length} rows match`);

if (allPass && validationOk) {
    console.log('\n✅ FINAL RESULT: PASS');
    console.log('All 9 verification rows match. Dashoguz dataset accepted.');
} else {
    console.log('\n❌ FINAL RESULT: FAIL');
    if (!allPass)      console.log(`  Reason: ${OFFICIAL.length - passCount} verification row(s) still mismatch`);
    if (!validationOk) console.log('  Reason: dataset structural validation failed');
}
console.log(SEP + '\n');
