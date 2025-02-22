import { supabase } from "@/integrations/supabase/client";
import { ReportTemplate, ScheduledReport } from "./types";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export async function fetchDataWithProgress<T>(
  queryBuilder: PostgrestFilterBuilder<any, any, T[]>,
  progressCallback: (progress: { status: string; progress: number; message?: string }) => void,
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

export async function downloadPdf(docDefinition: any, filename: string) {
  try {
    const pdfMake = await import("pdfmake/build/pdfmake");
    const pdfFonts = await import("pdfmake/build/vfs_fonts");

    pdfMake.setFonts(pdfFonts.pdfMake.vfs);

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

export async function fetchReportTemplates(): Promise<ReportTemplate[]> {
  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createReportTemplate(template: Omit<ReportTemplate, 'id' | 'created_at'>): Promise<ReportTemplate> {
  const { data, error } = await supabase
    .from('report_templates')
    .insert(template)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchScheduledReports(): Promise<ScheduledReport[]> {
  const { data, error } = await supabase
    .from('scheduled_reports')
    .select('*')
    .order('next_run_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function scheduleReport(report: Omit<ScheduledReport, 'id'>): Promise<ScheduledReport> {
  const { data, error } = await supabase
    .from('scheduled_reports')
    .insert(report)
    .select()
    .single();

  if (error) throw error;
  return data;
}
