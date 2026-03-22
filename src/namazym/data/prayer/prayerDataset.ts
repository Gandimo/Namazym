import type { PrayerDataset } from '../../services/prayer/types';
import { ashgabatDataset } from './cities/ashgabat';
import { ahalDataset }     from './cities/ahal';
import { balkanDataset }   from './cities/balkan';
import { dashoguzDataset } from './cities/dashoguz';
import { lebapDataset }    from './cities/lebap';
import { maryDataset }     from './cities/mary';

export const PRAYER_DATASET: PrayerDataset = {
    ashgabat: { city: 'ashgabat', data: ashgabatDataset, status: ashgabatDataset ? 'available' : 'empty' },
    ahal:     { city: 'ahal',     data: ahalDataset,     status: ahalDataset     ? 'available' : 'empty' },
    balkan:   { city: 'balkan',   data: balkanDataset,   status: balkanDataset   ? 'available' : 'empty' },
    dashoguz: { city: 'dashoguz', data: dashoguzDataset, status: dashoguzDataset ? 'available' : 'empty' },
    lebap:    { city: 'lebap',    data: lebapDataset,    status: lebapDataset    ? 'available' : 'empty' },
    mary:     { city: 'mary',     data: maryDataset,     status: maryDataset     ? 'available' : 'empty' },
};
