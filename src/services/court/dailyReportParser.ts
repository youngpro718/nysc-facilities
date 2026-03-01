import * as pdfjsLib from 'pdfjs-dist';
import type { ExtractedPart } from '@/components/court-operations/PDFExtractionPreview';
import { logger } from '@/lib/logger';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface TextItem {
  x: number;
  width: number;
  text: string;
}

interface ParsedRow {
  y: number;
  items: TextItem[];
}

export interface ColumnBounds {
  SENDING_PART: { min: number; max: number };
  DEFENDANT: { min: number; max: number };
  PURPOSE: { min: number; max: number };
  TRANSFER_DATE: { min: number; max: number };
  TOP_CHARGE: { min: number; max: number };
  STATUS: { min: number; max: number };
  EST_FIN_DATE: { min: number; max: number };
  ATTORNEYS: { min: number; max: number };
}

/**
 * Helper to get the full text of a row
 */
function getRowText(row: ParsedRow): string {
  return row.items.map(i => i.text).join(' ').trim();
}

/**
 * Filter items in a row by X bounds and join them
 */
function extractField(row: ParsedRow, bounds: { min: number; max: number }): string {
  return row.items
    .filter(i => i.x >= bounds.min && i.x < bounds.max)
    .map(i => i.text)
    .join(' ')
    .trim();
}

/**
 * Extract rows with their text items and precise X/Y coordinates using pdf.js
 */
async function extractRowsFromPDF(file: File): Promise<{ rows: ParsedRow[], errorDetails?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allRows: ParsedRow[] = [];
    let totalItemsFound = 0;

    if (!pdf || typeof pdf.numPages !== 'number') {
      return { rows: [], errorDetails: `PDF loaded but numPages is missing. PDF object: ${!!pdf}` };
    }

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items as Array<{ str: string; transform: number[]; width: number }>;

      totalItemsFound += items?.length || 0;

      // Group text items by Y position to reconstruct rows
      const pageRows: ParsedRow[] = [];

      for (const item of items) {
        if (!item || typeof item.str !== 'string') continue;
        if (item.str.trim() === '') continue; // Skip pure whitespace blocks

        const y = item.transform ? Math.round(item.transform[5]) : 0;
        const x = item.transform ? item.transform[4] : 0;

        // Find an existing row within +/- 4 points tolerance
        let row = pageRows.find(r => Math.abs(r.y - y) <= 4);
        if (!row) {
          row = { y, items: [] };
          pageRows.push(row);
        }
        row.items.push({ x, width: item.width || 0, text: item.str });
      }

      // Sort rows top-to-bottom (Y descending usually in PDF, origin is bottom-left)
      pageRows.sort((a, b) => b.y - a.y);

      // Sort items in each row left-to-right
      for (const row of pageRows) {
        row.items.sort((a, b) => a.x - b.x);
      }

      allRows.push(...pageRows);
    }

    if (allRows.length === 0) {
      return { rows: [], errorDetails: `Parsed ${pdf.numPages} pages. Total text items found: ${totalItemsFound}. However, 0 rows were constructed. (Maybe all items were whitespace?)` };
    }

    return { rows: allRows };
  } catch (err: any) {
    return { rows: [], errorDetails: `extractRowsFromPDF threw exception: ${err.message}` };
  }
}

/**
 * Parse the report header to extract date and building info
 */
function parseReportHeader(rows: ParsedRow[]): { reportDate: string; building: string } {
  let reportDate = '';
  let building = '';

  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const text = getRowText(rows[i]);
    const headerMatch = text.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s*AM\s*PM\s*REPORT\s*(\d{3})\s*CENTRE/i);
    if (headerMatch) {
      const [, dateStr, buildingCode] = headerMatch;
      building = `${buildingCode} Centre Street`;

      // Parse date
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        reportDate = `${year}-${month}-${day}`;
      }
      break;
    }
  }

  return { reportDate, building };
}

