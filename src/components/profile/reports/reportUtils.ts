import { supabase } from "@/integrations/supabase/client";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { ReportTemplate, ScheduledReport, ReportCallback, ReportMetrics, ReportSummary } from "./types";
import { format } from "date-fns";

// Initialize PDF fonts - simplified approach
try {
  pdfMake.vfs = pdfFonts?.pdfMake?.vfs || {};
  console.log('PDF fonts initialized successfully');
} catch (error) {
  console.error('Failed to initialize PDF fonts:', error);
  // Fallback: use browser default fonts
  pdfMake.vfs = {};
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
    console.log('Starting PDF generation...');
    console.log('Document definition:', JSON.stringify(docDefinition, null, 2));
    
    // Validate content exists and is properly formatted
    if (!docDefinition || !docDefinition.content) {
      throw new Error('PDF document definition is missing');
    }

    if (Array.isArray(docDefinition.content) && docDefinition.content.length === 0) {
      throw new Error('PDF content array is empty');
    }

    // Filter out null/undefined content items
    const cleanContent = Array.isArray(docDefinition.content) 
      ? docDefinition.content.filter(item => item != null)
      : docDefinition.content;

    if (Array.isArray(cleanContent) && cleanContent.length === 0) {
      throw new Error('PDF content is empty after filtering');
    }
    
    // Enhanced document definition with robust styling
    const enhancedDocDefinition: TDocumentDefinitions = {
      ...docDefinition,
      content: cleanContent,
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      info: {
        title: filename.replace('.pdf', ''),
        author: 'Facility Management System',
        subject: 'Generated Report',
        ...docDefinition.info
      },
      styles: {
        header: { 
          fontSize: 20, 
          bold: true, 
          margin: [0, 0, 0, 10],
          color: '#2563eb'
        },
        subheader: { 
          fontSize: 14, 
          margin: [0, 0, 0, 10],
          italics: true,
          color: '#64748b'
        },
        sectionHeader: { 
          fontSize: 16, 
          bold: true, 
          margin: [0, 15, 0, 8],
          color: '#1e40af'
        },
        date: { 
          fontSize: 10, 
          alignment: 'right',
          color: '#64748b'
        },
        metric: { 
          fontSize: 12, 
          margin: [0, 5, 0, 5] 
        },
        criticalMetric: { 
          fontSize: 12, 
          margin: [0, 5, 0, 5], 
          bold: true, 
          color: '#dc2626' 
        },
        warningMetric: { 
          fontSize: 12, 
          margin: [0, 5, 0, 5], 
          bold: true, 
          color: '#ea580c' 
        },
        recommendation: { 
          fontSize: 11, 
          margin: [0, 3, 0, 3],
          color: '#059669'
        },
        normal: { 
          fontSize: 10, 
          margin: [0, 2, 0, 2] 
        },
        ...docDefinition.styles
      },
      defaultStyle: {
        fontSize: 10,
        lineHeight: 1.2
      }
    };

    console.log('Enhanced document definition prepared');
    
    // Create PDF with timeout
    const pdfDocGenerator = pdfMake.createPdf(enhancedDocDefinition);

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('PDF generation timed out after 30 seconds'));
      }, 30000);

      try {
        console.log('Generating PDF blob...');
        pdfDocGenerator.getBlob((blob) => {
          clearTimeout(timeout);
          
          try {
            console.log('PDF blob generated, size:', blob.size, 'bytes');
            
            if (blob.size === 0) {
              throw new Error('Generated PDF is empty (0 bytes)');
            }

            if (blob.size < 100) {
              console.warn('PDF size is suspiciously small:', blob.size, 'bytes');
            }
            
            // Create download link
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
            
            console.log('PDF download initiated successfully:', filename);
            resolve();
          } catch (downloadError) {
            console.error('Error during PDF download:', downloadError);
            reject(new Error(`Download failed: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}`));
          }
        });
      } catch (generationError) {
        clearTimeout(timeout);
        console.error('Error during PDF generation:', generationError);
        reject(new Error(`PDF generation failed: ${generationError instanceof Error ? generationError.message : 'Unknown error'}`));
      }
    });
  } catch (error) {
    console.error("PDF preparation failed:", error);
    throw new Error(`PDF preparation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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