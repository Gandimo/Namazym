/**
 * Ashgabat — Official Prayer Timetable
 *
 * STATUS: ⏳ Awaiting official data import
 *
 * HOW TO POPULATE:
 *   1. Obtain the official Ashgabat prayer timetable (366 rows, semicolon-separated)
 *   2. Run: importOfficialData(rawText, 'ashgabat') from generator.ts
 *   3. Verify ValidationSummary.isValid === true
 *   4. Call generateCityDataFile(rawText, 'ashgabat') to produce this file's content
 *   5. Paste the output here
 */

import type { Dataset } from '../../../services/prayer/types';

export const ashgabatDataset: Dataset | null = null;
