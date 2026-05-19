/**
 * FULL REBUILD — Dashoguz dataset.ts from official raw file only.
 *
 * Source:  data_sources/dashoguz_official.txt
 * Target:  src/namazym/services/prayer/dataset.ts
 *
 * Rules:
 *   - Read ONLY from official file
 *   - Parse every data row
 *   - Overwrite dataset.ts RAW block with exact official text
 *   - Validate 366 days, no gaps, no ordering violations
 *   - Full 366-row diff between parsed official and re-parsed dataset
 *   - Print mismatch count
 */
const fs   = require('fs');
const path = require('path');

const OFFICIAL_PATH = path.join(__dirname, '../data_sources/dashoguz_official.txt');
const DS_PATH       = path.join(__dirname, '../src/namazym/services/prayer/dataset.ts');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = {
    'Ýanwar':'01','Fewral':'02','Mart':'03','Aprel':'04','Maý':'05','Iýun':'06',
    'Iýul':'07','Awgust':'08','Sentýabr':'09','Oktýabr':'10','Noýabr':'11','Dekabr':'12',
};

function norm(t) {
    const s = t.trim();
    const [h, m] = s.split(':');
    return String(parseInt(h, 10)).padStart(2, '0') + ':' + m.trim().padStart(2, '0');
}
function toMins(t) { const [h, m] = t.split(':').map(Number); return h*60+m; }

const ORDER = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];

// ─── Step 1: Read official file ───────────────────────────────────────────────
const raw = fs.readFileSync(OFFICIAL_PATH, 'utf8');
const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
console.log(`\nOfficial file:  ${OFFICIAL_PATH}`);
console.log(`Total lines:    ${lines.length} (including header)`);

// ─── Step 2: Parse all rows ───────────────────────────────────────────────────
const officialRows  = []; // raw data lines, header excluded
const officialMap   = {}; // MM-DD → parsed fields
const parseErrors   = [];

let headerLine = '';
for (const line of lines) {
    if (line.startsWith('Aý;') || line.startsWith('Ay;')) {
        headerLine = line;
        continue;
    }
    const cols = line.split(';');
    if (cols.length !== 9) {
        parseErrors.push(`Bad column count (${cols.length}): ${line}`);
        continue;
    }
    const mm = MONTHS[cols[0].trim()];
    if (!mm) {
        parseErrors.push(`Unknown month: "${cols[0]}": ${line}`);
        continue;
    }
    const dd  = String(parseInt(cols[1].trim(), 10)).padStart(2, '0');
    const key = `${mm}-${dd}`;
    if (officialMap[key]) {
        parseErrors.push(`Duplicate key: ${key}`);
        continue;
    }
    officialRows.push(line);
    officialMap[key] = {
        rawLine: line,
        fajr:    norm(cols[3]),
        sunrise: norm(cols[4]),
        dhuhr:   norm(cols[5]),
        asr:     norm(cols[6]),
        maghrib: norm(cols[7]),
        isha:    norm(cols[8]),
    };
}

console.log(`Parsed rows:    ${officialRows.length}`);
if (parseErrors.length) {
    console.error('❌ Parse errors:', parseErrors);
    process.exit(1);
}

// ─── Step 3: Validate official data ───────────────────────────────────────────
// Expected 366 MM-DD keys using 2000 (leap year)
const expectedKeys = [];
const d = new Date(Date.UTC(2000, 0, 1));
while (d.getUTCFullYear() === 2000) {
    const mm = String(d.getUTCMonth()+1).padStart(2,'0');
    const dd = String(d.getUTCDate()).padStart(2,'0');
    expectedKeys.push(`${mm}-${dd}`);
    d.setUTCDate(d.getUTCDate()+1);
}
const expectedSet = new Set(expectedKeys);

const missingKeys = expectedKeys.filter(k => !officialMap[k]);
const extraKeys   = Object.keys(officialMap).filter(k => !expectedSet.has(k));
let   orderErrors = 0;
const orderEx     = [];

for (const [key, r] of Object.entries(officialMap)) {
    for (let i = 1; i < ORDER.length; i++) {
        if (toMins(r[ORDER[i-1]]) >= toMins(r[ORDER[i]])) {
            orderErrors++;
            if (orderEx.length < 3)
                orderEx.push(`${key}: ${ORDER[i-1]}=${r[ORDER[i-1]]} >= ${ORDER[i]}=${r[ORDER[i]]}`);
        }
    }
}

