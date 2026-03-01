// @ts-nocheck
// Daily Report Generator — Traditional bordered-table court report format
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { format } from 'date-fns';
import { CourtSession, CoverageAssignment, SessionPeriod, BuildingCode } from '@/types/courtSessions';

// Initialize pdfMake with fonts
((pdfMake as Record<string, unknown>)).vfs = pdfFonts;

export interface DailyReportOptions {
  date: Date;
  period: SessionPeriod;
  buildingCode: BuildingCode;
  sessions: CourtSession[];
  coverages: CoverageAssignment[];
  availableHrgs?: string;
  coverageSummary?: string;
  generalNotes?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
}

// Colors matching the traditional court report style
const HEADER_BG = '#C5D9F1';   // Light blue header band
const BORDER_COLOR = '#000000'; // Solid black borders
const WHITE = '#FFFFFF';

export class DailyReportGenerator {
  /**
   * Generate and download PDF report
   */
  static async generateReport(options: DailyReportOptions): Promise<void> {
    const docDefinition = this.createDocumentDefinition(options);
    ((pdfMake as Record<string, unknown>)).createPdf(docDefinition).download(this.getFileName(options));
  }

  /**
   * Open PDF report in new tab
   */
  static async openReport(options: DailyReportOptions): Promise<void> {
    const docDefinition = this.createDocumentDefinition(options);
    ((pdfMake as Record<string, unknown>)).createPdf(docDefinition).open();
  }

