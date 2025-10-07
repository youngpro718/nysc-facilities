
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Briefcase, Building2, ChevronDown, DoorOpen, Key, Mail, Pencil, Phone, Trash2, UserCircle, Shield, LogOut, Crown, MapPin } from "lucide-react";
import { OccupantQueryResponse } from "./types/occupantTypes";
import { OccupantDepartureView } from "@/components/access/OccupantDepartureView";
import { useOccupantAssignments } from "@/hooks/occupants/useOccupantAssignments";
import { DetailedAssignmentView } from "./DetailedAssignmentView";

interface OccupantCardProps {
  occupant: OccupantQueryResponse;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (occupant: OccupantQueryResponse) => void;
  onDelete: (id: string) => void;
}

export function OccupantCard({
  occupant,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: OccupantCardProps) {
  const { data: assignments, isLoading: assignmentsLoading } = useOccupantAssignments(occupant.id);
  
  // Get the first room for display purposes (fallback)
  const primaryRoom = occupant.rooms[0];
  const assignmentsPrimaryRoom = assignments?.primaryRoom;

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">
                {occupant.first_name} {occupant.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {occupant.title || "No title"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={occupant.status === 'active' ? 'default' : 'secondary'}>
                {occupant.status}
              </Badge>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{occupant.department || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span>{occupant.title || "—"}</span>
            </div>
          </div>

          {/* Room Assignment Summary */}
          <div className="space-y-2">
            {assignmentsPrimaryRoom && (
              <div className="flex items-center gap-2 text-sm">
                <Crown className="h-4 w-4 text-primary" />
                <span className="font-medium">Primary:</span>
                <span>{assignmentsPrimaryRoom.room_name} ({assignmentsPrimaryRoom.building_name})</span>
                <Badge variant="default" className="text-xs">Room {assignmentsPrimaryRoom.room_number}</Badge>
              </div>
            )}
            
            {assignments && assignments.roomAssignments.filter(r => !r.is_primary).length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Secondary rooms: {assignments.roomAssignments.filter(r => !r.is_primary).length}</span>
              </div>
            )}
            
            {!assignmentsPrimaryRoom && occupant.rooms && occupant.rooms.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <strong>Rooms:</strong> {
                  occupant.rooms.map(r => `${r.floors?.buildings?.name ? r.floors.buildings.name + ' - ' : ''}${r.room_number || r.name}`).join(', ')
                }
              </div>
            )}
            
            {!assignmentsPrimaryRoom && (!occupant.rooms || occupant.rooms.length === 0) && (
              <div className="text-sm text-muted-foreground">
                <strong>Rooms:</strong> —
              </div>
            )}
          </div>

          {/* Access Information */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t pt-4 gap-3">
            <div className="flex gap-4">
              <div className="flex items-center gap-1">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{assignments?.keyAssignments.length || occupant.key_count || 0}</span>
                <span className="text-xs text-muted-foreground">keys</span>
              </div>
              <div className="flex items-center gap-1">
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{assignments?.roomAssignments.length || occupant.room_count || 0}</span>
                <span className="text-xs text-muted-foreground">rooms</span>
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {/* Detailed Assignments Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="View Detailed Assignments"
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Detailed Assignments - {occupant.first_name} {occupant.last_name}</DialogTitle>
                  </DialogHeader>
                  {assignmentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : assignments ? (
                    <DetailedAssignmentView
                      roomAssignments={assignments.roomAssignments}
                      keyAssignments={assignments.keyAssignments}
                      primaryRoom={assignments.primaryRoom}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No assignment details available
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Departure Process Dialog - only show if occupant has assignments */}
              {((assignments?.keyAssignments.length || 0) > 0 || (assignments?.roomAssignments.length || 0) > 0 || occupant.key_count > 0 || occupant.room_count > 0) && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Departure Process"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Departure Process - {occupant.first_name} {occupant.last_name}</DialogTitle>
                    </DialogHeader>
                    <OccupantDepartureView occupantId={occupant.id} />
                  </DialogContent>
                </Dialog>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(occupant)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(occupant.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleExpand}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="space-y-4 border-t pt-4">
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
              {/* Key Details */}
              {assignments && assignments.keyAssignments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Key Assignments
                  </h4>
                  {assignments.keyAssignments.slice(0, 3).map((key) => (
                    <div key={key.id} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                        <Key className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <span>{key.key_name}</span>
                      {key.is_spare && <Badge variant="outline" className="text-xs">Spare</Badge>}
                    </div>
                  ))}
                  {assignments.keyAssignments.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-8">
                      +{assignments.keyAssignments.length - 3} more keys
                    </div>
                  )}
                </div>
              )}

              {/* Room Details */}
              {assignments && assignments.roomAssignments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Room Details
                  </h4>
                  {assignments.roomAssignments.map((room) => (
                    <div key={room.id} className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                        {room.is_primary ? (
                          <Crown className="h-3 w-3 text-primary" />
                        ) : (
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <span>{room.building_name} - {room.room_name}</span>
                      <Badge variant={room.is_primary ? "default" : "outline"} className="text-xs">
                        {room.is_primary ? "Primary" : room.assignment_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Fallback to old format if no detailed assignments */}
              {!assignments && primaryRoom?.floors?.buildings && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {primaryRoom.floors.buildings.name} - Room {primaryRoom.room_number}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
