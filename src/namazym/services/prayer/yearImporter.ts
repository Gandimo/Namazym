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

const HEADER_TOKENS = new Set([
    'Aý',
    'Ay',
    'Gün',
    'Gun',
    'Agyz beklenýän',
    'Agyz beklenen',
    'Agyz beklenýän wagty',
    'Ertir namazy',
    'Günüň dogýan',
    'Günüň dogýan wagty',
    'Gun dogyany',
    'Öýle namazy',
    'Ikindi namazy',
    'Agşam namazy',
    'Ýassy namazy',
]);

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

function readDelimitedSource(sourcePath: string): { rawText: string; rowsRead: number } {
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

function readRtfSource(sourcePath: string): { rawText: string; rowsRead: number } {
    const converted = childProcess.spawnSync(
        'textutil',
        ['-convert', 'txt', '-stdout', sourcePath],
        { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
    );
    if (converted.status !== 0) {
        throw new Error(`Failed to parse rtf source: ${converted.stderr || converted.stdout}`);
    }

    const tokens = String(converted.stdout)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    const rows: string[] = [];
    let currentMonth: string | null = null;

    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];

        if (HEADER_TOKENS.has(token)) {
            i += 1;
            continue;
        }

        if (MONTH_TO_NUMBER[token]) {
            currentMonth = token;
            i += 1;
            continue;
        }

        if (!currentMonth) {
            i += 1;
            continue;
        }

        const rangeMatch = token.match(/^(\d{1,2})-(\d{1,2})$/);
        const singleMatch = token.match(/^\d{1,2}$/);
        if (!rangeMatch && !singleMatch) {
            i += 1;
            continue;
        }

        const timeTokens = tokens.slice(i + 1, i + 8);
        if (timeTokens.length < 7) {
            throw new Error(`Malformed rtf source near token "${token}"`);
        }

        const normalizedTimes = timeTokens.map(normalizeTime);
        const startDay = rangeMatch ? Number(rangeMatch[1]) : Number(singleMatch![0]);
        const endDay = rangeMatch ? Number(rangeMatch[2]) : Number(singleMatch![0]);
        if (!Number.isInteger(startDay) || !Number.isInteger(endDay) || startDay < 1 || endDay > 31 || startDay > endDay) {
            throw new Error(`Invalid day token in rtf source: "${token}"`);
        }

        for (let day = startDay; day <= endDay; day += 1) {
            rows.push([
                currentMonth,
                String(day),
                normalizedTimes[0],
                normalizedTimes[1],
                normalizedTimes[2],
                normalizedTimes[3],
                normalizedTimes[4],
                normalizedTimes[5],
                normalizedTimes[6],
            ].join(';'));
        }

        i += 8;
    }

    if (rows.length === 0) {
        throw new Error('RTF source did not produce any timetable rows');
    }

    return {
        rawText: `${HEADER}\n${rows.join('\n')}`,
        rowsRead: rows.length,
    };
}

