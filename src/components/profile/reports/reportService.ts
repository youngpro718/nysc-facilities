
import { ReportProgress, ReportCallback } from './types';

// Template and Schedule API functions
export const fetchReportTemplates = async () => {
  // Temporarily return empty array
  return [];
};

export const fetchScheduledReports = async () => {
  // Temporarily return empty array
  return [];
};

export const createReportTemplate = async (template: {
  name: string;
  description: string;
  config: Record<string, unknown>;
  is_public: boolean;
}) => {
  // Temporarily return empty response
  return { success: true };
};

export { generateRoomReport as fetchRoomReport } from './roomReport';
export { generateKeyInventoryReport as fetchKeyReport } from './keyReport';
export { fetchIssueReport } from './issueReport';
export { fetchFloorplanReportData } from './floorplanReport';
export { fetchLightingReport } from './lightingReport';
export { fetchOccupantReport } from './occupantReport';
export { fetchFullDatabaseReport } from './databaseReport';
export { downloadPdf as downloadReport } from './reportUtils';
export type { ReportProgress, ReportCallback };

