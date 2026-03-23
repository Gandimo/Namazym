import { importYearSource } from './yearImporter';
import { parseRaw } from './parser';
import { validate } from './validator';
import { PRAYER_DATASET } from '../../data/prayer/prayerDataset';
import { CITY_MANIFEST } from '../../data/prayer/cityManifest';
import { buildManifest, writeManifestFile, MANIFEST_FILE_PATH } from './cityManifest';
import { buildYearChangeReport, computeDriftWarnings, formatReport } from './changeReport';
import type { CityYearDataset, SupportedCity, ValidationSummary } from './types';

declare const require: any;
declare const process: any;

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const CITY_FILE_DIR = path.join(process.cwd(), 'src/namazym/data/prayer/cities');

function parseCliArgs(argv: string[]): { city: SupportedCity; year: number; source: string } {
    const args = new Map<string, string>();
    for (const token of argv) {
        if (!token.startsWith('--')) continue;
        const [k, v] = token.slice(2).split('=');
        args.set(k, v ?? '');
    }

    const city = args.get('city') as SupportedCity | undefined;
    const yearText = args.get('year');
    const source = args.get('source');
    if (!city || !yearText || !source) {
        throw new Error('Usage: --city=<city> --year=<year> --source=<txt|xlsx path>');
    }
    const year = Number(yearText);
    if (!Number.isInteger(year) || year < 1900 || year > 2500) {
        throw new Error(`Invalid year: ${yearText}`);
    }
    if (!(city in PRAYER_DATASET)) {
        throw new Error(`Unsupported city: ${city}`);
    }

    return { city, year, source };
}

function sortYearDataset(data: CityYearDataset): CityYearDataset {
    const sorted = Object.keys(data)
        .sort((a, b) => Number(a) - Number(b))
        .reduce((acc, year) => {
            acc[year] = data[year];
            return acc;
        }, {} as CityYearDataset);
    return sorted;
}

function renderCityFile(city: SupportedCity, yearly: CityYearDataset): string {
    return [
        `import type { CityYearDataset } from '../../../services/prayer/types';`,
        ``,
        `export const ${city}Dataset: CityYearDataset = ${JSON.stringify(sortYearDataset(yearly), null, 4)};`,
        ``,
    ].join('\n');
}

function cityFilePath(city: SupportedCity): string {
    return path.join(CITY_FILE_DIR, `${city}.ts`);
}

function latestPreviousYear(yearly: CityYearDataset, targetYear: number): string | null {
    const previous = Object.keys(yearly)
        .map(Number)
        .filter((year) => year < targetYear)
        .sort((a, b) => b - a)[0];
    return Number.isFinite(previous) ? String(previous) : null;
}

function failValidation(message: string): ValidationSummary {
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

function runSelfCheck(): { passed: boolean; output: string } {
    const outDir = '/tmp/namazym-prayer-selfcheck';
    const compile = childProcess.spawnSync(
        './node_modules/.bin/tsc',
        [
            '--outDir', outDir,
            '--module', 'commonjs',
            '--target', 'es2020',
            '--esModuleInterop', 'true',
            '--skipLibCheck',
            'src/namazym/services/prayer/selfCheck.ts',
        ],
        { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
    );
    if (compile.status !== 0) {
        return { passed: false, output: compile.stderr || compile.stdout || 'self-check compile failed' };
    }

    const selfCheckJs = fs.existsSync(path.join(outDir, 'services/prayer/selfCheck.js'))
        ? path.join(outDir, 'services/prayer/selfCheck.js')
        : path.join(outDir, 'src/namazym/services/prayer/selfCheck.js');

    const run = childProcess.spawnSync(
        'node',
        [selfCheckJs],
        { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
    );
    return {
        passed: run.status === 0,
        output: `${run.stdout || ''}${run.stderr || ''}`.trim(),
    };
}

export function runUpdatePipeline(input: { city: SupportedCity; year: number; sourcePath: string }) {
    const imported = importYearSource({
        city: input.city,
        year: input.year,
        sourcePath: input.sourcePath,
    });

    let parsedDataset;
    const parseErrors: string[] = [];
    try {
        parsedDataset = parseRaw(imported.rawText);
    } catch (err) {
        parseErrors.push(err instanceof Error ? err.message : String(err));
        parsedDataset = null;
    }

    const validation = parsedDataset
        ? validate(parsedDataset, {
            year: input.year,
            sourceRows: imported.meta.rowsRead,
            duplicateKeys: imported.meta.duplicateKeys,
        })
        : failValidation(parseErrors[0] ?? 'Parse failed');

    const existing = (PRAYER_DATASET[input.city].data ?? {}) as CityYearDataset;
    const prevYear = latestPreviousYear(existing, input.year);
    const driftWarnings = (prevYear && parsedDataset)
        ? computeDriftWarnings(existing[prevYear], parsedDataset)
        : [];

    let selfCheckPassed = false;
    let published = false;

    const targetCityFile = cityFilePath(input.city);
    const oldCityFile = fs.existsSync(targetCityFile) ? fs.readFileSync(targetCityFile, 'utf8') : '';
    const oldManifest = fs.existsSync(MANIFEST_FILE_PATH) ? fs.readFileSync(MANIFEST_FILE_PATH, 'utf8') : '';

    if (validation.isValid && parsedDataset) {
        const merged: CityYearDataset = {
            ...existing,
            [String(input.year)]: parsedDataset,
        };
        const cityCode = renderCityFile(input.city, merged);
        fs.writeFileSync(targetCityFile, cityCode, 'utf8');

        const manifest = buildManifest(CITY_MANIFEST, {
            city: input.city,
            year: input.year,
            sourceType: imported.meta.sourceType,
            importedAt: new Date().toISOString(),
            status: 'ready',
        });
        writeManifestFile(manifest);

        const check = runSelfCheck();
        selfCheckPassed = check.passed;

        if (selfCheckPassed) {
            published = true;
        } else {
            fs.writeFileSync(targetCityFile, oldCityFile, 'utf8');
            if (oldManifest) {
                fs.writeFileSync(MANIFEST_FILE_PATH, oldManifest, 'utf8');
            } else if (fs.existsSync(MANIFEST_FILE_PATH)) {
                fs.unlinkSync(MANIFEST_FILE_PATH);
            }
        }
    }

    const report = buildYearChangeReport({
        city: input.city,
        year: input.year,
        sourcePath: imported.meta.sourcePath,
        sourceType: imported.meta.sourceType,
        rowsRead: imported.meta.rowsRead,
        rowsGenerated: parsedDataset ? Object.keys(parsedDataset).length : 0,
        duplicates: imported.meta.duplicateKeys.length,
        validation,
        parseErrors,
        driftWarnings,
        selfCheckPassed,
    });

    return { report, published };
}

export function runUpdateCli(argv: string[] = process.argv.slice(2)): number {
    try {
        const { city, year, source } = parseCliArgs(argv);
        const { report, published } = runUpdatePipeline({
            city,
            year,
            sourcePath: source,
        });
        console.log(formatReport(report));
        if (!published || !report.pass) return 1;
        return 0;
    } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        return 1;
    }
}

if (typeof require !== 'undefined' && require.main === module) {
    process.exit(runUpdateCli());
}
