
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useState } from "react";
import { ReportCard } from "./components/ReportCard";
import { TemplateDialog } from "./components/TemplateDialog";
import { ScheduleDialog } from "./components/ScheduleDialog";
import { ReportHeader } from "./components/ReportHeader";
import { reports } from "./config/reportTypes";
import { useReportGeneration } from "./hooks/useReportGeneration";
import { useTemplateManagement } from "./hooks/useTemplateManagement";
import { useScheduledReports } from "./hooks/useScheduledReports";

export function ReportsSection() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const { reportProgress, handleGenerateReport } = useReportGeneration();
  const { 
    templates, 
    newTemplateName, 
    newTemplateDesc, 
    setNewTemplateName, 
    setNewTemplateDesc, 
    loadTemplates, 
    handleCreateTemplate 
  } = useTemplateManagement();
  const { scheduledReports, loadScheduledReports } = useScheduledReports();

  return (
    <Card className="p-6">
      <ReportHeader 
        onShowTemplates={() => {
          void loadTemplates();
          setShowTemplates(true);
        }}
        onShowSchedule={() => {
          void loadScheduledReports();
          setShowSchedule(true);
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
