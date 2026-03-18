
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ScheduledReport } from "../types";

interface ScheduleDialogProps {
  scheduledReports: ScheduledReport[];
}

export function ScheduleDialog({ scheduledReports }: ScheduleDialogProps) {
  return (
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
  );
}

