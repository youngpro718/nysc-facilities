import * as pdfjsLib from 'pdfjs-dist';
import type { ExtractedPart } from '@/components/court-operations/PDFExtractionPreview';
import { logger } from '@/lib/logger';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Extract text content from a PDF file using pdf.js
 */
async function extractTextFromPDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{ str: string; transform: number[] }>;

    // Group text items by Y position to reconstruct rows
    const rows = new Map<number, Array<{ x: number; text: string }>>();
    for (const item of items) {
      const y = Math.round(item.transform[5]); // Y position
      const x = item.transform[4]; // X position
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x, text: item.str });
    }

    // Sort rows by Y (descending = top to bottom) and items by X (left to right)
    const sortedRows = Array.from(rows.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, items]) =>
        items
          .sort((a, b) => a.x - b.x)
          .map((i) => i.text)
          .join(' ')
          .trim()
      )
      .filter((row) => row.length > 0);

    pages.push(sortedRows.join('\n'));
  }

  return pages;
}

/**
 * Parse the report header to extract date and building info
 */
function parseReportHeader(text: string): { reportDate: string; building: string } {
  // Match patterns like "11-21-25 AM PM REPORT 111 CENTRE STREET"
  const headerMatch = text.match(
    /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s*AM\s*PM\s*REPORT\s*(\d{3})\s*CENTRE/i
  );

  let reportDate = '';
  let building = '';

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
  }

  return { reportDate, building };
}

// Known purposes from the report
const KNOWN_PURPOSES = ['JS', 'HRG', 'SENT', 'MOT', 'PLEA', 'CONF', 'HEAR'];

// Known sending part patterns
const SENDING_PART_PATTERN = /^(PT\s*\d+|TAP\s*[A-Z]|OWN|RTA[-\s]?\d*|AP\s*\d+)/i;

/**
 * Parse a single part block from the report text.
 * Each part block starts with a part number + justice name.
 */
function parsePartBlock(lines: string[]): ExtractedPart | null {
  if (lines.length === 0) return null;

  const firstLine = lines[0];

  // Extract part number - first number or identifier at start of block
  const partMatch = firstLine.match(/^(\d{1,3})\s+([A-Z][A-Z]+)/);
  if (!partMatch) return null;

  const partNumber = partMatch[1];
  const judgeName = partMatch[2];

  // Extract calendar day
  let calendarDay = '';
  const calDayMatch = lines.join(' ').match(/Cal\s*(Mon|Tues|Wed|Thurs|Fri)/i);
  if (calDayMatch) {
    calendarDay = `Cal ${calDayMatch[1]}`;
  }

  // Extract OUT dates
  const outDates: string[] = [];
  const outMatch = lines.join(' ').match(/OUT\s+([\d/\-;,\s]+)/i);
  if (outMatch) {
    const dateStr = outMatch[1].trim();
    // Split on semicolons, commas, or multiple spaces
    const dates = dateStr.split(/[;,]\s*/).map((d) => d.trim()).filter(Boolean);
    outDates.push(...dates);
  }

  // Check for special statuses
  const fullText = lines.join(' ');
  const isAvailable = /AVAILABLE/i.test(fullText);
  const isConf = /\bCONF\b/i.test(fullText) && !/CONF\s/i.test(firstLine);
  const isChambers = /CHAMBERS/i.test(fullText);
  const sittingMatch = fullText.match(/SITTING\s+IN\s+PT\s*(\d+)/i);

  // Extract cases from the block
  const cases: ExtractedPart['cases'] = [];

  // Look for case data patterns in the lines
  // Cases typically have: sending_part, defendant, purpose, date, charge, status, attorney
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header-like lines
    if (/^(\d{1,3})\s+[A-Z]{2,}/.test(line) && i === 0) continue;
    if (/Cal\s*(Mon|Tues|Wed|Thurs|Fri)/i.test(line) && !SENDING_PART_PATTERN.test(line)) continue;
    if (/^OUT\s/i.test(line)) continue;

    // Try to detect a case line - look for sending part or defendant pattern
    const sendingPartMatch = line.match(SENDING_PART_PATTERN);
    const hasDefendant = /[A-Z]{2,}[-\s]?[A-Z]*/.test(line) && !sendingPartMatch;

    // Check for purpose codes
    const purposeMatch = line.match(new RegExp(`\\b(${KNOWN_PURPOSES.join('|')})\\b`, 'i'));

    // Check for indictment number pattern (IND XXXXX-XX or IND-XXXXX-XX)
    const indMatch = line.match(/IND[-\s]?(\d{4,6}[-/]\d{2})/i);

    // Check for charge patterns
    const chargePatterns = [
      /ATT\s*MURD\s*\d/i, /MURD\s*\d/i, /CPCS\s*\d/i, /BURG\s*\d/i,
      /ROBBERY\s*\d/i, /ASSAULT\s*\d/i, /SEX\s*MOT/i, /FELONY/i,
      /CPSP\s*\d/i, /CRIM\s*POSS/i, /GANG\s*ASS/i, /KIDNAP/i,
      /ARSON/i, /MANSLAUGHTER/i, /RAPE/i,
    ];
    const chargeMatch = chargePatterns.find((p) => p.test(line));

    // Check for date pattern (MM/DD)
    const dateMatch = line.match(/\b(\d{1,2}\/\d{1,2})\b/);

    // Check for status patterns
    const statusPatterns = [
      /ADJ\s*\d{1,2}\/\d{1,2}/i,
      /CALENDAR\s*\(\d+\)/i,
      /CALENDAR\s*\d{1,2}\/\d{1,2}\s*\(\d+\)/i,
      /JS[-\s]?\d+/i,
      /JS\s*COMP/i,
      /OPEN/i,
      /CONT'?D/i,
      /S&C/i,
    ];
    const statusMatches = statusPatterns
      .map((p) => line.match(p))
      .filter(Boolean)
      .map((m) => m![0]);

    // Check for attorney names (ADA pattern)
    const adaMatch = line.match(/ADA\s+[A-Z]+/gi);
    const attorneyNames = line.match(
      /(?:^|\s)([A-Z]{2,}(?:\s+[A-Z]{2,})*)\s*$/
    );

    // Check for next date at end of line
    const nextDateMatch = line.match(/(\d{1,2}\/\d{1,2}H?)\s*$/);

    // Detect juvenile flag
    const isJuvenile = /\(J\)\*/.test(line);
    const isJury = /\(J\)(?!\*)/.test(line);

    // Build a case if we have enough signal
    if (sendingPartMatch || indMatch || chargeMatch || purposeMatch) {
      // Try to extract defendant name - usually between sending part and purpose/IND
      let defendant = '';
      if (indMatch) {
        // Defendant is typically before the IND number
        const beforeInd = line.substring(0, line.indexOf(indMatch[0])).trim();
        // Get the last capitalized name sequence
        const nameMatch = beforeInd.match(/([A-Z][-A-Z.\s]*[A-Z])\s*(?:\(J\))?/);
        if (nameMatch) defendant = nameMatch[1].trim();
      }

      cases.push({
        sending_part: sendingPartMatch ? sendingPartMatch[1].trim() : '',
        defendant: defendant || '',
        purpose: purposeMatch ? purposeMatch[1].toUpperCase() : '',
        transfer_date: dateMatch ? dateMatch[1] : '',
        top_charge: chargeMatch ? line.match(chargeMatch)![0].trim() : '',
        status: statusMatches.length > 0 ? statusMatches.join('; ') : '',
        calendar_date: '',
        case_count: 0,
        attorney: adaMatch ? adaMatch.join(', ') : (attorneyNames ? attorneyNames[1] : ''),
        estimated_final_date: nextDateMatch ? nextDateMatch[1] : '',
        is_juvenile: isJuvenile,
      });
    }
  }

  // If no cases were parsed but we have status info, create a placeholder case
  if (cases.length === 0) {
    const statusParts: string[] = [];
    if (isAvailable) statusParts.push('AVAILABLE');
    if (isConf) statusParts.push('CONF');
    if (isChambers) statusParts.push('CHAMBERS');
    if (sittingMatch) statusParts.push(`SITTING IN PT ${sittingMatch[1]}`);

    // Extract any calendar counts from the full text
    const calendarMatches = fullText.match(/CALENDAR\s*(?:\d{1,2}\/\d{1,2}\s*)?\(\d+\)/gi);
    if (calendarMatches) statusParts.push(...calendarMatches);

    cases.push({
      sending_part: '',
      defendant: '',
      purpose: '',
      transfer_date: '',
      top_charge: '',
      status: statusParts.join('; ') || '',
      calendar_date: '',
      case_count: 0,
      attorney: '',
      estimated_final_date: '',
      is_juvenile: false,
    });
  }

  return {
    part: partNumber,
    judge: judgeName,
    calendar_day: calendarDay,
    out_dates: outDates,
    confidence: cases.some((c) => c.defendant || c.top_charge) ? 0.85 : 0.7,
    cases,
  };
}

