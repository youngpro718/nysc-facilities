import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { normalizeCellValue, sanitizeForExcel, sheetToJson } from '../excelExport';

describe('normalizeCellValue', () => {
  it('passes through plain primitives', () => {
    expect(normalizeCellValue('hello')).toBe('hello');
    expect(normalizeCellValue(42)).toBe(42);
    expect(normalizeCellValue(null)).toBe(null);
    expect(normalizeCellValue(undefined)).toBe(undefined);
  });

  it('unwraps hyperlink cells (Excel auto-links emails and URLs)', () => {
    expect(
      normalizeCellValue({ text: 'jane@nycourts.gov', hyperlink: 'mailto:jane@nycourts.gov' })
    ).toBe('jane@nycourts.gov');
    expect(normalizeCellValue({ hyperlink: 'https://example.com' })).toBe('https://example.com');
  });

  it('flattens rich text cells (partial formatting in Excel)', () => {
    expect(
      normalizeCellValue({ richText: [{ text: 'Room ' }, { text: '100', font: { bold: true } }] })
    ).toBe('Room 100');
  });

  it('resolves formula cells to their result', () => {
    expect(normalizeCellValue({ formula: 'A1+B1', result: 12 })).toBe(12);
    expect(normalizeCellValue({ sharedFormula: 'A1', result: 'total' })).toBe('total');
  });

  it('normalizes Date cells to YYYY-MM-DD', () => {
    expect(normalizeCellValue(new Date('2026-03-15T00:00:00Z'))).toBe('2026-03-15');
  });

  it('strips the formula-injection guard apostrophe on re-import', () => {
    expect(normalizeCellValue(sanitizeForExcel('=SUM(A1:A9)'))).toBe('=SUM(A1:A9)');
    expect(normalizeCellValue(sanitizeForExcel('+12'))).toBe('+12');
    expect(normalizeCellValue(sanitizeForExcel('-pending'))).toBe('-pending');
    expect(normalizeCellValue(sanitizeForExcel('@user'))).toBe('@user');
    // Plain strings are untouched
    expect(normalizeCellValue(sanitizeForExcel('normal text'))).toBe('normal text');
    // Genuine leading apostrophes not followed by a formula char survive
    expect(normalizeCellValue("'quoted")).toBe("'quoted");
  });
});

describe('sheetToJson (export → edit in Excel → re-import round trip)', () => {
  const buildSheet = (build: (ws: ExcelJS.Worksheet) => void): ExcelJS.Worksheet => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Test');
    build(ws);
    return ws;
  };

  it('maps rows by header and normalizes Excel-mangled values', () => {
    const ws = buildSheet((s) => {
      s.addRow(['System ID', 'Room Name', 'Email', 'Capacity', 'Date']);
      s.addRow(['abc-123', { richText: [{ text: 'Central ' }, { text: 'Clerks' }] },
        { text: 'a@b.gov', hyperlink: 'mailto:a@b.gov' }, 25, new Date('2026-01-02T00:00:00Z')]);
    });

    const rows = sheetToJson(ws);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      'System ID': 'abc-123',
      'Room Name': 'Central Clerks',
      'Email': 'a@b.gov',
      'Capacity': 25,
      'Date': '2026-01-02',
    });
  });

  it('keeps columns aligned when a header cell is blank', () => {
    const ws = buildSheet((s) => {
      s.addRow(['A', '', 'C']);
      s.addRow([1, 2, 3]);
    });

    const rows = sheetToJson(ws);
    // Column B has no header so its value is dropped; column C must NOT shift
    expect(rows[0]).toEqual({ A: 1, C: 3 });
  });

  it('skips fully empty rows', () => {
    const ws = buildSheet((s) => {
      s.addRow(['A']);
      s.addRow([1]);
      s.addRow([]);
      s.addRow([2]);
    });

    expect(sheetToJson(ws)).toEqual([{ A: 1 }, { A: 2 }]);
  });
});
