import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  DoorClosed, 
  Users,
  Zap,
  Wrench,
  Thermometer,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEnhancedRoomAssignments } from "@/hooks/dashboard/useEnhancedRoomAssignments";
import type { UserAssignment } from "@/types/dashboard";

interface QuickIssueReportWidgetProps {
  onReportIssue: (roomData: UserAssignment, issueType?: string) => void;
}

const quickIssueTypes = [
  {
    type: "electrical",
    icon: Zap,
    label: "Electrical",
    color: "text-yellow-600 bg-yellow-100"
  },
  {
    type: "maintenance",
    icon: Wrench,
    label: "Maintenance", 
    color: "text-blue-600 bg-blue-100"
  },
  {
    type: "hvac",
    icon: Thermometer,
    label: "HVAC",
    color: "text-green-600 bg-green-100"
  },
  {
    type: "safety",
    icon: AlertTriangle,
    label: "Safety",
    color: "text-red-600 bg-red-100"
  }
];

export function QuickIssueReportWidget({ onReportIssue }: QuickIssueReportWidgetProps) {
  const { user } = useAuth();
  const { primaryRoom, secondaryRooms, isLoading } = useEnhancedRoomAssignments(user?.id);
  const [selectedRoom, setSelectedRoom] = useState<UserAssignment | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-muted-foreground">Loading rooms...</div>
        </CardContent>
      </Card>
    );
  }

  const allRooms = [primaryRoom, ...secondaryRooms].filter(Boolean) as UserAssignment[];

  if (allRooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            <DoorClosed className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No rooms assigned</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleRoomSelect = (room: UserAssignment) => {
    setSelectedRoom(room);
  };

  const handleQuickReport = (issueType?: string) => {
    const targetRoom = selectedRoom || primaryRoom;
    if (targetRoom) {
      onReportIssue(targetRoom, issueType);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Quick Report
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Room Selection */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">SELECT ROOM</h4>
          <div className="grid gap-2">
            {allRooms.map((room) => (
              <Button
                key={room.id}
                variant={selectedRoom?.id === room.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleRoomSelect(room)}
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center gap-2 flex-1">
                    <DoorClosed className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium text-sm">{room.room_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Room {room.room_number}
                      </div>
                    </div>
                  </div>
                  {room.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Issue Types */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">QUICK ACTIONS</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickIssueTypes.map((issueType) => {
              const Icon = issueType.icon;
              return (
                <Button
                  key={issueType.type}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReport(issueType.type)}
                  disabled={!selectedRoom && !primaryRoom}
                  className="h-auto p-3 flex-col gap-1"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${issueType.color}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="text-xs">{issueType.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* General Report Button */}
        <Button
          onClick={() => handleQuickReport()}
          className="w-full"
          disabled={!selectedRoom && !primaryRoom}
        >
          <Plus className="w-4 h-4 mr-2" />
          Report Other Issue
        </Button>

        {/* Room Info */}
        {(selectedRoom || primaryRoom) && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3" />
              <span>
                Reporting for {(selectedRoom || primaryRoom)?.room_name} 
                {(selectedRoom || primaryRoom)?.is_primary && " (Your Office)"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}