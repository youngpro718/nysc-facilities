import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DoorClosed, 
  AlertCircle, 
  Plus, 
  Building2, 
  Users,
  ArrowRight,
  CalendarDays
} from "lucide-react";
import { useEnhancedRoomAssignments } from "@/hooks/dashboard/useEnhancedRoomAssignments";
import { useRoomIssues } from "@/hooks/dashboard/useRoomIssues";
import { useAuth } from "@/hooks/useAuth";
import type { UserAssignment } from "@/types/dashboard";

interface PrimaryRoomWidgetProps {
  onQuickReport?: (roomData: UserAssignment) => void;
  onViewIssues?: (roomData: UserAssignment) => void;
  compact?: boolean;
}

export function PrimaryRoomWidget({ 
  onQuickReport, 
  onViewIssues, 
  compact = false 
}: PrimaryRoomWidgetProps) {
  const { user } = useAuth();
  const { primaryRoom, isLoading } = useEnhancedRoomAssignments(user?.id);
  const { openIssues, totalIssues } = useRoomIssues({ 
    roomIds: primaryRoom ? [primaryRoom.room_id] : [], 
    userId: user?.id,
    enabled: !!primaryRoom 
  });

  if (isLoading) {
    return (
      <Card className={compact ? "h-40" : ""}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            <span>Loading primary room...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!primaryRoom) {
    return (
      <Card className={compact ? "h-40" : ""}>
        <CardContent className="flex flex-col items-center justify-center h-full text-center p-6">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
            <DoorClosed className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-sm mb-1">No Primary Room</h3>
          <p className="text-xs text-muted-foreground">
            Contact admin to assign your primary office
          </p>
        </CardContent>
      </Card>
    );
  }

  const priorityColor = openIssues.length > 0 ? "destructive" : totalIssues > 0 ? "secondary" : "default";

  return (
    <Card className={`transition-all hover:shadow-md ${compact ? "h-40" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DoorClosed className="w-4 h-4 text-primary" />
            My Office
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Primary
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Room Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{primaryRoom.room_name}</h3>
            <span className="text-xs text-muted-foreground">
              Room {primaryRoom.room_number}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>{primaryRoom.building_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{primaryRoom.occupant_count || 1} occupant{(primaryRoom.occupant_count || 1) !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {!compact && <Separator />}

        {/* Issues Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Issues Status
            </span>
            <Badge variant={priorityColor} className="text-xs">
              {openIssues.length > 0 ? `${openIssues.length} Open` : 
               totalIssues > 0 ? `${totalIssues} Total` : 'All Clear'}
            </Badge>
          </div>

          {!compact && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickReport?.(primaryRoom)}
                className="h-8 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Report Issue
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewIssues?.(primaryRoom)}
                className="h-8 text-xs"
                disabled={totalIssues === 0}
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Recent Activity Indicator */}
        {!compact && openIssues.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center gap-2 p-2 bg-destructive/5 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <div className="flex-1">
                <p className="text-xs font-medium">Action Required</p>
                <p className="text-xs text-muted-foreground">
                  {openIssues.length} open issue{openIssues.length !== 1 ? 's' : ''} need attention
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}