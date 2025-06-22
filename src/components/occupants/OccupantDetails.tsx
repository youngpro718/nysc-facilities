
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Mail, Phone, Briefcase, UserCircle, Building2, Key, DoorOpen, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useKeyAssignments } from "./hooks/useKeyAssignments";
import { useIsMobile } from "@/hooks/use-mobile";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { OccupantQueryResponse } from "./types/occupantTypes";

interface OccupantDetailsProps {
  occupant: OccupantQueryResponse;
}

export function OccupantDetails({ occupant }: OccupantDetailsProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { keyAssignments, isLoading } = useKeyAssignments(occupant.id);

  // Group rooms by assignment type
  const groupedRooms = occupant.rooms.reduce((acc, room) => {
    const type = room.assignment_type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(room);
    return acc;
  }, {} as Record<string, typeof occupant.rooms>);

  const totalDoorAccess = keyAssignments?.reduce((count, assignment) => {
    if (assignment.keys?.is_passkey) return count + 5;
    // Use the correct property name for door locations
    return count + (assignment.keys?.key_door_locations_table?.length || 1);
  }, 0) || 0;

  const getAssignmentTypeLabel = (type: string) => {
    switch (type) {
      case 'primary_office': return 'Primary Office';
      case 'work_location': return 'Work Location';
      case 'support_space': return 'Support Space';
      default: return type;
    }
  };

  return (
    <Card className="bg-background/50 p-4 space-y-6">
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => navigate("/occupants")}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Occupants
        </Button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
          <div className="space-y-2">
            {occupant.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${occupant.email}`} className="hover:text-primary">
                  {occupant.email}
                </a>
              </div>
            )}
            {occupant.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${occupant.phone}`} className="hover:text-primary">
                  {occupant.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Employment Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Employment Details</h3>
          <div className="space-y-2">
            {occupant.department && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{occupant.department}</span>
              </div>
            )}
            {occupant.title && (
              <div className="flex items-center gap-2 text-sm">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <span>{occupant.title}</span>
              </div>
            )}
            {occupant.status && (
              <div className="flex items-center gap-2">
                <Badge variant={occupant.status === 'active' ? 'default' : 'secondary'}>
                  {occupant.status}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Room Assignments */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Room Assignments</h3>
        <div className="space-y-6">
          {Object.entries(groupedRooms).map(([type, rooms]) => (
            <div key={type} className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Badge variant="outline">{getAssignmentTypeLabel(type)}</Badge>
              </h4>
              <div className="space-y-2">
                {rooms.map((room, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {room.floors?.buildings?.name} &gt; {room.floors?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Room {room.room_number}</span>
                      {room.schedule && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{room.schedule}</span>
                        </div>
                      )}
                    </div>
                    {room.notes && (
                      <p className="text-sm text-muted-foreground">{room.notes}</p>
                    )}
                    {room.connections?.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Connected to: </span>
                        {room.connections.map((conn, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <ArrowRight className="h-4 w-4" />
                            {conn.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Access Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Access Information</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{keyAssignments?.length || 0} Keys Assigned</span>
          </div>
          <div className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{totalDoorAccess} Door Access</span>
          </div>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        ) : keyAssignments && keyAssignments.length > 0 ? (
          <div className="grid gap-2">
            {keyAssignments.map((assignment) => (
              <div 
                key={assignment.id}
                className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
              >
                <span>{assignment.keys.name}</span>
                {assignment.keys.is_passkey && (
                  <Badge variant="secondary">Passkey</Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No keys currently assigned
          </div>
        )}
      </div>
    </Card>
  );
}
