
import { Key, DoorOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KeyAssignmentSummaryProps {
  totalKeys: number;
  totalDoorAccess: number;
}

export function KeyAssignmentSummary({ 
  totalKeys, 
  totalDoorAccess 
}: KeyAssignmentSummaryProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Badge variant="outline" className="flex items-center gap-2">
        <Key className="h-3 w-3" /> 
        {totalKeys} Keys Assigned
      </Badge>
      <Badge variant="outline" className="flex items-center gap-2">
        <DoorOpen className="h-3 w-3" /> 
        {totalDoorAccess} Door Access
      </Badge>
    </div>
  );
}
