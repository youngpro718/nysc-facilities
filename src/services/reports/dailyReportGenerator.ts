// @ts-nocheck
// Daily Report Generator
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
   * Create PDF document definition
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

    const buildingName = buildingCode === '100' ? '100 Centre Street' : '111 Centre Street';
    const dateStr = format(date, 'EEEE, MMMM d, yyyy');
    const periodStr = period === 'ALL_DAY' ? 'All Day' : period;

    const content: Content = [];

    // Header
    if (includeHeader) {
      const shortDate = format(date, 'MM-dd-yy');
      const buildingNum = buildingCode === '100' ? '100' : '111';
      content.push(
        {
          text: `${shortDate} ${period} DAILY REPORT ACTIVITY ${buildingNum} CENTRE STREET`,
          style: 'header',
          alignment: 'center',
          margin: [0, 10, 0, 15],
        }
      );
    }

    // Sessions Table (no header, just table)
    const sessionsTable = this.createSessionsTable(sessions);
    content.push(sessionsTable);

    // Coverage Section
    if (coverages && coverages.length > 0) {
      content.push(
        {
          text: 'Coverage Assignments',
          style: 'sectionHeader',
          margin: [0, 20, 0, 10],
        },
        this.createCoverageTable(coverages)
      );
    }

    // Footer Notes
    if (includeFooter) {
      const footerNotes: Content = [];

      if (availableHrgs) {
        footerNotes.push({
          text: `Available HRGs: ${availableHrgs}`,
          style: 'footerNote',
          margin: [0, 10, 0, 5],
        });
      }

      if (coverageSummary) {
        footerNotes.push({
          text: `Coverage Summary: ${coverageSummary}`,
          style: 'footerNote',
          margin: [0, 5, 0, 5],
        });
      }

      if (generalNotes) {
        footerNotes.push({
          text: `Notes: ${generalNotes}`,
          style: 'footerNote',
          margin: [0, 5, 0, 5],
        });
      }

      if (footerNotes.length > 0) {
        content.push(
          {
            text: 'Additional Information',
            style: 'sectionHeader',
            margin: [0, 20, 0, 10],
          },
          ...footerNotes
        );
      }
    }

    return {
      content,
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        subheader: {
          fontSize: 14,
          bold: true,
        },
        date: {
          fontSize: 12,
          italics: true,
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#1a1a1a',
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'white',
          fillColor: '#2c3e50',
        },
        tableCell: {
          fontSize: 9,
        },
        footerNote: {
          fontSize: 10,
          italics: true,
        },
      },
      defaultStyle: {
        fontSize: 10,
      },
      pageSize: 'LETTER',
      pageOrientation: 'landscape',
      pageMargins: [40, 60, 40, 60],
      footer: (currentPage, pageCount) => {
        return {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'center',
          fontSize: 8,
          margin: [0, 10, 0, 0],
        };
      },
    };
  }

  /**
   * Create sessions table
   */
  private static createSessionsTable(sessions: CourtSession[]) {
    const tableBody = [
      // Header row - Updated to match current UI
      [
        { text: 'PART/JUDGE', style: 'tableHeader' },
        { text: 'PARTS\nENT BY', style: 'tableHeader' },
        { text: 'DEFENDANTS', style: 'tableHeader' },
        { text: 'PURPOSE', style: 'tableHeader' },
        { text: 'DATE\nTRAN/START', style: 'tableHeader' },
        { text: 'TOP\nCHARGE', style: 'tableHeader' },
        { text: 'STATUS', style: 'tableHeader' },
        { text: 'ATTORNEY', style: 'tableHeader' },
        { text: 'EST.\nFIN.\nDATE', style: 'tableHeader' },
      ],
    ];

    // Sort sessions by room number
    const sortedSessions = [...sessions].sort((a, b) => {
      const roomA = a.court_rooms?.room_number || '';
      const roomB = b.court_rooms?.room_number || '';
      return roomA.localeCompare(roomB);
    });

    // Data rows - Updated to match current UI fields
    sortedSessions.forEach((session) => {
      // Part/Judge - combine part number and judge name
      const partJudge = [
        session.part_number ? `Part ${session.part_number}` : '',
        session.judge_name || ''
      ].filter(Boolean).join('\n') || '-';
      
      // Status - combine status and detail
      const status = session.status_detail 
        ? `${this.formatStatus(session.status)}\n${session.status_detail}`
        : this.formatStatus(session.status);
      
      // Est Fin Date
      const estFinDate = session.estimated_finish_date
        ? format(new Date(session.estimated_finish_date), 'MM/dd')
        : '';

      // Date Tran/Start
      const dateTranStart = session.date_transferred_or_started
        ? format(new Date(session.date_transferred_or_started), 'MM/dd')
        : '';

      tableBody.push([
        { text: partJudge, style: 'tableCell', fontSize: 8 } as unknown,
        { text: session.parts_entered_by || '-', style: 'tableCell', fontSize: 8 } as unknown,
        { text: session.defendants || '-', style: 'tableCell', fontSize: 8 } as unknown,
        { text: session.purpose || '-', style: 'tableCell', fontSize: 8 } as unknown,
        { text: dateTranStart || '-', style: 'tableCell', fontSize: 8 } as unknown,
        { text: session.top_charge || '-', style: 'tableCell', fontSize: 8 } as unknown,
        { text: status, style: 'tableCell', fontSize: 8 } as unknown,
        { text: session.attorney || '-', style: 'tableCell', fontSize: 8 } as unknown,
        { text: estFinDate || '-', style: 'tableCell', fontSize: 8 } as unknown,
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', '*', 'auto', 'auto'],
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex: number) => {
          return rowIndex === 0 ? '#2c3e50' : rowIndex % 2 === 0 ? '#f3f4f6' : null;
        },
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#e5e7eb',
        vLineColor: () => '#e5e7eb',
      },
    };
  }

  /**
   * Create coverage table
   */
  private static createCoverageTable(coverages: CoverageAssignment[]) {
    const tableBody = [
      // Header row
      [
        { text: 'Room', style: 'tableHeader' },
        { text: 'Absent Staff', style: 'tableHeader' },
        { text: 'Role', style: 'tableHeader' },
        { text: 'Covering Staff', style: 'tableHeader' },
        { text: 'Time Range', style: 'tableHeader' },
        { text: 'Reason', style: 'tableHeader' },
        { text: 'Notes', style: 'tableHeader' },
      ],
    ];

    // Data rows
    coverages.forEach((coverage) => {
      const timeRange =
        coverage.start_time && coverage.end_time
          ? `${coverage.start_time} - ${coverage.end_time}`
          : 'All Day';

      tableBody.push([
        { text: coverage.court_rooms?.room_number || 'N/A', style: 'tableCell' },
        { text: coverage.absent_staff_name, style: 'tableCell' },
        { text: coverage.absent_staff_role, style: 'tableCell' },
        { text: coverage.covering_staff_name, style: 'tableCell' },
        { text: timeRange, style: 'tableCell' },
        { text: coverage.absence_reason || '-', style: 'tableCell' },
        { text: coverage.notes || '-', style: 'tableCell' },
      ]);
    });

    return {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', '*', 'auto', '*', '*'],
        body: tableBody,
      },
      layout: {
        fillColor: (rowIndex: number) => {
          return rowIndex === 0 ? '#2c3e50' : rowIndex % 2 === 0 ? '#f3f4f6' : null;
        },
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#e5e7eb',
        vLineColor: () => '#e5e7eb',
      },
    };
  }

  /**
   * Format status for display
   */
  private static formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      CALENDAR: 'Calendar',
      HRG: 'Hearing',
      PC_CONTD: 'PC Continued',
      JD_CONTD: 'JD Continued',
      BT: 'Bench Trial',
      BT_PC: 'BT - PC',
      TR: 'Trial',
      ADJ: 'Adjourned',
      DARK: 'Dark',
    };

    return statusMap[status] || status;
  }

  /**
   * Generate filename for PDF
   */
  private static getFileName(options: DailyReportOptions): string {
    const { date, period, buildingCode } = options;
    const dateStr = format(date, 'yyyy-MM-dd');
    return `Court_Sessions_${buildingCode}_${dateStr}_${period}.pdf`;
  }
}
