import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, 
  DoorClosed, 
  Key, 
  Calendar, 
  MapPin, 
  Crown, 
  Clock,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { DetailedRoomAssignment, DetailedKeyAssignment } from "@/hooks/occupants/useOccupantAssignments";

interface DetailedAssignmentViewProps {
  roomAssignments: DetailedRoomAssignment[];
  keyAssignments: DetailedKeyAssignment[];
  primaryRoom?: DetailedRoomAssignment;
}

export function DetailedAssignmentView({ 
  roomAssignments, 
  keyAssignments, 
  primaryRoom 
}: DetailedAssignmentViewProps) {
  return (
    <div className="space-y-6">
      {/* Primary Room Section */}
      {primaryRoom && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Primary Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <DoorClosed className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{primaryRoom.room_name}</h3>
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    Room {primaryRoom.room_number}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {primaryRoom.building_name} • Floor {primaryRoom.floor_name}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Assigned {format(new Date(primaryRoom.assigned_at), 'MMM dd, yyyy')}
                </div>
                {primaryRoom.schedule && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {primaryRoom.schedule}
                  </div>
                )}
                {primaryRoom.notes && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 mt-0.5" />
                    <span>{primaryRoom.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secondary Room Assignments */}
      {roomAssignments.filter(room => !room.is_primary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Secondary Room Assignments ({roomAssignments.filter(room => !room.is_primary).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-4">
                {roomAssignments
                  .filter(room => !room.is_primary)
                  .map((assignment, index) => (
                    <div key={assignment.id}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <DoorClosed className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{assignment.room_name}</h4>
                            <Badge variant="outline">Room {assignment.room_number}</Badge>
                            <Badge variant="secondary" className="text-xs">
                              {assignment.assignment_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.building_name} • Floor {assignment.floor_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Assigned {format(new Date(assignment.assigned_at), 'MMM dd, yyyy')}
                          </div>
                          {assignment.schedule && (
                            <div className="text-xs text-muted-foreground">
                              Schedule: {assignment.schedule}
                            </div>
                          )}
                        </div>
                      </div>
                      {index < roomAssignments.filter(room => !room.is_primary).length - 1 && (
                        <Separator className="my-3" />
                      )}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Key Assignments */}
      {keyAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Key Assignments ({keyAssignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-4">
                {keyAssignments.map((assignment, index) => (
                  <div key={assignment.id}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <Key className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{assignment.key_name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {assignment.key_type}
                          </Badge>
                          {assignment.is_spare && (
                            <Badge variant="secondary" className="text-xs">
                              Spare
                            </Badge>
                          )}
                        </div>
                        {assignment.room_name && (
                          <div className="text-sm text-muted-foreground">
                            Access to: {assignment.room_name}
                          </div>
                        )}
                        {assignment.building_name && (
                          <div className="text-sm text-muted-foreground">
                            Building: {assignment.building_name}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Assigned {format(new Date(assignment.assigned_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                    {index < keyAssignments.length - 1 && (
                      <Separator className="my-3" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* No Assignments */}
      {roomAssignments.length === 0 && keyAssignments.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <DoorClosed className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">No Assignments</h3>
              <p className="text-sm text-muted-foreground">
                This occupant has no room or key assignments.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}