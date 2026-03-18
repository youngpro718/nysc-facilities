
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
              <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400 border-yellow-600 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Spare
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">Spare Key</p>
                {assignment.spare_key_reason && (
                  <p className="text-sm">Reason: {assignment.spare_key_reason}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This is an additional key for the same access
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