  /**
   * Get PDF as blob for preview
   */
  static async getReportBlob(options: DailyReportOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const docDefinition = this.createDocumentDefinition(options);
      ((pdfMake as Record<string, unknown>)).createPdf(docDefinition).getBlob((blob) => {
        resolve(blob);
      });
    });
  }

  /**
   * Create PDF document definition — traditional court report format
   */
  private static createDocumentDefinition(options: DailyReportOptions): TDocumentDefinitions {
    const {
      date,
      period,
      buildingCode,
      sessions,
      coverages,
      availableHrgs,
      coverageSummary,
      generalNotes,
      includeHeader = true,
      includeFooter = true,
    } = options;

    const buildingNum = buildingCode === '100' ? '100' : '111';
    const content: Content = [];

    // Title — matches screenshot: "11-21-25 AM PM REPORT 111 CENTRE STREET"
    if (includeHeader) {
      const shortDate = format(date, 'M-dd-yy');
      const periodLabel = period === 'ALL_DAY' ? 'AM PM' : `${period}`;

      content.push({
        table: {
          widths: ['*'],
          body: [[
            {
              text: `${shortDate} ${periodLabel} REPORT ${buildingNum} CENTRE STREET`,
              fontSize: 14,
              bold: true,
              alignment: 'center',
              margin: [0, 6, 0, 6],
            }
          ]],
        },
        layout: {
          fillColor: () => HEADER_BG,
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => BORDER_COLOR,
          vLineColor: () => BORDER_COLOR,
        },
        margin: [0, 0, 0, 8],
      });
    }

    // Sessions table — traditional bordered format
    const sessionsTable = this.createSessionsTable(sessions);
    content.push(sessionsTable);

    // Coverage Section
    if (coverages && coverages.length > 0) {
      content.push(
        {
          text: 'COVERAGE ASSIGNMENTS',
          bold: true,
          fontSize: 12,
          margin: [0, 16, 0, 6],
        },
        this.createCoverageTable(coverages)
      );
    }

    // Footer Notes
    if (includeFooter) {
      const footerNotes: Content = [];

      if (availableHrgs) {
        footerNotes.push({
          text: `AVAILABLE HRGs: ${availableHrgs}`,
          fontSize: 9,
          margin: [0, 8, 0, 3],
        });
      }

      if (coverageSummary) {
        footerNotes.push({
          text: `COVERAGE SUMMARY: ${coverageSummary}`,
          fontSize: 9,
          margin: [0, 3, 0, 3],
        });
      }

      if (generalNotes) {
        footerNotes.push({
          text: `NOTES: ${generalNotes}`,
          fontSize: 9,
          margin: [0, 3, 0, 3],
        });
      }

      if (footerNotes.length > 0) {
        content.push(...footerNotes);
      }
    }

    return {
      content,
      defaultStyle: {
        fontSize: 9,
      },
      pageSize: 'LETTER',
      pageOrientation: 'landscape',
      pageMargins: [30, 40, 30, 40],
      footer: (currentPage, pageCount) => {
        return {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'center',
          fontSize: 7,
          margin: [0, 8, 0, 0],
        };
      },
    };
  }

  /**
   * Build the first column identity block for a session row.
   * Matches the screenshot: Room number, Judge name, Cal day, OUT dates, status notes
   */
  private static buildIdentityBlock(session: CourtSession): string {
    const parts: string[] = [];

    // Room number (bold effect via uppercase)
    const roomNum = session.court_rooms?.room_number || '';
    if (roomNum) parts.push(roomNum);

    // Judge name
    if (session.judge_name) parts.push(session.judge_name.toUpperCase());

    // Calendar day (e.g., "Cal Wed")
    if (session.calendar_day) parts.push(`Cal ${session.calendar_day}`);

    // OUT dates from the out_dates array
    if (session.out_dates && session.out_dates.length > 0) {
      parts.push(`OUT ${session.out_dates.join('; ')}`);
    }

    // Status text (e.g., "CONF", "DARK")
    if (session.status && session.status !== 'scheduled') {
      parts.push(this.formatStatus(session.status));
    }

    // Notes / special info
    if (session.notes) {
      parts.push(session.notes.toUpperCase());
    }

    return parts.join('\n') || '-';
  }

  /**
   * Build the STATUS column content.
   * Matches the screenshot: status detail + calendar counts + availability
   */
  private static buildStatusColumn(session: CourtSession): string {
    const lines: string[] = [];

    // Primary status detail (e.g., "ADJ 11/24 S&C")
    if (session.status_detail) {
      lines.push(session.status_detail.toUpperCase());
    } else if (session.status && session.status !== 'scheduled') {
      lines.push(this.formatStatus(session.status));
    }

    // Calendar counts (e.g., "CALENDAR (0)" and "CALENDAR 11/24 (2)")
    if (session.calendar_count != null) {
      lines.push('');
      lines.push(`CALENDAR (${session.calendar_count})`);
    }
    if (session.calendar_count_date) {
      const countDateFormatted = this.formatDateShort(session.calendar_count_date);
      // If we have a calendar_count, show the dated one with a count too
      if (session.calendar_count != null) {
        lines.push(`CALENDAR ${countDateFormatted} (${session.calendar_count})`);
      } else {
        lines.push(`CALENDAR ${countDateFormatted}`);
      }
    }

    // If the session is available / open
    if (!session.judge_name && !session.defendants) {
      lines.push('');
      lines.push('AVAILABLE');
    }

    return lines.join('\n') || '-';
  }

  /**
   * Create sessions table — traditional bordered format matching the screenshot
   */
  private static createSessionsTable(sessions: CourtSession[]) {
    // Header row — matches screenshot column headers exactly
    const headerStyle = {
      bold: true,
      fontSize: 8,
      fillColor: HEADER_BG,
    };

    const tableBody = [
      [
        { text: '', ...headerStyle },                              // Room/Judge identity (no header label in screenshot)
        { text: 'Sending\nPart', ...headerStyle },
        { text: 'Defendant(s)', ...headerStyle },
        { text: 'P\nU\nR\nP.', ...headerStyle, alignment: 'center' },
        { text: 'Date\nTrans\nor\nStart', ...headerStyle },
        { text: 'TOP\nCHARGE', ...headerStyle },
        { text: 'STATUS', ...headerStyle },
        { text: 'Attorneys', ...headerStyle },
        { text: '', ...headerStyle },                              // Last date column (no label)
      ],
    ];

    // Sort sessions by room number numerically
    const sortedSessions = [...sessions].sort((a, b) => {
      const roomA = a.court_rooms?.room_number || '';
      const roomB = b.court_rooms?.room_number || '';
      const numA = parseInt(roomA);
      const numB = parseInt(roomB);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return roomA.localeCompare(roomB);
    });

    const cellStyle = { fontSize: 8 };

    // Data rows
    sortedSessions.forEach((session) => {
      // Col 1: Identity block (room, judge, cal day, out dates, notes)
      const identity = this.buildIdentityBlock(session);

      // Col 2: Sending Part (e.g., "PT 75", "OWN", "TAP A")
      const sendingPart = session.parts_entered_by || '';

      // Col 3: Defendant(s)
      const defendants = session.defendants || '';

      // Col 4: Purpose (e.g., "JS", "HRG")
      const purpose = session.purpose || '';

      // Col 5: Date Trans or Start
      const dateTranStart = session.date_transferred_or_started
        ? this.formatDateShort(session.date_transferred_or_started)
        : '';

      // Col 6: Top Charge
      const topCharge = session.top_charge || '';

      // Col 7: Status (with calendar counts)
      const statusCol = this.buildStatusColumn(session);

      // Col 8: Attorneys
      const attorney = session.attorney || '';

      // Col 9: Est finish / out date
      const lastDate = session.estimated_finish_date
        ? this.formatDateShort(session.estimated_finish_date)
        : '';

      tableBody.push([
        { text: identity, ...cellStyle, bold: false } as unknown,
        { text: sendingPart, ...cellStyle } as unknown,
        { text: defendants, ...cellStyle } as unknown,
        { text: purpose, ...cellStyle, alignment: 'center' } as unknown,
        { text: dateTranStart, ...cellStyle } as unknown,
        { text: topCharge, ...cellStyle } as unknown,
        { text: statusCol, ...cellStyle } as unknown,
        { text: attorney, ...cellStyle } as unknown,
        { text: lastDate, ...cellStyle } as unknown,
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: [95, 45, '*', 30, 40, 65, '*', 80, 40],
        body: tableBody,
      },
      layout: {
        // No fill for data rows — white background, header gets blue via cell-level fillColor
        fillColor: () => null,
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => BORDER_COLOR,
        vLineColor: () => BORDER_COLOR,
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 4,
        paddingBottom: () => 4,
      },
    };
  }

  /**
   * Create coverage table — traditional bordered style
   */
  private static createCoverageTable(coverages: CoverageAssignment[]) {
    const headerStyle = {
      bold: true,
      fontSize: 8,
      fillColor: HEADER_BG,
    };

    const tableBody = [
      [
        { text: 'Room', ...headerStyle },
        { text: 'Absent Staff', ...headerStyle },
        { text: 'Role', ...headerStyle },
        { text: 'Covering Staff', ...headerStyle },
        { text: 'Time', ...headerStyle },
        { text: 'Reason', ...headerStyle },
        { text: 'Notes', ...headerStyle },
      ],
    ];

    coverages.forEach((coverage) => {
      const timeRange =
        coverage.start_time && coverage.end_time
          ? `${coverage.start_time} - ${coverage.end_time}`
          : 'All Day';

      tableBody.push([
        { text: coverage.court_rooms?.room_number || 'N/A', fontSize: 8 },
        { text: coverage.absent_staff_name, fontSize: 8 },
        { text: coverage.absent_staff_role, fontSize: 8 },
        { text: coverage.covering_staff_name, fontSize: 8 },
        { text: timeRange, fontSize: 8 },
        { text: coverage.absence_reason || '-', fontSize: 8 },
        { text: coverage.notes || '-', fontSize: 8 },
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', '*', 'auto', '*', '*'],
        body: tableBody,
      },
      layout: {
        fillColor: () => null,
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => BORDER_COLOR,
        vLineColor: () => BORDER_COLOR,
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 3,
        paddingBottom: () => 3,
      },
    };
  }

  /**
   * Format a date string into short M/dd format
   */
  private static formatDateShort(dateStr: string): string {
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return format(new Date(dateStr + 'T00:00:00'), 'M/dd');
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  /**
   * Format status for display — keep raw codes as they appear in the original reports
   */
  private static formatStatus(status: string): string {
    // Return the status as-is (uppercase) — clerks expect the raw codes
    return (status || '').toUpperCase();
  }

  /**
   * Generate filename for PDF
   */
  private static getFileName(options: DailyReportOptions): string {
    const { date, period, buildingCode } = options;
    const dateStr = format(date, 'yyyy-MM-dd');
    return `Court_Report_${buildingCode}_${dateStr}_${period}.pdf`;
  }
}
