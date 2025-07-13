import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Building2, AlertCircle, Key } from "lucide-react";
import { DetailedRoomAssignment } from "@/hooks/occupants/useOccupantAssignments";

interface PrimaryRoomWidgetProps {
  primaryRoom: DetailedRoomAssignment;
  onReportIssue?: () => void;
}

export function PrimaryRoomWidget({
  primaryRoom,
  onReportIssue
}: PrimaryRoomWidgetProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Primary Room
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">{primaryRoom.room_name}</h3>
          <p className="text-sm text-muted-foreground">
            {primaryRoom.building_name} • Room {primaryRoom.room_number}
          </p>
        </div>
        
        <Button onClick={onReportIssue} className="w-full">
          <AlertCircle className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </CardContent>
    </Card>
  );
}