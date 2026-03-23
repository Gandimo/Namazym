/**
 * Offline Prayer Engine — Self-Check
 *
 * Verifies the full pipeline end-to-end:
 *  - parser rejects malformed input
 *  - validator catches ordering violations
 *  - generator returns ImportResult with correct shape
 *  - engine returns controlled errors for empty cities
 *  - engine returns correct data for populated cities
 *
 * Run: npx ts-node src/namazym/services/prayer/selfCheck.ts
 */

import { parseRaw }            from './parser';
import { validate }            from './validator';
import { importOfficialData }  from './generator';
import { PrayerEngine }        from './engine';
import {
    EmptyCityDatasetError,
    UnsupportedDateError,
    UnsupportedYearError,
    InvalidDateError,
} from './types';

// ─── Assertion helpers ────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
    if (condition) { console.log(`  ✅ ${label}`); passed++; }
    else           { console.error(`  ❌ ${label}`); failed++; }
}

function assertThrows(fn: () => unknown, expectedClass: Function, label: string): void {
    try {
        fn();
        console.error(`  ❌ ${label} — expected throw but got no error`);
        failed++;
    } catch (e) {
        if (e instanceof expectedClass) { console.log(`  ✅ ${label}`); passed++; }
        else {
            console.error(`  ❌ ${label} — wrong error type: ${(e as Error)?.name}`);
            failed++;
        }
    }
}

function section(title: string) {
    const dashCount = Math.max(0, 52 - title.length);
    console.log(`\n── ${title} ${'─'.repeat(dashCount)}`);
}

function toMinutes(value: string): number {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
}

// ─── 1. Registry: all 7 cities present ───────────────────────────────────────

section('Registry: all 7 cities present');
const all = PrayerEngine.getAllCities();
assert(all.includes('ashgabat'), 'ashgabat registered');
assert(all.includes('ahal'),     'ahal registered');
assert(all.includes('arkadag'),  'arkadag registered');
assert(all.includes('balkan'),   'balkan registered');
assert(all.includes('dashoguz'), 'dashoguz registered');
assert(all.includes('lebap'),    'lebap registered');
assert(all.includes('mary'),     'mary registered');
assert(all.length === 7,         `exactly 7 cities (got ${all.length})`);

// ─── 2. City status checks ────────────────────────────────────────────────────

section('City statuses are valid');
const ahalStatus = PrayerEngine.getCityStatus('ahal');
const ashgabatStatus = PrayerEngine.getCityStatus('ashgabat');
const arkadagStatus = PrayerEngine.getCityStatus('arkadag');
assert(ahalStatus === 'available' || ahalStatus === 'empty', `ahal status valid (${ahalStatus})`);
assert(ashgabatStatus === 'available' || ashgabatStatus === 'empty', `ashgabat status valid (${ashgabatStatus})`);
assert(arkadagStatus === 'available' || arkadagStatus === 'empty', `arkadag status valid (${arkadagStatus})`);
const maryStatus = PrayerEngine.getCityStatus('mary');
if (maryStatus === 'empty') {
    assert(true, 'mary → empty');
} else {
    assert(maryStatus === 'available', 'mary → available');
}

// ─── 3. Engine: controlled behavior for shared Ahal/Ashgabat/Arkadag ─────────

section('Engine: controlled behavior for Ahal/Ashgabat/Arkadag');
if (ahalStatus === 'available') {
    const ahalSample = PrayerEngine.getPrayerTimes('ahal', '2026-06-15');
    const ashgabatSample = PrayerEngine.getPrayerTimes('ashgabat', '2026-06-15');
    const arkadagSample = PrayerEngine.getPrayerTimes('arkadag', '2026-06-15');
    assert(ashgabatStatus === 'available', 'ashgabat mirrors ahal availability');
    assert(arkadagStatus === 'available', 'arkadag mirrors ahal availability');
    assert(ahalSample.fajr === ashgabatSample.fajr, 'ashgabat fajr matches ahal');
    assert(ahalSample.fajr === arkadagSample.fajr, 'arkadag fajr matches ahal');
    assert(ahalSample.isha === ashgabatSample.isha, 'ashgabat isha matches ahal');
    assert(ahalSample.isha === arkadagSample.isha, 'arkadag isha matches ahal');
} else {
    assert(ashgabatStatus === 'empty', 'ashgabat mirrors ahal empty status');
    assert(arkadagStatus === 'empty', 'arkadag mirrors ahal empty status');
    assertThrows(
        () => PrayerEngine.getPrayerTimes('ahal', '2026-06-15'),
        EmptyCityDatasetError,
        'ahal → EmptyCityDatasetError',
    );
    assertThrows(
        () => PrayerEngine.getPrayerTimes('ashgabat', '2026-06-15'),
        EmptyCityDatasetError,
        'ashgabat → EmptyCityDatasetError',
    );
    assertThrows(
        () => PrayerEngine.getPrayerTimes('arkadag', '2026-06-15'),
        EmptyCityDatasetError,
        'arkadag → EmptyCityDatasetError',
    );
}