/**
 * Dynamically find the column X-coordinate boundaries based on the table header row
 */
function findColumnBounds(rows: ParsedRow[]): ColumnBounds {
  // Default bounds based on typical report layout
  const bounds: ColumnBounds = {
    SENDING_PART: { min: 0, max: 80 },
    DEFENDANT: { min: 80, max: 250 },
    PURPOSE: { min: 250, max: 300 },
    TRANSFER_DATE: { min: 300, max: 370 },
    TOP_CHARGE: { min: 370, max: 480 },
    STATUS: { min: 480, max: 660 },
    EST_FIN_DATE: { min: 660, max: 740 },
    ATTORNEYS: { min: 740, max: 2000 }
  };

  // Look for the header row in the first few pages
  for (const row of rows.slice(0, 100)) {
    const text = getRowText(row);
    if (text.includes('Defendant') && text.includes('Charge')) {
      logger.debug('Found header row for column mapping:', text);

      const defItem = row.items.find(i => i.text.includes('Defendant'));
      const purpItem = row.items.find(i => i.text.includes('P U R P') || i.text.includes('PURP'));
      const dateItem = row.items.find(i => i.text.includes('Trans') || i.text.includes('Date'));
      const chargeItem = row.items.find(i => i.text.includes('Charge'));
      const statusItem = row.items.find(i => i.text.includes('STATUS'));
      const estItem = row.items.find(i => i.text.includes('EST'));
      const attyItem = row.items.find(i => i.text.includes('Attorneys') || i.text.includes('Atts'));

      // Adjust dynamic max/min boundaries exactly midway between column headers
      if (defItem) {
        const mid = defItem.x - 5;
        bounds.SENDING_PART.max = mid;
        bounds.DEFENDANT.min = mid;
      }
      if (purpItem && defItem) {
        const mid = purpItem.x - 5;
        bounds.DEFENDANT.max = mid;
        bounds.PURPOSE.min = mid;
      }
      if (dateItem && purpItem) {
        const mid = dateItem.x - 5;
        bounds.PURPOSE.max = mid;
        bounds.TRANSFER_DATE.min = mid;
      }
      if (chargeItem && dateItem) {
        const mid = chargeItem.x - 5;
        bounds.TRANSFER_DATE.max = mid;
        bounds.TOP_CHARGE.min = mid;
      }
      if (statusItem && chargeItem) {
        const mid = statusItem.x - 5;
        bounds.TOP_CHARGE.max = mid;
        bounds.STATUS.min = mid;
      }
      if (estItem && statusItem) {
        const mid = estItem.x - 5;
        bounds.STATUS.max = mid;
        bounds.EST_FIN_DATE.min = mid;
      }
      if (attyItem && estItem) {
        const mid = attyItem.x - 5;
        bounds.EST_FIN_DATE.max = mid;
        bounds.ATTORNEYS.min = mid;
      }
      break;
    }
  }

  logger.debug('Mapped Bounds:', bounds);
  return bounds;
}

/**
 * Split rows into part blocks. Each block corresponds to a room/judge group.
 */
