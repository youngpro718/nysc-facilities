
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
    console.log(`Starting ${type} report generation...`);
    
    // Clear any previous error state
    setReportProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[type];
      return newProgress;
    });

    try {
      setReportProgress(prev => ({
        ...prev,
        [type]: { status: 'pending', progress: 5, message: 'Initializing report generation...' }
      }));

      const progressCallback = (progress: ReportProgress) => {
        console.log(`${type} report progress:`, progress);
        setReportProgress(prev => ({
          ...prev,
          [type]: progress
        }));
      };

      progressCallback({
        status: 'generating',
        progress: 10,
        message: 'Starting data collection...'
      });

      let reportData;
      
      switch (type) {
        case 'floorplan':
          reportData = await fetchFloorplanReportData(progressCallback);
          break;
        case 'lighting':
          reportData = await fetchLightingReport(progressCallback);
          break;
        case 'occupant':
          reportData = await fetchOccupantReport(progressCallback);
          break;
        case 'key':
          reportData = await fetchKeyReport(progressCallback);
          break;
        case 'room':
          reportData = await fetchRoomReport(progressCallback);
          break;
        case 'issue':
          reportData = await fetchIssueReport(progressCallback);
          break;
        case 'database':
          reportData = await fetchFullDatabaseReport(progressCallback);
          break;
        default:
          throw new Error(`Invalid report type: ${type}`);
      }

      progressCallback({
        status: 'generating',
        progress: 90,
        message: 'Generating PDF document...'
      });

      if (!reportData) {
        throw new Error('Report data is empty or undefined');
      }

      console.log('Report data generated:', reportData);

      await downloadReport(reportData, `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`);

      progressCallback({
        status: 'completed',
        progress: 100,
        message: 'Report generated successfully!'
      });

      toast({
        title: "Report Generated Successfully",
        description: `Your ${type} report has been downloaded.`,
      });

      // Clear progress after successful completion
      setTimeout(() => {
        setReportProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[type];
          return newProgress;
        });
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`${type} report generation error:`, error);
      
      setReportProgress(prev => ({
        ...prev,
        [type]: { 
          status: 'error', 
          progress: 0, 
          message: `Failed: ${errorMessage}` 
        }
      }));

      toast({
        title: "Report Generation Failed",
        description: errorMessage.includes('Database') 
          ? "Database connection issue. Please try again."
          : errorMessage.includes('PDF')
          ? "PDF generation issue. Please check your browser settings."
          : `Report generation failed: ${errorMessage}`,
        variant: "destructive",
      });

      // Keep error state visible longer
      setTimeout(() => {
        setReportProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[type];
          return newProgress;
        });
      }, 8000);
    }
  };

  return { reportProgress, handleGenerateReport };
}
