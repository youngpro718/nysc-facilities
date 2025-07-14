import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions, Content, TableCell } from "pdfmake/interfaces";
import { format } from "date-fns";
import { ReportCallback } from '../types';
import { handleReportError } from './reportErrorHandler';

// Initialize PDF fonts with error handling
try {
  pdfMake.vfs = pdfFonts?.pdfMake?.vfs || {};
} catch (error) {
  console.warn('PDF fonts initialization failed, using fallback:', error);
  pdfMake.vfs = {};
}

export interface PdfSection {
  title: string;
  content: Content[];
  priority?: 'high' | 'medium' | 'low';
}

export interface PdfOptions {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
  pageSize?: 'A4' | 'A3' | 'LETTER';
  orientation?: 'portrait' | 'landscape';
  margins?: [number, number, number, number];
}

export class PdfGenerator {
  private progressCallback: ReportCallback;
  private timeout: number;

  constructor(progressCallback: ReportCallback, timeout: number = 90000) {
    this.progressCallback = progressCallback;
    this.timeout = timeout;
  }

  async generatePdf(options: PdfOptions, filename: string): Promise<void> {
    try {
      this.progressCallback({
        status: 'generating',
        progress: 70,
        message: 'Building PDF structure...'
      });

      const docDefinition = this.buildDocumentDefinition(options);
      
      this.progressCallback({
        status: 'generating',
        progress: 80,
        message: 'Generating PDF document...'
      });

      await this.createAndDownloadPdf(docDefinition, filename);
      
      this.progressCallback({
        status: 'completed',
        progress: 100,
        message: 'PDF generated successfully'
      });
    } catch (error) {
      handleReportError(error, this.progressCallback, 'PdfGenerator.generatePdf');
    }
  }

  private buildDocumentDefinition(options: PdfOptions): TDocumentDefinitions {
    const { title, subtitle, sections, pageSize = 'A4', orientation = 'portrait', margins = [40, 60, 40, 60] } = options;

    // Build content progressively
    const content: Content[] = [];

    // Header
    content.push(...this.createHeader(title, subtitle));

    // Sort sections by priority
    const sortedSections = [...sections].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium']);
    });

      // Add sections with pagination considerations
      sortedSections.forEach((section, index) => {
        if (index > 0) {
          content.push({ text: '', pageBreak: 'before' as const });
        }
        
        content.push(
          { text: section.title, style: 'sectionHeader' },
          ...this.validateAndCleanContent(section.content),
          { text: '\n' }
        );
      });

    return {
      content,
      pageSize,
      pageOrientation: orientation,
      pageMargins: margins,
      info: {
        title,
        subject: subtitle || 'Generated Report',
        author: 'Facility Management System',
        creator: 'Report Generator',
        producer: 'pdfmake'
      },
      styles: this.getDefaultStyles(),
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.2,
        color: '#374151'
      }
    };
  }

  private createHeader(title: string, subtitle?: string): Content[] {
    const header: Content[] = [
      {
        columns: [
          { text: title, style: 'header', width: '*' },
          { text: format(new Date(), 'PPpp'), style: 'date', width: 'auto' }
        ]
      }
    ];

    if (subtitle) {
      header.push({ text: subtitle, style: 'subheader' });
    }

    header.push({ text: '\n' });
    return header;
  }

  private validateAndCleanContent(content: Content[]): Content[] {
    return content
      .filter(item => item != null)
      .map(item => {
        if (typeof item === 'object' && item !== null && 'table' in item && item.table) {
          // Validate table structure
          if (!item.table.body || !Array.isArray(item.table.body)) {
            return { text: '[Invalid table data]', style: 'error' } as Content;
          }
          
          // Limit table size for performance
          if (item.table.body.length > 100) {
            const limitedBody = [
              item.table.body[0], // Header
              ...item.table.body.slice(1, 50), // First 49 rows
              [Array(item.table.body[0]?.length || 1).fill('...')], // Separator
              ...item.table.body.slice(-10) // Last 10 rows
            ];
            
            return {
              ...item,
              table: {
                ...item.table,
                body: limitedBody
              }
            } as Content;
          }
        }
        return item as Content;
      });
  }

  private getDefaultStyles() {
    return {
      header: {
        fontSize: 24,
        bold: true,
        margin: [0, 0, 0, 20] as [number, number, number, number],
        color: '#1e3a8a'
      },
      subheader: {
        fontSize: 16,
        margin: [0, 0, 0, 15] as [number, number, number, number],
        color: '#475569'
      },
      sectionHeader: {
        fontSize: 18,
        bold: true,
        margin: [0, 20, 0, 10] as [number, number, number, number],
        color: '#1e40af'
      },
      date: {
        fontSize: 10,
        alignment: 'right' as const,
        color: '#6b7280'
      },
      metric: {
        fontSize: 12,
        margin: [0, 5, 0, 5] as [number, number, number, number]
      },
      criticalMetric: {
        fontSize: 12,
        margin: [0, 5, 0, 5] as [number, number, number, number],
        bold: true,
        color: '#dc2626'
      },
      warningMetric: {
        fontSize: 12,
        margin: [0, 5, 0, 5] as [number, number, number, number],
        bold: true,
        color: '#ea580c'
      },
      successMetric: {
        fontSize: 12,
        margin: [0, 5, 0, 5] as [number, number, number, number],
        bold: true,
        color: '#16a34a'
      },
      recommendation: {
        fontSize: 11,
        margin: [0, 3, 0, 3] as [number, number, number, number],
        color: '#059669'
      },
      error: {
        fontSize: 10,
        color: '#dc2626',
        italics: true
      },
      normal: {
        fontSize: 10,
        margin: [0, 2, 0, 2] as [number, number, number, number]
      }
    };
  }

  private async createAndDownloadPdf(docDefinition: TDocumentDefinitions, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`PDF generation timed out after ${this.timeout / 1000} seconds`));
      }, this.timeout);

      try {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        
        pdfDocGenerator.getBlob((blob) => {
          clearTimeout(timeout);
          
          if (!blob || blob.size === 0) {
            reject(new Error('Generated PDF is empty'));
            return;
          }

          this.downloadBlob(blob, filename);
          resolve();
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

export function createMetricsTable(metrics: Record<string, any>): Content {
  const rows: TableCell[][] = [['Metric', 'Value']];
  
  Object.entries(metrics).forEach(([key, value]) => {
    const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const formattedValue = typeof value === 'number' ? value.toLocaleString() : String(value);
    rows.push([formattedKey, formattedValue]);
  });

  return {
    table: {
      headerRows: 1,
      widths: ['*', 'auto'],
      body: rows
    },
    layout: 'lightHorizontalLines'
  };
}

export function createSimpleTable(headers: string[], data: any[][]): Content {
  const body: TableCell[][] = [headers, ...data];
  
  return {
    table: {
      headerRows: 1,
      widths: Array(headers.length).fill('*'),
      body
    },
    layout: 'lightHorizontalLines'
  };
}

export function createRecommendationsList(recommendations: string[]): Content {
  if (!recommendations.length) return { text: 'No recommendations at this time.', style: 'normal' };
  
  return {
    ul: recommendations.map(rec => ({ text: rec, style: 'recommendation' }))
  };
}