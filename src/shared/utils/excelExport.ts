/**
 * Secure Excel Export Utility using ExcelJS
 * Replaces xlsx library to address security vulnerabilities
 */

// ExcelJS is ~940KB — loaded on demand so it never lands in route bundles.
const loadExcelJS = async () => (await import('exceljs')).default;

/**
 * Sanitize string values to prevent Excel formula injection
 */
export const sanitizeForExcel = (value: unknown): unknown => {
  if (typeof value === 'string') {
    // Prevent formula injection by prefixing dangerous characters
    if (value.startsWith('=') || value.startsWith('+') || value.startsWith('-') || value.startsWith('@')) {
      return `'${value}`;
    }
  }
  return value;
};

/**
 * Export data to Excel file
 * @param data Array of objects to export
 * @param filename Name of the file (without extension)
 * @param sheetName Name of the worksheet
 */
export const exportToExcel = async (
  data: unknown[],
  filename: string,
  sheetName: string = 'Sheet1'
): Promise<void> => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Create workbook and worksheet
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Add header row
  worksheet.addRow(headers);
  
  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows with sanitization
  data.forEach(item => {
    const row = headers.map(header => sanitizeForExcel(item[header]));
    worksheet.addRow(row);
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, cell => {
      const cellValue = cell.value ? cell.value.toString() : '';
      maxLength = Math.max(maxLength, cellValue.length);
    });
    column.width = Math.min(maxLength + 2, 50); // Max width of 50
  });

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Export multiple sheets to Excel file
 * @param sheets Array of sheet data with names
 * @param filename Name of the file (without extension)
 */
export const exportMultipleSheets = async (
  sheets: Array<{ name: string; data: unknown[] }>,
  filename: string
): Promise<void> => {
  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    if (!sheet.data || sheet.data.length === 0) continue;

    const worksheet = workbook.addWorksheet(sheet.name);
    const headers = Object.keys(sheet.data[0]);
    
    // Add header row
    worksheet.addRow(headers);
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    sheet.data.forEach(item => {
      const row = headers.map(header => sanitizeForExcel(item[header]));
      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, cell => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength + 2, 50);
    });
  }

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Normalize a raw ExcelJS cell value to a plain primitive so that files
 * edited in Excel survive the round trip back into the app:
 * - Excel auto-links emails/URLs → { text, hyperlink } objects
 * - formatting part of a cell → { richText: [...] } objects
 * - formulas → { formula, result } objects
 * - typed dates → JS Date objects (normalized to YYYY-MM-DD)
 * - our own formula-injection guard ('=foo) → leading apostrophe stripped
 */
export const normalizeCellValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('richText' in obj && Array.isArray(obj.richText)) {
      return (obj.richText as Array<{ text?: string }>).map((r) => r.text ?? '').join('');
    }
    if ('hyperlink' in obj) {
      return normalizeCellValue(obj.text ?? obj.hyperlink);
    }
    if ('formula' in obj || 'sharedFormula' in obj) {
      return normalizeCellValue(obj.result ?? '');
    }
    if ('error' in obj) {
      return null;
    }
    return value;
  }

  if (typeof value === 'string' && /^'[=+\-@]/.test(value)) {
    // Undo sanitizeForExcel's injection guard on re-import
    return value.slice(1);
  }

  return value;
};

/**
 * Convert a worksheet to row objects keyed by the first (header) row.
 * Headers are indexed by column number, so a blank header cell can't
 * shift every later column out of alignment.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sheetToJson = (worksheet: any): Record<string, unknown>[] => {
  const headers: string[] = [];
  const rows: Record<string, unknown>[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  worksheet.eachRow((row: any, rowNumber: number) => {
    if (rowNumber === 1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
        headers[colNumber - 1] = normalizeCellValue(cell.value)?.toString().trim() || '';
      });
    } else {
      const rowData: Record<string, unknown> = {};
      let hasValue = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      row.eachCell((cell: any, colNumber: number) => {
        const header = headers[colNumber - 1];
        if (header) {
          const v = normalizeCellValue(cell.value);
          rowData[header] = v;
          if (v !== null && v !== undefined && v !== '') hasValue = true;
        }
      });
      if (hasValue) rows.push(rowData);
    }
  });

  return rows;
};

/**
 * Parse CSV text into row objects keyed by the header row.
 * Handles quoted fields, escaped quotes, and CRLF line endings.
 */
export const parseCsvText = (text: string): Record<string, unknown>[] => {
  const t = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (inQuotes) {
      if (ch === '"') {
        if (t[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cur.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && t[i + 1] === '\n') i++;
        cur.push(field); field = '';
        if (cur.some(v => v.length > 0)) rows.push(cur);
        cur = [];
      } else field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    if (cur.some(v => v.length > 0)) rows.push(cur);
  }
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = (r[idx] ?? '').trim();
    });
    return obj;
  });
};

/**
 * Parse a spreadsheet file (.xlsx or .csv) to JSON
 * @param file file to parse
 * @returns Promise with array of objects
 */
export const parseExcelFile = async (file: File): Promise<unknown[]> => {
  const lowerName = file.name.toLowerCase();

  // ExcelJS only reads .xlsx; parse CSV from text directly.
  if (lowerName.endsWith('.csv') || file.type.toLowerCase().includes('csv')) {
    return parseCsvText(await file.text());
  }

  const ExcelJS = await loadExcelJS();
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  try {
    await workbook.xlsx.load(arrayBuffer);
  } catch {
    if (lowerName.endsWith('.xls')) {
      throw new Error('Legacy .xls files are not supported. Please re-save the file as .xlsx or .csv and try again.');
    }
    throw new Error('Could not read the spreadsheet. Please make sure it is a valid .xlsx or .csv file.');
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in file');
  }

  return sheetToJson(worksheet);
};
