
import { supabase } from "@/integrations/supabase/client";

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  config: any;
  created_at: string;
  is_public: boolean;
}

export interface ScheduledReport {
  id: string;
  template_id: string;
  name: string;
  schedule: string;
  last_run_at: string | null;
  next_run_at: string | null;
  recipients: string[];
  config: any;
  status: string;
}

export async function fetchReportTemplates() {
  const { data, error } = await supabase
    .from('report_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchScheduledReports() {
  const { data, error } = await supabase
    .from('scheduled_reports')
    .select('*')
    .order('next_run_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createReportTemplate(template: Partial<ReportTemplate>) {
  const { data, error } = await supabase
    .from('report_templates')
    .insert([template])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function scheduleReport(report: Partial<ScheduledReport>) {
  const { data, error } = await supabase
    .from('scheduled_reports')
    .insert([report])
    .select()
    .single();

  if (error) throw error;
  return data;
}
