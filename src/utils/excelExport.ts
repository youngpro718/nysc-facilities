/**
 * Secure Excel Export Utility using ExcelJS
 * Replaces xlsx library to address security vulnerabilities
 */

import ExcelJS from 'exceljs';

/**
 * Sanitize string values to prevent Excel formula injection
 */
export const sanitizeForExcel = (value: any): any => {
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
  data: any[],
  filename: string,
  sheetName: string = 'Sheet1'
): Promise<void> => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Create workbook and worksheet
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
  sheets: Array<{ name: string; data: any[] }>,
  filename: string
): Promise<void> => {
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
 * Parse Excel file to JSON
 * @param file Excel file to parse
 * @returns Promise with array of objects
 */
export const parseExcelFile = async (file: File): Promise<any[]> => {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in file');
  }

  const data: any[] = [];
  const headers: string[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // First row is headers
      row.eachCell(cell => {
        headers.push(cell.value?.toString() || '');
      });
    } else {
      // Data rows
      const rowData: any = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          rowData[header] = cell.value;
        }
      });
      data.push(rowData);
    }
  });

  return data;
};
