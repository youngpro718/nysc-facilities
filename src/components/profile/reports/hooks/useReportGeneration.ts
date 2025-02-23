
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ReportProgress } from "../types";
import {
  fetchFloorplanReportData,
  fetchLightingReport,
  fetchOccupantReport,
  fetchKeyReport,
  fetchRoomReport,
  fetchIssueReport,
  fetchFullDatabaseReport,
  downloadReport
} from "../reportService";

export function useReportGeneration() {
  const { toast } = useToast();
  const [reportProgress, setReportProgress] = useState<Record<string, ReportProgress>>({});

  const handleGenerateReport = async (type: string) => {
    try {
      setReportProgress(prev => ({
        ...prev,
        [type]: { status: 'pending', progress: 0 }
      }));

      let reportData;
      const progressCallback = (progress: ReportProgress) => {
        setReportProgress(prev => ({
          ...prev,
          [type]: progress
        }));
      };
      
      switch (type) {
        case 'floorplan':
          reportData = await fetchFloorplanReportData();
          break;
        case 'lighting':
          reportData = await fetchLightingReport();
          break;
        case 'occupant':
          reportData = await fetchOccupantReport();
          break;
        case 'key':
          reportData = await fetchKeyReport();
          break;
        case 'room':
          reportData = await fetchRoomReport();
          break;
        case 'issue':
          reportData = await fetchIssueReport();
          break;
        case 'database':
          reportData = await fetchFullDatabaseReport();
          break;
        default:
          throw new Error('Invalid report type');
      }

      await downloadReport(reportData, `${type}-report.pdf`);

      toast({
        title: "Report Generated Successfully",
        description: `Your ${type} report has been downloaded.`,
      });

      setTimeout(() => {
        setReportProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[type];
          return newProgress;
        });
      }, 3000);
    } catch (error) {
      console.error('Report generation error:', error);
      setReportProgress(prev => ({
        ...prev,
        [type]: { status: 'error', progress: 0, message: 'Failed to generate report' }
      }));
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating the report.",
        variant: "destructive",
      });
    }
  };

  return { reportProgress, handleGenerateReport };
}
