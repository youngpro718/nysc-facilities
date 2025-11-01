import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Crown, MapPin, Key, AlertCircle, Plus } from "lucide-react";
import { DetailedRoomAssignment, DetailedKeyAssignment } from "@/hooks/occupants/useOccupantAssignments";

interface RoomAssignmentCardProps {
  roomAssignments: DetailedRoomAssignment[];
  keyAssignments: DetailedKeyAssignment[];
  primaryRoom?: DetailedRoomAssignment;
  onReportIssue?: (roomId: string) => void;
}

export function RoomAssignmentCard({
  roomAssignments,
  keyAssignments,
  primaryRoom,
  onReportIssue
}: RoomAssignmentCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          My Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {primaryRoom && (
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-semibold">{primaryRoom.room_name}</span>
              <Badge variant="default" className="text-xs">Primary</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {primaryRoom.building_name} • Room {primaryRoom.room_number}
            </p>
            <Button 
              size="sm" 
              onClick={() => onReportIssue?.(primaryRoom.room_id)}
              className="w-full touch-target active:scale-95 transition-transform"
            >
              <AlertCircle className="h-3 w-3 mr-2" />
              Report Issue
            </Button>
          </div>
        )}
        
        {roomAssignments.filter(r => !r.is_primary).map((room) => (
          <div key={room.id} className="flex items-center justify-between p-3 border rounded transition-colors hover:bg-accent/50">
            <div>
              <div className="font-medium text-sm">{room.room_name}</div>
              <div className="text-xs text-muted-foreground">{room.building_name}</div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onReportIssue?.(room.room_id)}
              className="touch-target active:scale-95 transition-transform"
            >
              <AlertCircle className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}