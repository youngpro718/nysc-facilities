import * as pdfjsLib from 'pdfjs-dist';
import type { ExtractedPart } from '@features/court/components/court-operations/PDFExtractionPreview';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();


// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface TextItem {
  x: number;
  width: number;
  text: string;
}

interface ParsedRow {
  y: number;
  items: TextItem[];
}

// ─────────────────────────────────────────────
// PDF TEXT EXTRACTION (pdf.js)
// ─────────────────────────────────────────────

async function extractRawTextFromPDF(file: File): Promise<{ text: string; errorDetails?: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (!pdf || typeof pdf.numPages !== 'number') {
      return { text: '', errorDetails: 'PDF loaded but numPages is missing.' };
    }

    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items as Array<{ str: string; transform: number[]; width: number }>;

      const pageRows: ParsedRow[] = [];

      for (const textItem of items) {
        if (!textItem || typeof textItem.str !== 'string') continue;
        if (textItem.str.trim() === '') continue;

        const y = textItem.transform ? Math.round(textItem.transform[5]) : 0;
        const x = textItem.transform ? textItem.transform[4] : 0;

        let row = pageRows.find(r => Math.abs(r.y - y) <= 6);
        if (!row) {
          row = { y, items: [] };
          pageRows.push(row);
        }
        row.items.push({ x, width: textItem.width || 0, text: textItem.str });
      }

      // Sort top-to-bottom, items left-to-right within each row
      pageRows.sort((a, b) => b.y - a.y);
      for (const row of pageRows) {
        row.items.sort((a, b) => a.x - b.x);
      }

      // Join each row with tab separators to preserve column hints for the AI
      const pageText = pageRows
        .map(row => row.items.map(i => i.text).join('\t'))
        .join('\n');

      pageTexts.push(`--- PAGE ${pageNum} ---\n${pageText}`);
    }

    return { text: pageTexts.join('\n\n') };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { text: '', errorDetails: `extractRawTextFromPDF threw: ${msg}` };
  }
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

/**
 * Parse a daily court report PDF using Gemini AI via the extract-court-data edge function.
 *
 * Flow:
 * 1. pdf.js extracts raw text preserving layout hints via tab separators
 * 2. Supabase edge function sends text to Gemini (GEMINI_API_KEY stored in Supabase secrets)
 * 3. Gemini returns structured JSON shaped as ExtractedPart[]
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
    logger.debug('📄 Extracting raw text from PDF...');

    const { text, errorDetails } = await extractRawTextFromPDF(file);

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: `Could not extract text from the PDF. ${errorDetails ?? ''}`,
      };
    }

    logger.debug(`📝 Extracted ${text.length} characters — sending to extract-court-data edge function...`);

    // Fire-and-forget: log invocation for cost visibility and future rate limiting.
    // Do not await — never block extraction on logging.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('ai_invocation_log')
          .insert({ user_id: user.id, function_name: 'extract-court-data' })
          .then(() => {});
      }
    });

    // AI provider keys are managed server-side via Supabase secrets — never sent from the client.
    const { data, error } = await supabase.functions.invoke('extract-court-data', {
      body: {
        pdfText: text,
        fileName: file.name,
      },
    });

    if (error) {
      logger.error('Edge function error:', error);
      return {
        success: false,
        error: `extract-court-data failed: ${error.message}`,
      };
    }

    if (!data?.success || !data?.extracted_data) {
      logger.error('Edge function returned failure:', data);
      return {
        success: false,
        error: data?.error ?? 'Edge function returned no data.',
      };
    }

    const { report_date, building, report_type, entries } = data.extracted_data;

    logger.debug(`✅ Gemini returned ${entries?.length ?? 0} parts`);

    if (!entries || entries.length === 0) {
      return {
        success: false,
        error: 'No court parts could be extracted from the document.',
      };
    }

    return {
      success: true,
      extracted_data: {
        report_date: report_date ?? '',
        building: building || '100 Centre Street',
        report_type: report_type ?? 'AM PM REPORT',
        entries: entries as ExtractedPart[],
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
