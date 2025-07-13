import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  MapPin, 
  User, 
  Clock, 
  MessageCircle, 
  Users, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Clock as ClockIcon,
  Camera
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { QuickUpdateActions } from "./QuickUpdateActions";
import { ReporterProfile } from "./ReporterProfile";
import { RoomOccupantContext } from "./RoomOccupantContext";
import type { EnhancedIssue } from "@/hooks/dashboard/useAdminIssuesData";

interface EnhancedIssueCardProps {
  issue: EnhancedIssue;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onUpdate: () => void;
}

export function EnhancedIssueCard({ issue, isSelected, onSelect, onUpdate }: EnhancedIssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const priorityConfig = {
    high: { color: 'destructive', icon: AlertTriangle },
    medium: { color: 'secondary', icon: ClockIcon },
    low: { color: 'outline', icon: CheckCircle }
  } as const;

  const statusConfig = {
    open: { color: 'destructive', label: 'Open' },
    in_progress: { color: 'secondary', label: 'In Progress' },
    resolved: { color: 'default', label: 'Resolved' }
  } as const;

  const priorityInfo = priorityConfig[issue.priority as keyof typeof priorityConfig];
  const statusInfo = statusConfig[issue.status as keyof typeof statusConfig];
  const PriorityIcon = priorityInfo?.icon || AlertTriangle;

  return (
    <Card className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : ''} ${issue.priority === 'high' && issue.status !== 'resolved' ? 'border-destructive' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
            <div className="flex items-center gap-2">
              <Badge variant={priorityInfo?.color} className="text-xs">
                <PriorityIcon className="h-3 w-3 mr-1" />
                {issue.priority.toUpperCase()}
              </Badge>
              <Badge variant={statusInfo?.color} className="text-xs">
                {statusInfo?.label}
              </Badge>
            </div>
          </div>
          
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        <div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">
            {issue.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {issue.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Basic Info */}
        <div className="space-y-2 text-xs text-muted-foreground">
          {issue.rooms && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{issue.rooms.room_number} - {issue.rooms.name}</span>
            </div>
          )}
          
          {issue.reporter && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{issue.reporter.first_name} {issue.reporter.last_name}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
            </div>
            
            {issue.comments_count > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{issue.comments_count}</span>
              </div>
            )}
            
            {issue.photos && issue.photos.length > 0 && (
              <div className="flex items-center gap-1">
                <Camera className="h-3 w-3" />
                <span>{issue.photos.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        <Collapsible open={isExpanded}>
          <CollapsibleContent className="mt-4 space-y-4">
            {/* Reporter Profile */}
            {issue.reporter && (
              <ReporterProfile reporter={issue.reporter} />
            )}

            {/* Room Occupants */}
            {issue.room_occupants && issue.room_occupants.length > 0 && (
              <RoomOccupantContext occupants={issue.room_occupants} />
            )}

            {/* Photos Preview */}
            {issue.photos && issue.photos.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Photos</h5>
                <div className="flex gap-2 overflow-x-auto">
                  {issue.photos.slice(0, 3).map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Issue photo ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ))}
                  {issue.photos.length > 3 && (
                    <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center text-xs">
                      +{issue.photos.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <QuickUpdateActions
              issue={issue}
              onUpdate={onUpdate}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Room Occupants Preview (when collapsed) */}
        {!isExpanded && issue.room_occupants && issue.room_occupants.length > 0 && (
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{issue.room_occupants.length} occupant{issue.room_occupants.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}