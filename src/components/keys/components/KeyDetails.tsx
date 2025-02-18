
import { Key, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KeyAssignment } from "../types/assignmentTypes";

interface KeyDetailsProps {
  assignment: KeyAssignment;
}

export function KeyDetails({ assignment }: KeyDetailsProps) {
  return (
    <div className="flex items-center gap-2">
      <Key className="h-4 w-4" />
      {assignment.keys?.name}
      {assignment.keys?.is_passkey && (
        <Badge variant="secondary">Passkey</Badge>
      )}
      {assignment.is_spare && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Spare
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reason: {assignment.spare_key_reason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
