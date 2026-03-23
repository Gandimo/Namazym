import type { ImportSourceMeta, SupportedCity } from './types';

declare const require: any;

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const HEADER = 'Aý;Gün;Agyz beklenýän wagty;Ertir namazy;Günüň dogýan wagty;Öýle namazy;Ikindi namazy;Agşam namazy;Ýassy namazy';

const MONTH_TO_NUMBER: Record<string, string> = {
    'Ýanwar': '01',
    'Yanwar': '01',
    'Fewral': '02',
    'Mart': '03',
    'Aprel': '04',
    'Maý': '05',
    'May': '05',
    'Iýun': '06',
    'Iyun': '06',
    'Iýul': '07',
    'Iyul': '07',
    'Awgust': '08',
    'Sentýabr': '09',
    'Sentyabr': '09',
    'Oktýabr': '10',
    'Oktyabr': '10',
    'Noýabr': '11',
    'Dekabr': '12',
};

export interface YearImportInput {
    readonly city: SupportedCity;
    readonly year: number;
    readonly sourcePath: string;
}

export interface YearImportOutput {
    readonly city: SupportedCity;
    readonly year: number;
    readonly rawText: string;
    readonly meta: ImportSourceMeta;
}

function normalizeTime(raw: string): string {
    const [h, m] = raw.trim().split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        throw new Error(`Invalid time: "${raw}"`);
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function scanDuplicateKeys(rawText: string): string[] {
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const counts = new Map<string, number>();
    for (const line of lines) {
        if (line.startsWith('Aý;') || line.startsWith('Ay;') || line.startsWith('month;')) continue;
        const cols = line.split(';');
        if (cols.length !== 9) continue;
        const mm = MONTH_TO_NUMBER[cols[0].trim()];
        if (!mm) continue;
        const day = Number(cols[1]);
        if (!Number.isInteger(day)) continue;
        const key = `${mm}-${String(day).padStart(2, '0')}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([key]) => key)
        .sort();
}

function readTxtSource(sourcePath: string): { rawText: string; rowsRead: number } {
    const rawText = fs.readFileSync(sourcePath, 'utf8').trim();
    const rowsRead = Math.max(
        0,
        rawText
            .split(/\r?\n/)
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0).length - 1,
    );
    return { rawText, rowsRead };
}

function readXlsxSource(sourcePath: string): { rawText: string; rowsRead: number; sheetsUsed: string[] } {
    const script = `
import json, zipfile, xml.etree.ElementTree as ET
from pathlib import Path

path = Path(${JSON.stringify(sourcePath)})
ns = {'a': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

month_map = {
    'Yanwar': 'Ýanwar',
    'Fewral': 'Fewral',
    'Mart': 'Mart',
    'Aprel': 'Aprel',
    'Maý': 'Maý',
    'Iýun': 'Iýun',
    'Iýul': 'Iýul',
    'Awgust': 'Awgust',
    'Sentyabr': 'Sentýabr',
    'Oktyabr': 'Oktýabr',
    'Noýabr': 'Noýabr',
    'Dekabr': 'Dekabr',
}

with zipfile.ZipFile(path) as z:
    workbook = ET.fromstring(z.read('xl/workbook.xml'))
    sheet_names = [s.attrib['name'] for s in workbook.find('a:sheets', ns)]

    shared = []
    sst = ET.fromstring(z.read('xl/sharedStrings.xml'))
    for si in sst.findall('a:si', ns):
        shared.append(''.join(t.text or '' for t in si.iterfind('.//a:t', ns)))

    rows = []
    for idx, sheet_name in enumerate(sheet_names, start=1):
        root = ET.fromstring(z.read(f'xl/worksheets/sheet{idx}.xml'))
        sheet_rows = list(root.find('a:sheetData', ns))
        month = None
        for row_idx, row in enumerate(sheet_rows):
            values = []
            for c in row.findall('a:c', ns):
                t = c.attrib.get('t')
                v = c.find('a:v', ns)
                value = v.text if v is not None else ''
                if t == 's' and value != '':
                    value = shared[int(value)]
                values.append(str(value).strip())

            if row_idx == 0:
                month = values[0]
                continue
            if len(values) < 8:
                continue

            day = values[0].rstrip('.')
            agyz, fajr, sunrise, dhuhr, asr, maghrib, isha = values[1:8]
            month_tk = month_map.get(month, month)
            rows.append(';'.join([month_tk, str(int(day)), agyz, fajr, sunrise, dhuhr, asr, maghrib, isha]))

header = 'Aý;Gün;Agyz beklenýän wagty;Ertir namazy;Günüň dogýan wagty;Öýle namazy;Ikindi namazy;Agşam namazy;Ýassy namazy'
raw_text = header + '\\n' + '\\n'.join(rows)
print(json.dumps({'raw_text': raw_text, 'rows_read': len(rows), 'sheets_used': sheet_names}, ensure_ascii=False))
`;

    const completed = childProcess.spawnSync('python3', ['-c', script], {
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
    });
    if (completed.status !== 0) {
        throw new Error(`Failed to parse xlsx source: ${completed.stderr || completed.stdout}`);
    }
    const parsed = JSON.parse(completed.stdout.trim());
    return {
        rawText: String(parsed.raw_text).trim(),
        rowsRead: Number(parsed.rows_read),
        sheetsUsed: Array.isArray(parsed.sheets_used) ? parsed.sheets_used.map(String) : [],
    };
}

export function importYearSource(input: YearImportInput): YearImportOutput {
    const sourcePath = path.resolve(input.sourcePath);
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source file not found: ${sourcePath}`);
    }

    const ext = path.extname(sourcePath).toLowerCase();
    let rawText = '';
    let rowsRead = 0;
    let sheetsUsed: string[] = [];
    let sourceType: 'txt' | 'xlsx';

    if (ext === '.txt') {
        sourceType = 'txt';
        const txt = readTxtSource(sourcePath);
        rawText = txt.rawText;
        rowsRead = txt.rowsRead;
    } else if (ext === '.xlsx') {
        sourceType = 'xlsx';
        const xlsx = readXlsxSource(sourcePath);
        rawText = xlsx.rawText;
        rowsRead = xlsx.rowsRead;
        sheetsUsed = xlsx.sheetsUsed;
    } else {
        throw new Error(`Unsupported source extension: ${ext}. Expected .txt or .xlsx`);
    }

    const normalizedLines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line, idx) => {
            if (idx === 0) return HEADER;
            const cols = line.split(';');
            if (cols.length !== 9) return line;
            return [
                cols[0].trim(),
                String(Number(cols[1])),
                normalizeTime(cols[2]),
                normalizeTime(cols[3]),
                normalizeTime(cols[4]),
                normalizeTime(cols[5]),
                normalizeTime(cols[6]),
                normalizeTime(cols[7]),
                normalizeTime(cols[8]),
            ].join(';');
        });

    const normalizedRawText = normalizedLines.join('\n');
    const duplicateKeys = scanDuplicateKeys(normalizedRawText);

    return {
        city: input.city,
        year: input.year,
        rawText: normalizedRawText,
        meta: {
            sourcePath,
            sourceType,
            sheetsUsed,
            rowsRead,
            duplicateKeys,
        },
    };
}