/**
 * Split the full text into part blocks.
 * Each block starts with a line that has a part number + justice name.
 */
function splitIntoPartBlocks(text: string): string[][] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  // Pattern: line starts with 1-3 digit number followed by all-caps name
  const partStartPattern = /^\d{1,3}\s+[A-Z]{2,}/;

  for (const line of lines) {
    // Skip the report header
    if (/AM\s*PM\s*REPORT/i.test(line)) continue;
    if (/Sending\s*Part/i.test(line)) continue;
    if (/Defendant/i.test(line)) continue;
    if (/Top\s*Charge/i.test(line)) continue;
    if (/^P\s*U\s*R\s*P/i.test(line)) continue;
    if (/^Date\s*Trans/i.test(line)) continue;
    if (/^STATUS$/i.test(line)) continue;
    if (/^Attorneys$/i.test(line)) continue;

    if (partStartPattern.test(line) && currentBlock.length > 0) {
      blocks.push(currentBlock);
      currentBlock = [line];
    } else {
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Parse a daily court report PDF file entirely client-side.
 * Returns the same format as the edge function would.
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
    logger.debug('📄 Starting client-side PDF extraction...');

    // Step 1: Extract text from PDF
    const pages = await extractTextFromPDF(file);
    const fullText = pages.join('\n');

    if (!fullText || fullText.trim().length < 50) {
      return {
        success: false,
        error: 'Could not extract text from the PDF. The file may be image-based or corrupted.',
      };
    }

    logger.debug(`📝 Extracted ${fullText.length} characters from ${pages.length} pages`);

    // Step 2: Parse header
    const { reportDate, building } = parseReportHeader(fullText);
    logger.debug(`📅 Report date: ${reportDate}, Building: ${building}`);

    // Step 3: Split into part blocks and parse each
    const blocks = splitIntoPartBlocks(fullText);
    logger.debug(`📊 Found ${blocks.length} potential part blocks`);

    const entries: ExtractedPart[] = [];
    for (const block of blocks) {
      const parsed = parsePartBlock(block);
      if (parsed) {
        entries.push(parsed);
      }
    }

    if (entries.length === 0) {
      return {
        success: false,
        error: 'No court parts could be extracted from the document. Please check the file format.',
      };
    }

    logger.debug(`✅ Successfully parsed ${entries.length} parts`);

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
