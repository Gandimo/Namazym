import type { CityYearDataset } from '../../../services/prayer/types';
import { ahalRegionDatasets } from './ahal';
import { balkanRegionDatasets } from './balkan';
import { dasoguzRegionDatasets } from './dasoguz';
import { lebapRegionDatasets } from './lebap';
import { maryRegionDatasets } from './mary';

/** Resmi il tablosu + konumsal fark ile üretilen bölge veri setleri — ÜRETİLMİŞ DOSYA. */
export const REGION_DATASETS = {
    ...ahalRegionDatasets,
    ...balkanRegionDatasets,
    ...dasoguzRegionDatasets,
    ...lebapRegionDatasets,
    ...maryRegionDatasets,
} as const;

export type RegionPlaceKey = keyof typeof REGION_DATASETS;

export const REGION_PLACE_KEYS = Object.keys(REGION_DATASETS) as RegionPlaceKey[];

interface RegionDatasetEntry {
    city: RegionPlaceKey;
    data: CityYearDataset;
    status: 'available';
}

/** PRAYER_DATASET içine yayılacak girişler. */
export const REGION_DATASET_ENTRIES = Object.fromEntries(
    REGION_PLACE_KEYS.map((key) => [
        key,
        { city: key, data: REGION_DATASETS[key], status: 'available' as const },
    ]),
) as unknown as Record<RegionPlaceKey, RegionDatasetEntry>;

interface RegionManifestEntry {
    readonly canonicalYears: readonly number[];
    readonly sourceType: 'mixed';
    readonly lastImportedAt: string | null;
    readonly status: 'ready';
}

/**
 * CITY_MANIFEST içine yayılacak girişler. sourceType 'mixed': resmi il
 * tablosu (xlsx) + namazvakti.com konumsal farkından türetildi.
 */
export const REGION_MANIFEST_ENTRIES = Object.fromEntries(
    REGION_PLACE_KEYS.map((key) => [
        key,
        {
            canonicalYears: [2026, 2027] as const,
            sourceType: 'mixed' as const,
            lastImportedAt: '2026-09-01T00:00:00.000Z',
            status: 'ready' as const,
        },
    ]),
) as unknown as Record<RegionPlaceKey, RegionManifestEntry>;

