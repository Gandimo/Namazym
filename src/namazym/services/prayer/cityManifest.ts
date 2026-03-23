import type { CityManifest, SupportedCity } from './types';
import { PRAYER_DATASET } from '../../data/prayer/prayerDataset';

declare const require: any;
declare const process: any;

const fs = require('fs');
const path = require('path');

export const MANIFEST_FILE_PATH = path.join(
    process.cwd(),
    'src/namazym/data/prayer/cityManifest.ts',
);

function detectSourceType(existing: CityManifest[SupportedCity] | undefined, nextType?: 'txt' | 'csv' | 'xlsx' | 'rtf') {
    const current = existing?.sourceType ?? 'none';
    if (!nextType) return current;
    if (current === 'none') return nextType;
    if (current === nextType) return current;
    return 'mixed' as const;
}

export function buildManifest(
    previous: CityManifest | null,
    update?: {
        city: SupportedCity;
        year: number;
        sourceType: 'txt' | 'csv' | 'xlsx' | 'rtf';
        importedAt: string;
        status: 'ready' | 'failed';
    },
): CityManifest {
    const result = {} as Record<SupportedCity, CityManifest[SupportedCity]>;
    const cities = Object.keys(PRAYER_DATASET) as SupportedCity[];

    for (const city of cities) {
        const years = Object.keys(PRAYER_DATASET[city].data ?? {})
            .map((year) => Number(year))
            .filter((year) => Number.isFinite(year))
            .sort((a, b) => a - b);

        const previousEntry = previous?.[city];
        result[city] = {
            canonicalYears: years,
            sourceType: detectSourceType(previousEntry),
            lastImportedAt: previousEntry?.lastImportedAt ?? null,
            status: years.length > 0 ? 'ready' : 'empty',
        };
    }

    if (update) {
        const entry = result[update.city];
        const yearSet = new Set<number>(entry.canonicalYears);
        yearSet.add(update.year);
        result[update.city] = {
            canonicalYears: Array.from(yearSet).sort((a, b) => a - b),
            sourceType: detectSourceType(result[update.city], update.sourceType),
            lastImportedAt: update.importedAt,
            status: update.status,
        };
    }

    return result;
}

export function writeManifestFile(manifest: CityManifest): void {
    const code = [
        `import type { CityManifest } from '../../services/prayer/types';`,
        ``,
        `export const CITY_MANIFEST: CityManifest = ${JSON.stringify(manifest, null, 4)};`,
        ``,
    ].join('\n');
    fs.writeFileSync(MANIFEST_FILE_PATH, code, 'utf8');
}
