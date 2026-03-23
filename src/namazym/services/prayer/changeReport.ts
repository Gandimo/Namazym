import type {
    Dataset,
    DriftWarning,
    PrayerName,
    ValidationSummary,
    YearChangeReport,
} from './types';

const PRAYER_ORDER: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function toMinutes(value: string): number {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
}

/**
 * Compares two canonical year datasets and returns drift warnings.
 * This does NOT fail import by itself; it is informational for reviewer safety.
 */
export function computeDriftWarnings(
    previous: Dataset,
    next: Dataset,
    thresholdMinutes = 45,
): DriftWarning[] {
    const warnings: DriftWarning[] = [];
    const sharedKeys = Object.keys(previous).filter((key) => Boolean(next[key]));

    for (const key of sharedKeys) {
        const prev = previous[key];
        const curr = next[key];
        for (const prayer of PRAYER_ORDER) {
            const delta = Math.abs(toMinutes(curr[prayer]) - toMinutes(prev[prayer]));
            if (delta >= thresholdMinutes) {
                warnings.push({
                    key,
                    prayer,
                    previous: prev[prayer],
                    current: curr[prayer],
                    deltaMinutes: delta,
                });
            }
        }
    }

    return warnings.sort((a, b) => a.key.localeCompare(b.key) || a.prayer.localeCompare(b.prayer));
}

export function buildYearChangeReport(input: {
    city: YearChangeReport['city'];
    year: number;
    sourcePath: string;
    sourceType: 'txt' | 'xlsx';
    rowsRead: number;
    rowsGenerated: number;
    duplicates: number;
    validation: ValidationSummary;
    parseErrors: readonly string[];
    driftWarnings: readonly DriftWarning[];
    selfCheckPassed: boolean;
}): YearChangeReport {
    const pass = input.parseErrors.length === 0 && input.validation.isValid && input.selfCheckPassed;
    return {
        city: input.city,
        year: input.year,
        sourcePath: input.sourcePath,
        sourceType: input.sourceType,
        rowsRead: input.rowsRead,
        rowsGenerated: input.rowsGenerated,
        duplicates: input.duplicates,
        missing: input.validation.missing,
        extra: input.validation.extra,
        orderingErrors: input.validation.orderingErrors,
        parseErrors: input.parseErrors,
        validationErrors: input.validation.errors,
        driftWarnings: input.driftWarnings,
        selfCheckPassed: input.selfCheckPassed,
        pass,
    };
}

export function formatReport(report: YearChangeReport): string {
    const lines: string[] = [];
    lines.push(`source file used: ${report.sourcePath}`);
    lines.push(`source type: ${report.sourceType}`);
    lines.push(`city/year: ${report.city}/${report.year}`);
    lines.push(`rows read: ${report.rowsRead}`);
    lines.push(`rows generated: ${report.rowsGenerated}`);
    lines.push(`duplicates: ${report.duplicates}`);
    lines.push(`missing: ${report.missing}`);
    lines.push(`extra: ${report.extra}`);
    lines.push(`ordering errors: ${report.orderingErrors}`);
    lines.push(`drift warnings: ${report.driftWarnings.length}`);
    lines.push(`self-check: ${report.selfCheckPassed ? 'PASS' : 'FAIL'}`);
    if (report.parseErrors.length > 0) {
        lines.push(`parse errors: ${report.parseErrors.join(' | ')}`);
    }
    if (report.validationErrors.length > 0) {
        lines.push(`validation errors: ${report.validationErrors.slice(0, 6).join(' | ')}`);
    }
    lines.push(`FINAL ${report.pass ? 'PASS' : 'FAIL'}`);
    return lines.join('\n');
}
