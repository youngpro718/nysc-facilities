
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Mail, Phone, Briefcase, UserCircle, Building2, Key, DoorOpen } from "lucide-react";
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
  const primaryRoom = occupant.rooms[0];

  const totalDoorAccess = keyAssignments?.reduce((count, assignment) => {
    if (assignment.keys?.is_passkey) return count + 5;
    return count + (assignment.keys?.key_door_locations?.length || 1);
  }, 0) || 0;

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

      {/* Location */}
      {primaryRoom?.floors?.buildings && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>
              {primaryRoom.floors.buildings.name} - Room {primaryRoom.room_number}
            </span>
          </div>
        </div>
      )}

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