const SEP = '═'.repeat(68);
console.log('\n' + SEP);
console.log('STEP 3 — OFFICIAL FILE VALIDATION');
console.log(SEP);
console.log(`Day count:    ${officialRows.length} / 366 ${officialRows.length === 366 ? '✅' : '❌'}`);
console.log(`Missing keys: ${missingKeys.length === 0 ? '✅ None' : '❌ ' + missingKeys.join(', ')}`);
console.log(`Extra keys:   ${extraKeys.length === 0   ? '✅ None' : '❌ ' + extraKeys.join(', ')}`);
console.log(`Time order:   ${orderErrors === 0 ? '✅ All 366 days OK' : '❌ ' + orderErrors + ' violations'}`);
if (orderEx.length) orderEx.forEach(e => console.log('  ⚠', e));

if (officialRows.length !== 366 || missingKeys.length > 0 || extraKeys.length > 0 || orderErrors > 0) {
    console.error('\n❌ Official file validation failed — aborting rebuild.');
    process.exit(1);
}

// ─── Step 4: Overwrite dataset.ts ────────────────────────────────────────────
const currentDS = fs.readFileSync(DS_PATH, 'utf8');

// The RAW block is between the first backtick after "const RAW = `" and the closing "`;"
// Replace the entire RAW block with the official file content
const rawBlock = officialRows.join('\n');

// Build new RAW string: header + all official data rows
const fullRaw = headerLine + '\n' + rawBlock;

// Escape backticks and template literal syntax in the raw block for embedding
const escaped = fullRaw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

// Replace existing RAW const block
const newDS = currentDS.replace(
    /const RAW = `[\s\S]*?`;/,
    'const RAW = `' + escaped + '`;'
);

if (newDS === currentDS) {
    console.error('\n❌ Could not locate RAW block in dataset.ts — pattern mismatch.');
    process.exit(1);
}

fs.writeFileSync(DS_PATH, newDS, 'utf8');
console.log(`\n✅ dataset.ts overwritten with official raw source (${officialRows.length} rows)`);

// ─── Step 5: Re-parse dataset.ts and build lookup ─────────────────────────────
const rebuilt = fs.readFileSync(DS_PATH, 'utf8');
const rebuildMatch = rebuilt.match(/const RAW = `([\s\S]*?)`;/);
if (!rebuildMatch) { console.error('Cannot re-parse dataset.ts after write'); process.exit(1); }

const rebuildMap = {};
for (const line of rebuildMatch[1].split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
    if (line.startsWith('Aý;') || line.startsWith('Ay;')) continue;
    const cols = line.split(';');
    if (cols.length < 9) continue;
    const mm  = MONTHS[cols[0].trim()];
    if (!mm) continue;
    const dd  = String(parseInt(cols[1].trim(), 10)).padStart(2, '0');
    rebuildMap[`${mm}-${dd}`] = {
        rawLine: line.trim(),
        fajr:    norm(cols[3]),
        sunrise: norm(cols[4]),
        dhuhr:   norm(cols[5]),
        asr:     norm(cols[6]),
        maghrib: norm(cols[7]),
        isha:    norm(cols[8]),
    };
}

// ─── Step 6: Full 366-row diff ────────────────────────────────────────────────
console.log('\n' + SEP);
console.log('STEP 6 — FULL 366-ROW DIFF: Official vs Rebuilt dataset.ts');
console.log(SEP);

let mismatches = 0;
let missing    = 0;
let extra      = 0;
const mismatchRows = [];

for (const key of expectedKeys) {
    const off = officialMap[key];
    const ds  = rebuildMap[key];
    if (!ds) {
        missing++;
        mismatchRows.push(`  ${key}: MISSING in rebuilt dataset`);
        continue;
    }
    const diffs = ORDER.filter(f => off[f] !== ds[f]);
    if (diffs.length > 0) {
        mismatches++;
        const details = diffs.map(f => `${f}: official=${off[f]} rebuilt=${ds[f]}`).join(' | ');
        mismatchRows.push(`  ${key}: ${details}`);
    }
}
for (const key of Object.keys(rebuildMap)) {
    if (!expectedSet.has(key)) extra++;
}

if (mismatchRows.length > 0) {
    mismatchRows.forEach(r => console.log(r));
}

console.log('\n' + SEP);
console.log(`Mismatches: ${mismatches}`);
console.log(`Missing:    ${missing}`);
console.log(`Extra:      ${extra}`);

const PASS = mismatches === 0 && missing === 0 && extra === 0;
console.log('\n' + (PASS
    ? '✅ FINAL RESULT: PASS — dataset.ts is exact copy of official raw source.'
    : '❌ FINAL RESULT: FAIL — see mismatches above.'));
console.log(SEP + '\n');
