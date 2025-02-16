
import { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface HistoryTabProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function HistoryTab({ form }: HistoryTabProps) {
  return (
    <div>
      <div>
        <h3 className="text-lg font-medium">History</h3>
        <p className="text-sm text-muted-foreground">
          View status and maintenance history.
        </p>
      </div>

      <div className="space-y-4">
        {form.watch("statusHistory")?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <Badge variant={entry.status === 'active' ? 'default' : 'destructive'}>
              {entry.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {format(new Date(entry.changed_at), "PPP")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
