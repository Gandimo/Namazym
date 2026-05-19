/**
 * Exact row-by-row comparison: 9 official rows vs dataset.ts embedded RAW
 */
const fs   = require('fs');
const path = require('path');

// ─── Official rows provided by user ──────────────────────────────────────────
const OFFICIAL_ROWS = [
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

const MONTHS = {
    'Ýanwar':'01','Fewral':'02','Mart':'03','Aprel':'04','Maý':'05','Iýun':'06',
    'Iýul':'07','Awgust':'08','Sentýabr':'09','Oktýabr':'10','Noýabr':'11','Dekabr':'12',
};

function norm(t) {
    const [h, m] = t.trim().split(':');
    return String(parseInt(h, 10)).padStart(2, '0') + ':' + m.trim().padStart(2, '0');
}

function parseRow(raw) {
    const cols = raw.split(';');
    return {
        key:     `${MONTHS[cols[0].trim()]}-${String(parseInt(cols[1], 10)).padStart(2,'0')}`,
        fajr:    norm(cols[3]),
        sunrise: norm(cols[4]),
        dhuhr:   norm(cols[5]),
        asr:     norm(cols[6]),
        maghrib: norm(cols[7]),
        isha:    norm(cols[8]),
    };
}

// ─── Parse official rows ──────────────────────────────────────────────────────
const official = OFFICIAL_ROWS.map(r => ({ raw: r, ...parseRow(r) }));

// ─── Extract RAW from dataset.ts ──────────────────────────────────────────────
const dsFile  = fs.readFileSync(
    path.join(__dirname, '../src/namazym/services/prayer/dataset.ts'), 'utf8',
);
const rawMatch = dsFile.match(/const RAW = `([^`]+)`/s);
if (!rawMatch) { console.error('Cannot extract RAW'); process.exit(1); }

// Build MM-DD lookup from dataset.ts embedded RAW
const dsLookup = {};
for (const line of rawMatch[1].split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
    if (line.startsWith('Aý;') || line.startsWith('Ay;')) continue;
    const cols = line.split(';');
    if (cols.length < 9) continue;
    const mm  = MONTHS[cols[0].trim()];
    if (!mm) continue;
    const dd  = String(parseInt(cols[1], 10)).padStart(2, '0');
    const key = `${mm}-${dd}`;
    dsLookup[key] = {
        raw:     line,
        fajr:    norm(cols[3]),
        sunrise: norm(cols[4]),
        dhuhr:   norm(cols[5]),
        asr:     norm(cols[6]),
        maghrib: norm(cols[7]),
        isha:    norm(cols[8]),
    };
}

// ─── Print comparison ─────────────────────────────────────────────────────────
const FIELDS = ['fajr','sunrise','dhuhr','asr','maghrib','isha'];
const SEP = '═'.repeat(72);

console.log('\n' + SEP);
console.log('ROW-BY-ROW COMPARISON: Official source vs dataset.ts embedded RAW');
console.log(SEP);

let allMatch = true;

for (const off of official) {
    const ds = dsLookup[off.key];
    const fieldDiffs = ds ? FIELDS.filter(f => off[f] !== ds[f]) : ['NOT FOUND'];
    const match = ds && fieldDiffs.length === 0;
    if (!match) allMatch = false;

    console.log(`\n┌─ ${off.key}`);
    console.log(`│  Official : ${off.raw}`);
    console.log(`│  Dataset  : ${ds ? ds.raw : '(missing)'}`);
    console.log(`│  Fields   : ${FIELDS.map(f => {
        if (!ds) return `${f}=MISSING`;
        const o = off[f], d = ds[f];
        return o === d ? `${f}=${o}✅` : `${f}=${o}↔${d}❌`;
    }).join('  ')}`);
    console.log(`└─ Exact match: ${match ? 'YES ✅' : 'NO ❌' + (ds ? ' — diff fields: ' + fieldDiffs.join(', ') : '')}`);
}

console.log('\n' + SEP);
if (allMatch) {
    console.log('VERDICT: ✅ ALL 9 ROWS MATCH — dataset.ts VERIFIED');
} else {
    const mismatchCount = official.filter(off => {
        const ds = dsLookup[off.key];
        return !ds || FIELDS.some(f => off[f] !== ds[f]);
    }).length;
    console.log(`VERDICT: ❌ ${mismatchCount} / ${official.length} ROWS MISMATCH — dataset.ts must be rebuilt from official source`);
}
console.log(SEP + '\n');
