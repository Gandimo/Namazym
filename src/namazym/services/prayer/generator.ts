/**
 * Offline Prayer Engine — Import Generator
 *
 * Wraps parser + validator for one city-year import.
 * This module never calculates prayer times; it only processes official inputs.
 */

import { parseRaw } from './parser';
import { validate } from './validator';
import type { SupportedCity, Dataset, ImportResult, ValidationSummary } from './types';

function countSourceRows(raw: string): number {
    const lines = raw
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    return Math.max(0, lines.length - 1);
}

function failSummary(message: string): ValidationSummary {
    return {
        isValid: false,
        sourceRows: 0,
        expectedRows: 0,
        totalDays: 0,
        duplicates: 0,
        missing: 0,
        extra: 0,
        orderingErrors: 0,
        errors: [message],
        warnings: [],
    };
}

/**
 * Full import pipeline: official raw text -> validated city-year dataset.
 */
export function importOfficialData(raw: string, city: SupportedCity, year: number): ImportResult {
    let dataset: Dataset;

    try {
        dataset = parseRaw(raw);
    } catch (err) {
        return {
            city,
            year,
            dataset: null,
            validation: failSummary(err instanceof Error ? err.message : String(err)),
            success: false,
        };
    }

    const sourceRows = countSourceRows(raw);
    const validation = validate(dataset, {
        year,
        sourceRows,
        duplicateKeys: [],
    });

    return {
        city,
        year,
        dataset: validation.isValid ? dataset : null,
        validation,
        success: validation.isValid,
    };
}

/**
 * Generates TypeScript source code for a city file with a single year.
 */
export function generateCityDataFile(
    raw: string,
    city: SupportedCity,
    year: number,
): { code: string; result: ImportResult } {
    const result = importOfficialData(raw, city, year);
    if (!result.success) {
        return {
            code: `// Import failed for ${city}/${year}\n// ${result.validation.errors.join('\n// ')}`,
            result,
        };
    }

    const escapedRaw = raw.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    const code = [
        `import { parseRaw } from '../../../services/prayer/parser';`,
        ``,
        `const RAW_${year} = \`${escapedRaw}\`;`,
        `const YEAR_${year} = parseRaw(RAW_${year});`,
        ``,
        `export const ${city}Dataset = {`,
        `  '${year}': YEAR_${year},`,
        `} as const;`,
    ].join('\n');

    return { code, result };
}