function splitIntoPartBlocks(rows: ParsedRow[]): ParsedRow[][] {
  const blocks: ParsedRow[][] = [];
  let currentBlock: ParsedRow[] = [];

  // Starts with exactly a 1-3 digit part number, then an all-caps justice name
  const partStartPattern = /^\d{1,3}\s+[A-Z]{2,}/;

  for (const row of rows) {
    const text = getRowText(row);

    // Skip headers and footers
    if (/AM\s*PM\s*REPORT/i.test(text)) continue;
    if (text.includes('Defendant') && text.includes('Charge')) continue; // Header row
    if (/^Sending\s*Part/i.test(text)) continue;
    if (/Date\s*Printed/i.test(text)) continue;
    if (/Page\s*\d+\s*of/i.test(text)) continue;

    if (partStartPattern.test(text) && currentBlock.length > 0) {
      blocks.push(currentBlock);
      currentBlock = [row];
    } else {
      currentBlock.push(row);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Parse a single part block extracting cases using strict coordinate bounds
 */
function parsePartBlock(rows: ParsedRow[], bounds: ColumnBounds): ExtractedPart | null {
  if (rows.length === 0) return null;

  const firstLine = getRowText(rows[0]);

  // Extract part number and justice
  const partMatch = firstLine.match(/^(\d{1,3})\s+([A-Z][A-Z\s.-]+)/);
  if (!partMatch) return null;

  const partNumber = partMatch[1];
  const judgeName = partMatch[2].trim();

  // Extract calendar day from entire block text
  const fullText = rows.map(getRowText).join(' ');
  let calendarDay = '';
  const calDayMatch = fullText.match(/Cal\s*(Mon|Tues|Wed|Thurs|Fri)/i);
  if (calDayMatch) {
    calendarDay = `Cal ${calDayMatch[1]}`;
  }

  // Extract OUT dates
  const outDates: string[] = [];
  const outMatch = fullText.match(/OUT\s+([\d/\-;,\s]+)/i);
  if (outMatch) {
    const dateStr = outMatch[1].trim();
    // Stop at any known unrelated word
    const cleanDateStr = dateStr.replace(/(Cal|AVAILABLE|CONF|CHAMBERS).*$/i, '').trim();
    const dates = cleanDateStr.split(/[;,]\s*/).map((d) => d.trim()).filter(Boolean);
    outDates.push(...dates);
  }

  // Check for block-level statuses
  const isAvailable = /AVAILABLE/i.test(fullText);
  const isConf = /\bCONF\b/i.test(fullText) && !/CONF\s/i.test(firstLine);
  const isChambers = /CHAMBERS/i.test(fullText);
  const sittingMatch = fullText.match(/SITTING\s+IN\s+PT\s*(\d+)/i);

  // Extract cases
  const cases: ExtractedPart['cases'] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineText = getRowText(row);

    // Skip the part header line
    if (i === 0 && /^(\d{1,3})\s+[A-Z]{2,}/.test(lineText)) continue;

    // Skip lines that are just "OUT ..." or "Cal Thurs"
    if (/^OUT\s/i.test(lineText)) continue;
    if (/^Cal\s*(Mon|Tues|Wed|Thurs|Fri)/i.test(lineText)) continue;

    // Use absolute column bounds to extract data
    const sendingPart = extractField(row, bounds.SENDING_PART);
    const defendant = extractField(row, bounds.DEFENDANT);
    const purpose = extractField(row, bounds.PURPOSE);
    const transferDate = extractField(row, bounds.TRANSFER_DATE);
    const topChargeLine = extractField(row, bounds.TOP_CHARGE);
    const statusLine = extractField(row, bounds.STATUS);
    const estFinDate = extractField(row, bounds.EST_FIN_DATE);
    const attorneys = extractField(row, bounds.ATTORNEYS);

    // We consider it a "case row" if it has at least a defendant, charge, purpose, or explicit status
    const hasData = defendant || topChargeLine || purpose || sendingPart;

    if (hasData) {
      // Clean up extracted fields

      // Top charge might be split or contain indictment numbers
      let topCharge = topChargeLine;
      const indMatch = defendant.match(/IND[-\s]?(\d{4,6}[-/]\d{2})/i) || topChargeLine.match(/IND[-\s]?(\d{4,6}[-/]\d{2})/i);

      // Clean up defendant name
      let cleanDefendant = defendant;
      if (indMatch && cleanDefendant.includes(indMatch[0])) {
        cleanDefendant = cleanDefendant.replace(indMatch[0], '').trim();
      }

      const isJuvenile = /\(J\)\*/.test(lineText) || /\(J\)\*/.test(cleanDefendant);
      cleanDefendant = cleanDefendant.replace(/\(J\)\*/, '').trim();

      cases.push({
        sending_part: sendingPart,
        defendant: cleanDefendant,
        purpose: purpose.toUpperCase(),
        transfer_date: transferDate,
        top_charge: topCharge,
        status: statusLine,
        calendar_date: '',
        case_count: 0,
        attorney: attorneys,
        estimated_final_date: estFinDate,
        is_juvenile: isJuvenile,
      });
    } else if (statusLine && cases.length > 0) {
      // If it's just an overflow status line (like a calendar count under the main status), append it to previous case
      const prevCase = cases[cases.length - 1];
      prevCase.status = prevCase.status ? `${prevCase.status}; ${statusLine}` : statusLine;
    }
  }

  // If no cases were parsed but we have block-level status info, create a placeholder case
  if (cases.length === 0) {
    const statusParts: string[] = [];
    if (isAvailable) statusParts.push('AVAILABLE');
    if (isConf) statusParts.push('CONF');
    if (isChambers) statusParts.push('CHAMBERS');
    if (sittingMatch) statusParts.push(`SITTING IN PT ${sittingMatch[1]}`);

    // Extract any calendar counts from the full text
    const calendarMatches = fullText.match(/CALENDAR\s*(?:\d{1,2}\/\d{1,2}\s*)?\(\d+\)/gi);
    if (calendarMatches) statusParts.push(...calendarMatches);

    if (statusParts.length > 0) {
      cases.push({
        sending_part: '',
        defendant: '',
        purpose: '',
        transfer_date: '',
        top_charge: '',
        status: statusParts.join('; '),
        calendar_date: '',
        case_count: 0,
        attorney: '',
        estimated_final_date: '',
        is_juvenile: false,
      });
    }
  }

  return {
    part: partNumber,
    judge: judgeName,
    calendar_day: calendarDay,
    out_dates: outDates,
    confidence: cases.some((c) => c.defendant || c.top_charge || c.purpose) ? 0.95 : 0.8,
    cases,
  };
}

/**
 * Parse a daily court report PDF file entirely client-side using coordinate mapping.
 */
export async function parseDailyReportPDF(file: File): Promise<{
  success: boolean;
  extracted_data?: {
    report_date: string;
    building: string;
    report_type: string;
    entries: ExtractedPart[];
  };
  error?: string;
}> {
  try {
    logger.debug('📄 Starting coordinated-based PDF extraction...');

    // Step 1: Extract rows with precise X, Y coordinates
    const { rows, errorDetails } = await extractRowsFromPDF(file);

    if (rows.length === 0) {
      return {
        success: false,
        error: `Could not extract text from the PDF. Diagnostic info: ${errorDetails || 'Unknown error'}`,
      };
    }

    logger.debug(`📝 Extracted ${rows.length} rows`);

    // Step 2: Parse header & Dynamically detect column boundaries
    const { reportDate, building } = parseReportHeader(rows);
    logger.debug(`📅 Report date: ${reportDate}, Building: ${building}`);

    const bounds = findColumnBounds(rows);

    // Step 3: Split into part blocks and parse each
    const blocks = splitIntoPartBlocks(rows);
    logger.debug(`📊 Found ${blocks.length} potential part blocks`);

    const entries: ExtractedPart[] = [];
    for (const block of blocks) {
      const parsed = parsePartBlock(block, bounds);
      if (parsed && (parsed.cases.length > 0 || parsed.out_dates.length > 0)) {
        entries.push(parsed);
      }
    }

    if (entries.length === 0) {
      return {
        success: false,
        error: 'No court parts could be extracted from the document. Please check the file format.',
      };
    }

    logger.debug(`✅ Successfully parsed ${entries.length} parts inside precision mapped columns`);

    return {
      success: true,
      extracted_data: {
        report_date: reportDate,
        building: building,
        report_type: 'AM PM REPORT',
        entries,
      },
    };
  } catch (error) {
    logger.error('PDF parsing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse PDF document.',
    };
  }
}
