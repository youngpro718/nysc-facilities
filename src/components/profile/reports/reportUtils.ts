import { supabase } from "@/integrations/supabase/client";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { ReportTemplate, ScheduledReport, ReportCallback, ReportMetrics, ReportSummary } from "./types";
import { format } from "date-fns";

// Initialize PDF fonts
const fonts = pdfFonts as any;
if (fonts.pdfMake?.vfs) {
  pdfMake.vfs = fonts.pdfMake.vfs;
}

export async function fetchDataWithProgress<T>(
  queryBuilder: any,
  progressCallback: ReportCallback,
  startProgress: number,
  endProgress: number
): Promise<T[]> {
  try {
    progressCallback({
      status: 'generating',
      progress: startProgress,
      message: 'Fetching data...'
    });

    const { data, error } = await queryBuilder;

    if (error) {
      progressCallback({
        status: 'error',
        progress: startProgress,
        message: `Database error: ${error.message}`
      });
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      progressCallback({
        status: 'generating',
        progress: endProgress,
        message: 'No data found, generating empty report'
      });
      return [];
    }

    progressCallback({
      status: 'generating',
      progress: endProgress,
      message: `Successfully fetched ${data.length} records`
    });

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    progressCallback({
      status: 'error',
      progress: startProgress,
      message: errorMessage
    });
    throw error;
  }
}

export function generateReportHeader(title: string, subtitle?: string): Content[] {
  const currentDate = new Date();
  
  return [
    {
      columns: [
        {
          text: title,
          style: 'header',
          width: '*'
        },
        {
          text: format(currentDate, 'PPpp'),
          style: 'date',
          width: 'auto'
        }
      ]
    },
    subtitle ? { text: subtitle, style: 'subheader' } : null,
    { text: '\n' }
  ].filter(Boolean) as Content[];
}

export function generateMetricsSection(metrics: ReportMetrics): Content[] {
  return [
    { text: 'Summary Metrics', style: 'sectionHeader' },
    {
      columns: [
        {
          text: `Total Records: ${metrics.totalRecords}`,
          style: 'metric'
        },
        {
          text: `Categories: ${Object.keys(metrics.categories).length}`,
          style: 'metric'
        }
      ]
    },
    { text: '\n' },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto'],
        body: [
          ['Category', 'Count'],
          ...Object.entries(metrics.categories).map(([key, value]) => [key, value.toString()])
        ]
      },
      layout: 'lightHorizontalLines'
    },
    { text: '\n' }
  ];
}

export function generateRecommendationsSection(recommendations: string[]): Content[] {
  if (!recommendations.length) return [];
  
  return [
    { text: 'Recommendations', style: 'sectionHeader' },
    {
      ul: recommendations.map(rec => ({ text: rec, style: 'recommendation' }))
    },
    { text: '\n' }
  ];
}

export async function downloadPdf(docDefinition: TDocumentDefinitions, filename: string) {
  try {
    // Enhanced document definition with consistent styling
    const enhancedDocDefinition: TDocumentDefinitions = {
      ...docDefinition,
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      styles: {
        header: { fontSize: 20, bold: true, margin: [0, 0, 0, 10], color: '#1f2937' },
        subheader: { fontSize: 14, margin: [0, 0, 0, 10], color: '#6b7280' },
        sectionHeader: { fontSize: 16, bold: true, margin: [0, 15, 0, 8], color: '#374151' },
        date: { fontSize: 10, color: '#9ca3af', alignment: 'right' },
        metric: { fontSize: 12, margin: [0, 5, 0, 5] },
        recommendation: { fontSize: 11, margin: [0, 3, 0, 3] },
        tableHeader: { bold: true, fillColor: '#f3f4f6', margin: [5, 5, 5, 5] },
        tableCell: { margin: [5, 3, 5, 3] },
        ...docDefinition.styles
      },
      defaultStyle: {
        fontSize: 10,
        font: 'Roboto'
      }
    };

    const pdfDocGenerator = pdfMake.createPdf(enhancedDocDefinition);

    return new Promise<void>((resolve, reject) => {
      pdfDocGenerator.getBlob((blob) => {
        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Failed to download PDF:", error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function fetchReportTemplates(): Promise<ReportTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('report_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(template => ({
      ...template,
      config: typeof template.config === 'string' ? JSON.parse(template.config) : template.config
    }));
  } catch (error) {
    console.warn("Report templates table not found, returning empty array");
    return [];
  }
}

export async function createReportTemplate(template: Omit<ReportTemplate, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('report_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      config: typeof data.config === 'string' ? JSON.parse(data.config) : data.config
    };
  } catch (error) {
    console.warn("Report templates functionality not available");
    throw error;
  }
}

export async function fetchScheduledReports(): Promise<ScheduledReport[]> {
  try {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .order('next_run_at', { ascending: true });

    if (error) throw error;
    
    return (data || []).map(report => ({
      ...report,
      recipients: Array.isArray(report.recipients) ? report.recipients : 
                 typeof report.recipients === 'string' ? JSON.parse(report.recipients) : []
    }));
  } catch (error) {
    console.warn("Scheduled reports table not found, returning empty array");
    return [];
  }
}

export async function scheduleReport(report: Omit<ScheduledReport, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      recipients: Array.isArray(data.recipients) ? data.recipients : 
                 typeof data.recipients === 'string' ? JSON.parse(data.recipients) : []
    };
  } catch (error) {
    console.warn("Scheduled reports functionality not available");
    throw error;
  }
}

export function calculateMetrics<T>(data: T[], categoryExtractor: (item: T) => string): ReportMetrics {
  const categories: Record<string, number> = {};
  
  data.forEach(item => {
    const category = categoryExtractor(item);
    categories[category] = (categories[category] || 0) + 1;
  });

  return {
    totalRecords: data.length,
    categories
  };
}

export function generateReportSummary(
  title: string,
  description: string,
  metrics: ReportMetrics,
  customMetrics?: string[]
): ReportSummary {
  const keyMetrics = [
    `Total Records: ${metrics.totalRecords}`,
    `Categories: ${Object.keys(metrics.categories).length}`,
    ...Object.entries(metrics.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${value}`),
    ...(customMetrics || [])
  ];

  return {
    title,
    description,
    keyMetrics
  };
}

export { downloadPdf as downloadReport };
export type { ReportTemplate, ScheduledReport };