
import { supabase } from "@/integrations/supabase/client";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { ReportTemplate, ScheduledReport, ReportCallback } from "./types";

export async function fetchDataWithProgress<T>(
  queryBuilder: PostgrestFilterBuilder<any, any, T[]>,
  progressCallback: ReportCallback,
  startProgress: number,
  endProgress: number
): Promise<T[]> {
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
      message: `Error: ${error.message}`
    });
    throw error;
  }

  if (!data) {
    progressCallback({
      status: 'error',
      progress: startProgress,
      message: 'No data found'
    });
    throw new Error('No data found');
  }

  progressCallback({
    status: 'generating',
    progress: endProgress,
    message: 'Data fetched successfully'
  });

  return data;
}

export async function downloadPdf(docDefinition: TDocumentDefinitions, filename: string) {
  try {
    // Set virtual file system for fonts
    if (typeof window !== 'undefined' && pdfFonts) {
      pdfMake.vfs = pdfFonts;
    }

    const pdfDocGenerator = pdfMake.createPdf(docDefinition);

    pdfDocGenerator.getBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  } catch (error) {
    console.error("Failed to download PDF:", error);
  }
}

export async function fetchReportTemplates() {
  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(template => ({
    ...template,
    config: typeof template.config === 'string' ? JSON.parse(template.config) : template.config
  }));
}

export async function createReportTemplate(template: Omit<ReportTemplate, 'id' | 'created_at'>) {
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
}

export async function fetchScheduledReports() {
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
}

export async function scheduleReport(report: Omit<ScheduledReport, 'id'>) {
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
}

// Re-export types from types.ts
export type { ReportTemplate, ScheduledReport } from './types';
