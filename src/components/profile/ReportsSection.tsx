import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Lightbulb, User, Key, DoorOpen, Bug, Database } from "lucide-react";
import { 
  fetchFloorplanReportData, 
  fetchMaintenanceSummary,
  fetchLightingReport,
  fetchOccupantReport,
  fetchKeyReport,
  fetchRoomReport,
  fetchIssueReport,
  fetchFullDatabaseReport,
  generateFullReport, 
  downloadReport 
} from "./reportService";

export function ReportsSection() {
  const { toast } = useToast();

  const handleGenerateReport = async (type: string) => {
    try {
      let reportData;
      
      switch (type) {
        case 'floorplan':
          const [floorplanData, maintenanceData] = await Promise.all([
            fetchFloorplanReportData(),
            fetchMaintenanceSummary()
          ]);
          reportData = generateFullReport(floorplanData, maintenanceData);
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

      downloadReport(reportData, type);

      toast({
        title: "Report Generated Successfully",
        description: `Your ${type} report has been downloaded.`,
      });
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating the report.",
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
      <h2 className="text-2xl font-bold mb-4">Reports</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => (
          <div key={report.type} className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <report.icon className="h-5 w-5" />
              {report.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {report.description}
            </p>
            <Button
              onClick={() => handleGenerateReport(report.type)}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}