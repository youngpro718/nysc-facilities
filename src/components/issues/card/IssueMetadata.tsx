
import { CalendarClock, Building, MapPin, History } from "lucide-react";
import { format } from "date-fns";

interface IssueMetadataProps {
  timeRemaining: string;
  dueDate?: string;
  isOverdue: boolean;
  buildingName?: string;
  floorName?: string;
  roomName?: string;
  assigned_to: string;
  status_history?: Array<{
    status: string;
    changed_at: string;
    previous_status: string;
  }>;
}

export const IssueMetadata = ({
  timeRemaining,
  dueDate,
  isOverdue,
  buildingName,
  floorName,
  roomName,
  assigned_to,
  status_history
}: IssueMetadataProps) => {
  return (
    <div className="space-y-2 text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 flex-shrink-0" />
        <span>{timeRemaining}</span>
        {dueDate && (
          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
            • Due: {format(new Date(dueDate), 'MMM d, yyyy')}
          </span>
        )}
      </div>

      {(buildingName || floorName || roomName) && (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {[buildingName, floorName, roomName]
              .filter(Boolean)
              .join(' > ')}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 flex-shrink-0" />
        <span>Assigned to: {assigned_to}</span>
      </div>

      {status_history && status_history.length > 0 && (
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            Last change: {format(new Date(status_history[0].changed_at), 'MMM d, HH:mm')} - 
            {status_history[0].previous_status} → {status_history[0].status}
          </span>
        </div>
      )}
    </div>
  );
};
