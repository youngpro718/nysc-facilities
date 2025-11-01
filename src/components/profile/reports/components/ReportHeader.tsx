
import { Button } from "@/components/ui/button";
import { BookTemplate, Clock } from "lucide-react";

interface ReportHeaderProps {
  onShowTemplates: () => void;
  onShowSchedule: () => void;
}

export function ReportHeader({ onShowTemplates, onShowSchedule }: ReportHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold">Reports</h2>
      <div className="space-x-2">
        <Button
          variant="outline"
          onClick={onShowTemplates}
        >
          <BookTemplate className="mr-2 h-4 w-4" />
          Templates
        </Button>
        <Button
          variant="outline"
          onClick={onShowSchedule}
        >
          <Clock className="mr-2 h-4 w-4" />
          Scheduled Reports
        </Button>
      </div>
    </div>
  );
}

