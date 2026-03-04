# Namazym Development Tools

This directory contains scripts used during development for data validation, fixing datasets, and verifying adapters.

## Scripts

### `validate_quran.js`
Verifies that `quran_ar_full.json` and `quran_tm_full.json` have a key-by-key match and contain exactly 6236 verses.
**Usage:** `node tools/validate_quran.js`

### `fix_ramadan_ahal.js`
Maps Ahal's Ramadan data to Ashgabat's data as they share the same times, ensuring all cities in the imsakiye are populated.
**Usage:** `node tools/fix_ramadan_ahal.js`

### `verify_adapter.js`
Smoke test for the `PrayerTimesAdapter.getPrayerTimes` logic using the offline cache.
**Usage:** `node tools/verify_adapter.js`