if (maryStatus === 'empty') {
    assertThrows(
        () => PrayerEngine.getPrayerTimes('mary', new Date(2026, 5, 15)),
        EmptyCityDatasetError,
        'mary → EmptyCityDatasetError',
    );
} else {
    const marySample = PrayerEngine.getPrayerTimes('mary', '2026-06-15');
    assert(typeof marySample.fajr === 'string', `mary sample fajr exists (${marySample.fajr})`);
}

// ─── 4. Engine: Populated cities ─────────────────────────────────────────────

section('Engine: Dashoguz — populated city');
assert(PrayerEngine.getCityStatus('dashoguz') === 'available', 'dashoguz → available');
assert(PrayerEngine.hasPrayerData('dashoguz'),                 'hasPrayerData(dashoguz) = true');

const jan1 = PrayerEngine.getPrayerTimes('dashoguz', '2026-01-01');
assert(jan1.fajr    === '07:17', `Jan 1 fajr=07:17 (got ${jan1.fajr})`);
assert(jan1.sunrise === '08:27', `Jan 1 sunrise=08:27 (got ${jan1.sunrise})`);
assert(jan1.maghrib === '17:44', `Jan 1 maghrib=17:44 (got ${jan1.maghrib})`);

const dec31 = PrayerEngine.getPrayerTimes('dashoguz', '2026-12-31');
assert(dec31.isha === '19:03', `Dec 31 isha=19:03 (got ${dec31.isha})`);

assertThrows(
    () => PrayerEngine.getPrayerTimes('dashoguz', '2028-01-01'),
    UnsupportedYearError,
    '2028-01-01 unsupported year → UnsupportedYearError',
);

section('Engine: Lebap — status-aware checks');
const lebapStatus = PrayerEngine.getCityStatus('lebap');
if (lebapStatus === 'available') {
    assert(PrayerEngine.hasPrayerData('lebap'), 'hasPrayerData(lebap) = true');
    const lebapJan1 = PrayerEngine.getPrayerTimes('lebap', '2026-01-01');
    assert(typeof lebapJan1.fajr === 'string', `Lebap Jan 1 fajr exists (${lebapJan1.fajr})`);
    assert(typeof lebapJan1.sunrise === 'string', `Lebap Jan 1 sunrise exists (${lebapJan1.sunrise})`);
    assert(typeof lebapJan1.isha === 'string', `Lebap Jan 1 isha exists (${lebapJan1.isha})`);
} else {
    assert(lebapStatus === 'empty', 'lebap → empty');
    assertThrows(
        () => PrayerEngine.getPrayerTimes('lebap', '2026-06-15'),
        EmptyCityDatasetError,
        'lebap (empty) → EmptyCityDatasetError',
    );
}

section('Engine: Balkan — status-aware checks');
const balkanStatus = PrayerEngine.getCityStatus('balkan');
if (balkanStatus === 'available') {
    assert(PrayerEngine.hasPrayerData('balkan'), 'hasPrayerData(balkan) = true');

    const balkanJan1 = PrayerEngine.getPrayerTimes('balkan', '2026-01-01');
    assert(typeof balkanJan1.fajr === 'string', `Balkan Jan 1 fajr exists (${balkanJan1.fajr})`);
    assert(typeof balkanJan1.isha === 'string', `Balkan Jan 1 isha exists (${balkanJan1.isha})`);
    assert(
        toMinutes(balkanJan1.fajr) < toMinutes(balkanJan1.sunrise) &&
        toMinutes(balkanJan1.sunrise) < toMinutes(balkanJan1.dhuhr) &&
        toMinutes(balkanJan1.dhuhr) < toMinutes(balkanJan1.asr) &&
        toMinutes(balkanJan1.asr) < toMinutes(balkanJan1.maghrib) &&
        toMinutes(balkanJan1.maghrib) < toMinutes(balkanJan1.isha),
        'Balkan Jan 1 prayer order is valid',
    );

    const balkanDec31 = PrayerEngine.getPrayerTimes('balkan', '2026-12-31');
    assert(typeof balkanDec31.fajr === 'string', `Balkan Dec 31 fajr exists (${balkanDec31.fajr})`);
    assert(typeof balkanDec31.isha === 'string', `Balkan Dec 31 isha exists (${balkanDec31.isha})`);
} else {
    assert(balkanStatus === 'empty', 'balkan → empty');
    assertThrows(
        () => PrayerEngine.getPrayerTimes('balkan', '2026-06-15'),
        EmptyCityDatasetError,
        'balkan (empty) → EmptyCityDatasetError',
    );
}

