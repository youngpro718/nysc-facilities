
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import pdfMake from "pdfmake/build/pdfmake";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { ReportCallback, ReportProgress } from "./types";

export async function fetchDataWithProgress<T>(
  queryBuilder: PostgrestFilterBuilder<any, any, any>,
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

  return data as T[];
}

export function downloadPdf(docDefinition: TDocumentDefinitions, fileName: string) {
  pdfMake.createPdf(docDefinition).download(fileName);
}

export function getFormattedTimestamp() {
  return format(new Date(), 'yyyy-MM-dd_HH-mm');
}

