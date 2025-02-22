
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Lightbulb, User, Key, DoorOpen, Bug, Database, Clock, BookTemplate, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { 
  fetchFloorplanReportData, 
  fetchLightingReport,
  fetchOccupantReport,
  fetchKeyReport,
  fetchRoomReport,
  fetchIssueReport,
  fetchFullDatabaseReport
} from "./reports/reportService";
import { 
  fetchReportTemplates, 
  fetchScheduledReports, 
  createReportTemplate, 
  scheduleReport,
  downloadPdf
} from "./reports/reportUtils";
import { ReportTemplate, ScheduledReport, ReportProgress } from "./reports/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ReportProgress {
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress: number;
  message?: string;
}

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

      await downloadPdf(reportData, `${type}-report.pdf`);

      toast({
        title: "Report Generated Successfully",
        description: `Your ${type} report has been downloaded.`,
      });

      // Clear progress after a delay
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Reports</h2>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowTemplates(true);
              loadTemplates();
            }}
          >
            <BookTemplate className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowSchedule(true);
              loadScheduledReports();
            }}
          >
            <Clock className="mr-2 h-4 w-4" />
            Scheduled Reports
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const progress = reportProgress[report.type];
          const isGenerating = progress?.status === 'generating';
          const isError = progress?.status === 'error';
          
          return (
            <div 
              key={report.type} 
              className={cn(
                "space-y-2 p-4 rounded-lg border",
                isGenerating && "bg-muted/50",
                isError && "bg-destructive/10 border-destructive/50"
              )}
            >
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <report.icon className="h-5 w-5" />
                {report.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {report.description}
              </p>
              {progress && (
                <div className="space-y-2">
                  <Progress value={progress.progress} />
                  {progress.message && (
                    <p className="text-xs text-muted-foreground">{progress.message}</p>
                  )}
                </div>
              )}
              <Button
                onClick={() => handleGenerateReport(report.type)}
                disabled={isGenerating}
                className="w-full"
                variant={isError ? "destructive" : "default"}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    {isError ? "Retry" : "Generate Report"}
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Report Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newTemplateDesc}
                onChange={(e) => setNewTemplateDesc(e.target.value)}
                placeholder="Enter template description"
              />
            </div>
            <Button onClick={handleCreateTemplate}>Create Template</Button>
          </div>
          <ScrollArea className="h-[300px] mt-4">
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Scheduled Reports</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {scheduledReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Next run: {report.next_run_at ? format(new Date(report.next_run_at), 'PPp') : 'Not scheduled'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Recipients: {report.recipients.length}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      Run Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
