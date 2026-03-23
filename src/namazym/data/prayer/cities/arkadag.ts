import type { CityYearDataset } from '../../../services/prayer/types';
import { ahalDataset } from './ahal';

/**
 * Arkadag intentionally reuses Ahal canonical official timetable.
 * This is an approved controlled dataset reuse, not computed interpolation.
 */
export const arkadagDataset: CityYearDataset | null = ahalDataset;
