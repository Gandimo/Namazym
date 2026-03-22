# Prayer Timetable Raw Data

Place official raw timetable files in this directory before importing.

## Expected file format

Each city's raw source should be a semicolon-separated text file:

```
Aý;Gün;Agyz beklenýän wagty;Ertir namazy;Günüň dogýan wagty;Öýle namazy;Ikindi namazy;Agşam namazy;Ýassy namazy
Ýanwar;1;6:37;7:17;8:27;13:30;16:04;17:44;19:04
Ýanwar;2;...
...
Dekabr;31;...
```

## Column mapping

| Column | Field | Imported as |
|--------|-------|-------------|
| Aý | Month (Turkmen) | used for MM-DD key |
| Gün | Day number | used for MM-DD key |
| Agyz beklenýän wagty | Imsak/Suhoor | **discarded** |
| Ertir namazy | Fajr | `fajr` |
| Günüň dogýan wagty | Sunrise | `sunrise` |
| Öýle namazy | Dhuhr | `dhuhr` |
| Ikindi namazy | Asr | `asr` |
| Agşam namazy | Maghrib | `maghrib` |
| Ýassy namazy | Isha | `isha` |

## Import workflow

```ts
import { importOfficialData } from '../../services/prayer/generator';

const raw = fs.readFileSync('./data/prayer/raw/ashgabat_official.txt', 'utf8');
const result = importOfficialData(raw, 'ashgabat');

if (result.success) {
    console.log('✅ Valid — 366 days imported');
    // Paste result into: src/namazym/data/prayer/cities/ashgabat.ts
} else {
    console.error('❌ Import failed:', result.validation.errors);
}
```

## Required day count

The dataset must contain **exactly 366 entries** (one per MM-DD key, including Feb 29).

Non-leap years: Feb 29 is present in the dataset but the engine skips it at runtime.

## Status

| City | File | Status |
|------|------|--------|
| Dashoguz | embedded in `dataset.ts` | ✅ Imported |
| Ashgabat | — | ⏳ Awaiting official data |
| Ahal | — | ⏳ Awaiting official data |
| Balkan | — | ⏳ Awaiting official data |
| Lebap | — | ⏳ Awaiting official data |
| Mary | — | ⏳ Awaiting official data |
