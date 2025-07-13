import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building, 
  Key, 
  DoorOpen, 
  Mail, 
  Phone, 
  MoreVertical,
  ChevronRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OccupantQueryResponse } from "./types/occupantTypes";

interface EnhancedMobileOccupantCardProps {
  occupant: OccupantQueryResponse;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssignRooms?: () => void;
  onAssignKeys?: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function EnhancedMobileOccupantCard({
  occupant,
  onClick,
  onEdit,
  onDelete,
  onAssignRooms,
  onAssignKeys,
  isSelected = false,
  onToggleSelect,
}: EnhancedMobileOccupantCardProps) {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'on_leave': return 'outline';
      case 'terminated': return 'destructive';
      default: return 'secondary';
    }
  };

  const primaryRoom = occupant.rooms?.[0];
  const additionalRooms = occupant.rooms?.slice(1) || [];

  return (
    <Card className={`p-4 transition-colors ${isSelected ? 'bg-primary/5 border-primary' : ''}`}>
      {/* Header with selection and actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {onToggleSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
            />
          )}
          <Avatar className="h-10 w-10">
            <AvatarImage src="" />
            <AvatarFallback className="text-sm">
              {getInitials(occupant.first_name, occupant.last_name)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                Edit Details
              </DropdownMenuItem>
            )}
            {onAssignRooms && (
              <DropdownMenuItem onClick={onAssignRooms}>
                <DoorOpen className="h-4 w-4 mr-2" />
                Assign Rooms
              </DropdownMenuItem>
            )}
            {onAssignKeys && (
              <DropdownMenuItem onClick={onAssignKeys}>
                <Key className="h-4 w-4 mr-2" />
                Assign Keys
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main content */}
      <div className="space-y-3">
        {/* Name and status */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {occupant.first_name} {occupant.last_name}
            </h3>
            {occupant.title && (
              <p className="text-sm text-muted-foreground">{occupant.title}</p>
            )}
          </div>
          <Badge variant={getStatusColor(occupant.status)}>
            {occupant.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Department */}
        {occupant.department && (
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{occupant.department}</span>
          </div>
        )}

        {/* Contact info */}
        <div className="space-y-1">
          {occupant.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{occupant.email}</span>
            </div>
          )}
          {occupant.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{occupant.phone}</span>
            </div>
          )}
        </div>

        {/* Room assignments */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Room Assignments</h4>
          {occupant.rooms && occupant.rooms.length > 0 ? (
            <div className="space-y-2">
              {/* Primary room */}
              {primaryRoom && (
                <div className="flex items-center justify-between p-2 bg-primary/5 rounded-md">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {primaryRoom.room_number || primaryRoom.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      </div>
                      {primaryRoom.floors?.buildings?.name && (
                        <div className="text-xs text-muted-foreground">
                          {primaryRoom.floors.buildings.name}
                          {primaryRoom.floors?.name && ` - ${primaryRoom.floors.name}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional rooms */}
              {additionalRooms.length > 0 && (
                <div className="space-y-1">
                  {additionalRooms.slice(0, 2).map((room, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm">{room.room_number || room.name}</span>
                        {room.floors?.buildings?.name && (
                          <div className="text-xs text-muted-foreground">
                            {room.floors.buildings.name}
                            {room.floors?.name && ` - ${room.floors.name}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {additionalRooms.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{additionalRooms.length - 2} more rooms
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border-2 border-dashed border-muted rounded-md">
              <span className="text-sm text-muted-foreground">No rooms assigned</span>
              {onAssignRooms && (
                <Button variant="outline" size="sm" onClick={onAssignRooms}>
                  Assign Room
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Keys count */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {occupant.key_count || 0} {occupant.key_count === 1 ? 'key' : 'keys'} assigned
            </span>
          </div>
          {onClick && (
            <Button variant="ghost" size="sm" onClick={onClick}>
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}