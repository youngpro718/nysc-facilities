
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Bug, Database, DoorOpen, FileText, Key, Lightbulb, User } from "lucide-react";
import { useState } from "react";
import { ReportProgress, ReportTemplate, ScheduledReport } from "./types";
import { fetchReportTemplates, fetchScheduledReports, createReportTemplate } from "./reportUtils";
import { ReportCard } from "./components/ReportCard";
import { TemplateDialog } from "./components/TemplateDialog";
import { ScheduleDialog } from "./components/ScheduleDialog";
import { ReportHeader } from "./components/ReportHeader";
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

export function ReportsSection() {
  const { toast } = useToast();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [reportProgress, setReportProgress] = useState<Record<string, ReportProgress>>({});

  const loadTemplates = async () => {
    try {
      const data = await fetchReportTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error Loading Templates",
        description: "Could not load report templates.",
        variant: "destructive",
      });
    }
  };

  const loadScheduledReports = async () => {
    try {
      const data = await fetchScheduledReports();
      setScheduledReports(data);
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
      toast({
        title: "Error Loading Scheduled Reports",
        description: "Could not load scheduled reports.",
        variant: "destructive",
      });
    }
  };

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
          throw new Error('Invalid report type');
      }

      downloadReport(reportData, type);

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

  const handleCreateTemplate = async () => {
    try {
      await createReportTemplate({
        name: newTemplateName,
        description: newTemplateDesc,
        config: {},
        is_public: false
      });
      
      toast({
        title: "Template Created",
        description: "Report template has been created successfully.",
      });
      
      setNewTemplateName("");
      setNewTemplateDesc("");
      loadTemplates();
    } catch (error) {
      console.error('Template creation error:', error);
      toast({
        title: "Template Creation Failed",
        description: "There was an error creating the template.",
        variant: "destructive",
      });
    }
  };

  const reports = [
    {
      title: "Floorplan Report",
      description: "Comprehensive report of building's floorplan data, including room and hallway details.",
      icon: FileText,
      type: "floorplan"
    },
    {
      title: "Lighting Report",
      description: "Status and maintenance information for all lighting fixtures.",
      icon: Lightbulb,
      type: "lighting"
    },
    {
      title: "Occupant Report",
      description: "Details about building occupants and their assignments.",
      icon: User,
      type: "occupant"
    },
    {
      title: "Key Report",
      description: "Key inventory and assignment status.",
      icon: Key,
      type: "key"
    },
    {
      title: "Room Report",
      description: "Room occupancy and status information.",
      icon: DoorOpen,
      type: "room"
    },
    {
      title: "Issue Report",
      description: "Comprehensive report of all facility issues and their status.",
      icon: Bug,
      type: "issue"
    },
    {
      title: "Full Database Report",
      description: "Complete database export with all facility management data.",
      icon: Database,
      type: "database"
    }
  ];

  return (
    <Card className="p-6">
      <ReportHeader 
        onShowTemplates={() => {
          setShowTemplates(true);
          loadTemplates();
        }}
        onShowSchedule={() => {
          setShowSchedule(true);
          loadScheduledReports();
        }}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <ReportCard
            key={report.type}
            {...report}
            progress={reportProgress[report.type]}
            onGenerate={handleGenerateReport}
          />
        ))}
      </div>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <TemplateDialog
          templates={templates}
          newTemplateName={newTemplateName}
          newTemplateDesc={newTemplateDesc}
          onTemplateNameChange={setNewTemplateName}
          onTemplateDescChange={setNewTemplateDesc}
          onCreateTemplate={handleCreateTemplate}
        />
      </Dialog>

      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <ScheduleDialog scheduledReports={scheduledReports} />
      </Dialog>
    </Card>
  );
}
