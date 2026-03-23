import type { PrayerDataset } from '../../services/prayer/types';
import { ashgabatDataset } from './cities/ashgabat';
import { ahalDataset }     from './cities/ahal';
import { arkadagDataset }  from './cities/arkadag';
import { balkanDataset }   from './cities/balkan';
import { dashoguzDataset } from './cities/dashoguz';
import { lebapDataset }    from './cities/lebap';
import { maryDataset }     from './cities/mary';

function hasYears(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    return Object.keys(data as Record<string, unknown>).length > 0;
}

export const PRAYER_DATASET: PrayerDataset = {
    ashgabat: { city: 'ashgabat', data: ashgabatDataset, status: hasYears(ashgabatDataset) ? 'available' : 'empty' },
    ahal:     { city: 'ahal',     data: ahalDataset,     status: hasYears(ahalDataset)     ? 'available' : 'empty' },
    arkadag:  { city: 'arkadag',  data: arkadagDataset,  status: hasYears(arkadagDataset)  ? 'available' : 'empty' },
    balkan:   { city: 'balkan',   data: balkanDataset,   status: hasYears(balkanDataset)   ? 'available' : 'empty' },
    dashoguz: { city: 'dashoguz', data: dashoguzDataset, status: hasYears(dashoguzDataset) ? 'available' : 'empty' },
    lebap:    { city: 'lebap',    data: lebapDataset,    status: hasYears(lebapDataset)    ? 'available' : 'empty' },
    mary:     { city: 'mary',     data: maryDataset,     status: hasYears(maryDataset)     ? 'available' : 'empty' },
};
