import { format } from "date-fns";
import { User, Calendar, Building2, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface KeyAssignmentSummaryProps {
  assignment: {
    id: string;
    assigned_at: string;
    is_spare: boolean;
    spare_key_reason?: string | null;
    keys?: {
      id: string;
      name: string;
      type: string;
      is_passkey?: boolean;
    } | null;
    occupant?: {
      id: string;
      first_name: string;
      last_name: string;
      department?: string | null;
      rooms?: Array<{
        name: string;
        room_number: string;
        floors?: {
          name: string;
          buildings?: {
            name: string;
          };
        };
      }>;
    } | null;
  };
}

export function KeyAssignmentSummary({ assignment }: KeyAssignmentSummaryProps) {
  const occupantName = assignment.occupant 
    ? `${assignment.occupant.first_name} ${assignment.occupant.last_name}` 
    : 'Unknown Occupant';

  const primaryRoom = assignment.occupant?.rooms?.[0];
  const locationText = primaryRoom 
    ? `${primaryRoom.floors?.buildings?.name} - ${primaryRoom.name} (${primaryRoom.room_number})`
    : 'No room assigned';

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-4 space-y-3">
        {/* Key Information */}
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          <span className="font-medium">{assignment.keys?.name || 'Unknown Key'}</span>
          {assignment.keys?.is_passkey && (
            <Badge variant="secondary" className="text-xs">Passkey</Badge>
          )}
          {assignment.is_spare && (
            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400">
              Spare Key
            </Badge>
          )}
        </div>

        {/* Occupant Information */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="font-medium text-sm">{occupantName}</div>
            {assignment.occupant?.department && (
              <div className="text-xs text-muted-foreground">
                {assignment.occupant.department}
              </div>
            )}
          </div>
        </div>

        {/* Location Information */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">{locationText}</div>
        </div>

        {/* Assignment Date */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="text-sm">
            <span className="text-muted-foreground">Assigned: </span>
            {format(new Date(assignment.assigned_at), "MMM d, yyyy 'at' h:mm a")}
          </div>
        </div>

        {/* Spare Key Reason */}
        {assignment.is_spare && assignment.spare_key_reason && (
          <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded border-l-2 border-yellow-200 dark:border-yellow-800">
            <strong>Reason for spare key:</strong> {assignment.spare_key_reason}
          </div>
        )}
      </CardContent>
    </Card>
  );
}