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
    console.log(`\n── ${title} ${'─'.repeat(52 - title.length)}`);
}

// ─── 1. Registry: all 6 cities present ───────────────────────────────────────

section('Registry: all 6 cities present');
const all = PrayerEngine.getAllCities();
assert(all.includes('ashgabat'), 'ashgabat registered');
assert(all.includes('ahal'),     'ahal registered');
assert(all.includes('balkan'),   'balkan registered');
assert(all.includes('dashoguz'), 'dashoguz registered');
assert(all.includes('lebap'),    'lebap registered');
assert(all.includes('mary'),     'mary registered');
assert(all.length === 6,         `exactly 6 cities (got ${all.length})`);

// ─── 2. Empty city status ─────────────────────────────────────────────────────

section('Empty cities return correct status');
assert(PrayerEngine.getCityStatus('ashgabat') === 'empty', 'ashgabat → empty');
assert(PrayerEngine.getCityStatus('ahal')     === 'empty', 'ahal → empty');
assert(PrayerEngine.getCityStatus('balkan')   === 'empty', 'balkan → empty');
assert(PrayerEngine.getCityStatus('mary')     === 'empty', 'mary → empty');

// ─── 3. Engine: EmptyCityDatasetError for unpopulated cities ─────────────────

section('Engine: controlled errors for empty cities');
assertThrows(
    () => PrayerEngine.getPrayerTimes('ashgabat', '2026-06-15'),
    EmptyCityDatasetError,
    'ashgabat → EmptyCityDatasetError',
);
assertThrows(
    () => PrayerEngine.getPrayerTimes('mary', new Date(2026, 5, 15)),
    EmptyCityDatasetError,
    'mary → EmptyCityDatasetError',
);

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

// Same MM-DD key works across years (year-agnostic)
const sameDay2028 = PrayerEngine.getPrayerTimes('dashoguz', '2028-01-01');
assert(sameDay2028.fajr === jan1.fajr, 'Jan 1 times identical for 2026 and 2028 (year-agnostic)');

section('Engine: Lebap — populated city');
assert(PrayerEngine.getCityStatus('lebap') === 'available', 'lebap → available');
assert(PrayerEngine.hasPrayerData('lebap'),                 'hasPrayerData(lebap) = true');

const lebapJan1 = PrayerEngine.getPrayerTimes('lebap', '2026-01-01');
assert(lebapJan1.fajr    === '06:55', `Lebap Jan 1 fajr=06:55 (got ${lebapJan1.fajr})`);
assert(lebapJan1.sunrise === '08:05', `Lebap Jan 1 sunrise=08:05 (got ${lebapJan1.sunrise})`);
assert(lebapJan1.maghrib === '17:40', `Lebap Jan 1 maghrib=17:40 (got ${lebapJan1.maghrib})`);

const lebapJul2 = PrayerEngine.getPrayerTimes('lebap', '2026-07-02');
assert(lebapJul2.fajr    === '04:14', `Lebap Jul 2 fajr=04:14 (got ${lebapJul2.fajr})`);
assert(lebapJul2.sunrise === '05:24', `Lebap Jul 2 sunrise=05:24 (got ${lebapJul2.sunrise})`);
assert(lebapJul2.isha    === '21:42', `Lebap Jul 2 isha=21:42 (got ${lebapJul2.isha})`);

const lebapDec31 = PrayerEngine.getPrayerTimes('lebap', '2026-12-31');
assert(lebapDec31.isha === '19:00', `Lebap Dec 31 isha=19:00 (got ${lebapDec31.isha})`);

// ─── 5. Engine: Feb 29 handling ──────────────────────────────────────────────

section('Engine: Feb 29 leap-year guard');
// 2028 is a leap year — Feb 29 should resolve
const feb29_2028 = PrayerEngine.getPrayerTimes('dashoguz', '2028-02-29');
assert(typeof feb29_2028.fajr === 'string', `2028-02-29 resolves (fajr=${feb29_2028.fajr})`);

// 2026 is not a leap year — Feb 29 must throw
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
const importResult = importOfficialData(mockRaw, 'ashgabat');
assert(!importResult.success, 'partial import (1 row) → failed (not 366 days)');
assert(importResult.validation.errors.length > 0, 'validation errors present');
assert(importResult.dataset === null, 'dataset is null when validation fails');

const supported = PrayerEngine.getSupportedCities();
assert(supported.includes('dashoguz'), 'getSupportedCities includes dashoguz');
assert(supported.includes('lebap'), 'getSupportedCities includes lebap');
assert(!supported.includes('ashgabat'), 'getSupportedCities excludes empty ashgabat');

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(58)}`);
console.log(`Self-check: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.error('❌ SELF-CHECK FAILED');
    process.exit(1);
} else {
    console.log('✅ All checks passed — system is production-ready.');
}