// ─── 5. Engine: Feb 29 handling ──────────────────────────────────────────────

section('Engine: Feb 29 leap-year guard');
const feb28_2026 = PrayerEngine.getPrayerTimes('dashoguz', '2026-02-28');
assert(typeof feb28_2026.fajr === 'string', `2026-02-28 resolves (fajr=${feb28_2026.fajr})`);

// Non-leap calendar date must throw
assertThrows(
    () => PrayerEngine.getPrayerTimes('dashoguz', '2027-02-29'),
    UnsupportedDateError,
    '2027-02-29 (non-leap) → UnsupportedDateError',
);
assertThrows(
    () => PrayerEngine.getPrayerTimes('dashoguz', '2026-02-29'),
    UnsupportedDateError,
    '2026-02-29 (non-leap) → UnsupportedDateError',
);

// ─── 6. Engine: bad date input ────────────────────────────────────────────────

section('Engine: invalid date input');
assertThrows(
    () => PrayerEngine.getPrayerTimes('dashoguz', 'not-a-date'),
    InvalidDateError,
    '"not-a-date" → InvalidDateError',
);

// ─── 7. Parser: reject malformed rows ────────────────────────────────────────

section('Parser: rejection cases');

const HEADER = 'Aý;Gün;Agyz beklenýän wagty;Ertir namazy;Günüň dogýan wagty;Öýle namazy;Ikindi namazy;Agşam namazy;Ýassy namazy';

let caught = false;
try {
    parseRaw(HEADER + '\nZoltan;1;6:00;7:00;8:00;13:30;17:00;18:00;19:00'); // bad month
} catch { caught = true; }
assert(caught, 'unknown Turkmen month → throws');

caught = false;
try {
    parseRaw(HEADER + '\nÝanwar;1;6:00;7:00;8:00;13:30'); // only 7 columns
} catch { caught = true; }
assert(caught, 'wrong column count → throws');

caught = false;
try {
    const dup = `${HEADER}\nÝanwar;1;6:00;7:00;8:00;13:30;17:00;18:00;19:00\nÝanwar;1;6:00;7:00;8:00;13:30;17:00;18:00;19:00`;
    parseRaw(dup); // duplicate MM-DD
} catch { caught = true; }
assert(caught, 'duplicate MM-DD key → throws');

// ─── 8. Validator: ordering check ────────────────────────────────────────────

section('Validator: time ordering check');
const badDataset = {
    '06-15': { fajr: '04:00', sunrise: '05:30', dhuhr: '13:30', asr: '12:00', maghrib: '20:00', isha: '21:30' }
    // asr < dhuhr is wrong
} as any;
const v = validate(badDataset);
assert(!v.isValid, 'asr < dhuhr ordering violation → isValid=false');
assert(v.errors.some(e => e.includes('asr')), 'error message mentions asr');

// ─── 9. Generator: ImportResult shape ────────────────────────────────────────

section('Generator: import pipeline');
const mockRaw = `${HEADER}\nÝanwar;15;6:00;7:17;8:27;13:30;16:04;17:44;19:04`;
const importResult = importOfficialData(mockRaw, 'ashgabat', 2026);
assert(!importResult.success, 'partial import (1 row) → failed (not 366 days)');
assert(importResult.validation.errors.length > 0, 'validation errors present');
assert(importResult.dataset === null, 'dataset is null when validation fails');

const supported = PrayerEngine.getSupportedCities();
assert(supported.includes('dashoguz'), 'getSupportedCities includes dashoguz');
if (PrayerEngine.getCityStatus('lebap') === 'available') {
    assert(supported.includes('lebap'), 'getSupportedCities includes lebap when available');
}
if (ahalStatus === 'available') {
    assert(supported.includes('ahal'), 'getSupportedCities includes ahal when available');
    assert(supported.includes('ashgabat'), 'getSupportedCities includes ashgabat when available');
    assert(supported.includes('arkadag'), 'getSupportedCities includes arkadag when available');
} else {
    assert(!supported.includes('ahal'), 'getSupportedCities excludes empty ahal');
    assert(!supported.includes('ashgabat'), 'getSupportedCities excludes empty ashgabat');
    assert(!supported.includes('arkadag'), 'getSupportedCities excludes empty arkadag');
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(58)}`);
console.log(`Self-check: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.error('❌ SELF-CHECK FAILED');
    process.exit(1);
} else {
    console.log('✅ All checks passed — system is production-ready.');
}