function readXlsxSource(sourcePath: string): { rawText: string; rowsRead: number; sheetsUsed: string[] } {
    const script = `
import json, zipfile, xml.etree.ElementTree as ET
from pathlib import Path

path = Path(${JSON.stringify(sourcePath)})
ns = {'a': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

month_map = {
    'Aý': 'Ýanwar',
    'Ay': 'Ýanwar',
    'month': 'Ýanwar',
    'January': 'Ýanwar',
    'Yanwar': 'Ýanwar',
    'Ýanwar': 'Ýanwar',
    'Ocak': 'Ýanwar',
    'Fewral': 'Fewral',
    'Şubat': 'Fewral',
    'Subat': 'Fewral',
    'Mart': 'Mart',
    'Aprel': 'Aprel',
    'Nisan': 'Aprel',
    'Maý': 'Maý',
    'May': 'Maý',
    'Mayıs': 'Maý',
    'Mayis': 'Maý',
    'Iýun': 'Iýun',
    'Haziran': 'Iýun',
    'Iýul': 'Iýul',
    'Temmuz': 'Iýul',
    'Awgust': 'Awgust',
    'Ağustos': 'Awgust',
    'Agustos': 'Awgust',
    'Sentyabr': 'Sentýabr',
    'Sentýabr': 'Sentýabr',
    'Eylül': 'Sentýabr',
    'Eylul': 'Sentýabr',
    'Oktyabr': 'Oktýabr',
    'Oktýabr': 'Oktýabr',
    'Ekim': 'Oktýabr',
    'Ekım': 'Oktýabr',
    'Noýabr': 'Noýabr',
    'Kasım': 'Noýabr',
    'Kasim': 'Noýabr',
    'Dekabr': 'Dekabr',
    'Aralık': 'Dekabr',
    'Aralik': 'Dekabr',
}

def normalize_day(value):
    text = str(value).strip().rstrip('.')
    return str(int(float(text)))

def normalize_time(value):
    text = str(value).strip()
    if text == '':
        raise ValueError('Empty time value')

    normalized = text.replace(',', '.')
    try:
        numeric = float(normalized)
        if 0 <= numeric < 1:
            total_minutes = int(round(numeric * 24 * 60))
            total_minutes = max(0, min(total_minutes, 23 * 60 + 59))
            h, m = divmod(total_minutes, 60)
            return f'{h:02d}:{m:02d}'
    except Exception:
        pass

    if ':' in text:
        parts = text.split(':')
        if len(parts) >= 2:
            h = int(float(parts[0]))
            m = int(float(parts[1]))
            if h < 0 or h > 23 or m < 0 or m > 59:
                raise ValueError(f'Invalid time value: {value}')
            return f'{h:02d}:{m:02d}'

    raise ValueError(f'Unsupported time value: {value}')

with zipfile.ZipFile(path) as z:
    workbook = ET.fromstring(z.read('xl/workbook.xml'))
    sheet_names = [s.attrib['name'] for s in workbook.find('a:sheets', ns)]

    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        sst = ET.fromstring(z.read('xl/sharedStrings.xml'))
        for si in sst.findall('a:si', ns):
            shared.append(''.join(t.text or '' for t in si.iterfind('.//a:t', ns)))

    rows = []
    for idx, sheet_name in enumerate(sheet_names, start=1):
        root = ET.fromstring(z.read(f'xl/worksheets/sheet{idx}.xml'))
        sheet_rows = list(root.find('a:sheetData', ns))
        active_month = month_map.get(sheet_name)

        for row_idx, row in enumerate(sheet_rows):
            values = []
            for c in row.findall('a:c', ns):
                t = c.attrib.get('t')
                v = c.find('a:v', ns)
                value = v.text if v is not None else ''
                if t == 's' and value != '':
                    value = shared[int(value)]
                values.append(str(value).strip())

            if not values:
                continue

            first = values[0].strip().strip('"') if len(values) > 0 else ''
            second = values[1].strip().strip('"') if len(values) > 1 else ''
            first_lower = first.lower()
            second_lower = second.lower()

            if first_lower in {'aý', 'ay', 'month'} and second_lower in {'gün', 'gun', 'day'}:
                continue

            month_tk = None
            day = None
            payload = []

            # Format A: One-sheet tabular export. Example row:
            # Ocak;1;0.2868;0.3145;...
            if first in month_map and second != '':
                month_tk = month_map.get(first)
                active_month = month_tk
                day = normalize_day(second)
                payload = values[2:9]
            elif first in {'', '"'} and active_month and second != '':
                # One-sheet exports commonly keep month only on the first row of the block.
                month_tk = active_month
                day = normalize_day(second)
                payload = values[2:9]
            else:
                # Format B: Sheet-per-month export. Example row:
                # 1;06:14;06:54;...
                if row_idx == 0 and first in month_map and second_lower in {'gün', 'gun', 'day', ''}:
                    continue
                month_tk = month_map.get(sheet_name) or month_map.get(first) or active_month
                if not month_tk:
                    continue
                active_month = month_tk
                day = normalize_day(first)
                payload = values[1:8]

            if len(payload) < 7:
                continue

            agyz, fajr, sunrise, dhuhr, asr, maghrib, isha = [normalize_time(v) for v in payload[:7]]
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
    const requestedPath = path.resolve(input.sourcePath);
    const sourcePath = (() => {
        if (fs.existsSync(requestedPath)) return requestedPath;
        if (path.extname(requestedPath)) return requestedPath;
        const candidates = ['.txt', '.csv', '.xlsx', '.rtf']
            .map((ext) => `${requestedPath}${ext}`)
            .filter((candidate) => fs.existsSync(candidate));
        return candidates[0] ?? requestedPath;
    })();

    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Source file not found: ${sourcePath}`);
    }

    const ext = path.extname(sourcePath).toLowerCase();
    let rawText = '';
    let rowsRead = 0;
    let sheetsUsed: string[] = [];
    let sourceType: 'txt' | 'csv' | 'xlsx' | 'rtf';

    if (ext === '.txt') {
        sourceType = 'txt';
        const txt = readDelimitedSource(sourcePath);
        rawText = txt.rawText;
        rowsRead = txt.rowsRead;
    } else if (ext === '.csv') {
        sourceType = 'csv';
        const csv = readDelimitedSource(sourcePath);
        rawText = csv.rawText;
        rowsRead = csv.rowsRead;
    } else if (ext === '.xlsx') {
        sourceType = 'xlsx';
        const xlsx = readXlsxSource(sourcePath);
        rawText = xlsx.rawText;
        rowsRead = xlsx.rowsRead;
        sheetsUsed = xlsx.sheetsUsed;
    } else if (ext === '.rtf') {
        sourceType = 'rtf';
        const rtf = readRtfSource(sourcePath);
        rawText = rtf.rawText;
        rowsRead = rtf.rowsRead;
    } else {
        throw new Error(`Unsupported source extension: ${ext}. Expected .txt, .csv, .xlsx, or .rtf`);
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
