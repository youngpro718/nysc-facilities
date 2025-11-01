import { format } from "date-fns";
import { User, Calendar, Key, MapPin, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatAssignmentData, formatAssignmentStructured, RawAssignmentData, EnhancedAssignmentData } from "../utils/assignmentFormatter";

interface AssignmentDisplayProps {
  rawData: RawAssignmentData;
  enhancedData?: EnhancedAssignmentData;
  variant?: "compact" | "detailed" | "inline";
}

export function AssignmentDisplay({ 
  rawData, 
  enhancedData, 
  variant = "compact" 
}: AssignmentDisplayProps) {
  const formatted = formatAssignmentStructured(rawData, enhancedData);

  if (variant === "inline") {
    return (
      <span className="text-sm">
        {formatAssignmentData(rawData, enhancedData)}
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Key className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">{formatted.key}</span>
        <span className="text-muted-foreground">→</span>
        <User className="h-3 w-3 text-muted-foreground" />
        <span>{formatted.occupant}</span>
        {formatted.isSpare && (
          <Badge variant="outline" className="text-xs">Spare</Badge>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
      {/* Key Information */}
      <div className="flex items-center gap-2">
        <Key className="h-4 w-4 text-primary" />
        <span className="font-medium">{formatted.key}</span>
        {formatted.isSpare && (
          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
            Spare Key
          </Badge>
        )}
      </div>

      {/* Occupant */}
      <div className="flex items-center gap-2 text-sm">
        <User className="h-3 w-3 text-muted-foreground" />
        <span>{formatted.occupant}</span>
        {formatted.department !== 'Unknown' && (
          <>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{formatted.department}</span>
          </>
        )}
      </div>

      {/* Location */}
      {formatted.location !== 'Unknown' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{formatted.location}</span>
        </div>
      )}

      {/* Assignment Date */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>Assigned: {formatted.assignedDate}</span>
      </div>

      {/* Spare Key Reason */}
      {formatted.isSpare && formatted.spareReason && (
        <div className="flex items-start gap-2 text-xs bg-yellow-50 p-2 rounded border-l-2 border-yellow-200">
          <Info className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium text-yellow-800">Spare Key Reason:</span>{" "}
            <span className="text-yellow-700">{formatted.spareReason}</span>
          </div>
        </div>
      )}
    </div>
  );
}