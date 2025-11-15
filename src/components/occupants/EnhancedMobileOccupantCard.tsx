import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Building, 
  Key, 
  DoorOpen, 
  Mail, 
  Phone, 
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Crown,
  MapPin,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
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
  const [isRoomsExpanded, setIsRoomsExpanded] = useState(false);
  const [isKeysExpanded, setIsKeysExpanded] = useState(false);
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

        {/* Room assignments - Expandable */}
        <Collapsible open={isRoomsExpanded} onOpenChange={setIsRoomsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Room Assignments ({occupant.rooms?.length || 0})
                </span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isRoomsExpanded && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            {occupant.rooms && occupant.rooms.length > 0 ? (
              <div className="space-y-2 mt-2">
                {occupant.rooms.map((room, index) => {
                  const isPrimary = index === 0; // Assuming first room is primary
                  return (
                    <Card key={index} className={cn("p-3", isPrimary && "border-primary/20 bg-primary/5")}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          isPrimary ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {isPrimary ? <Crown className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{room.room_number || room.name}</span>
                            {isPrimary && <Badge variant="default" className="text-xs">Primary</Badge>}
                          </div>
                          {room.floors?.buildings?.name && (
                            <div className="text-xs text-muted-foreground">
                              {room.floors.buildings.name}
                              {room.floors?.name && ` • Floor ${room.floors.name}`}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Assigned: {new Date().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 border-2 border-dashed border-muted rounded-md mt-2">
                <span className="text-sm text-muted-foreground">No rooms assigned</span>
                {onAssignRooms && (
                  <Button variant="outline" size="sm" onClick={onAssignRooms}>
                    Assign Room
                  </Button>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Key assignments - Expandable */}
        <Collapsible open={isKeysExpanded} onOpenChange={setIsKeysExpanded} className="pt-2 border-t">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {occupant.key_count || 0} {occupant.key_count === 1 ? 'key' : 'keys'} assigned
                </span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", isKeysExpanded && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            <div className="mt-2">
              {occupant.key_count && occupant.key_count > 0 ? (
                <div className="space-y-2">
                  {/* Placeholder for key details - you'll need to add key data to the occupant type */}
                  {Array.from({ length: occupant.key_count }).map((_, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Key className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Key #{index + 1}</div>
                          <div className="text-xs text-muted-foreground">Standard access key</div>
                        </div>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border-2 border-dashed border-muted rounded-md">
                  <span className="text-sm text-muted-foreground">No keys assigned</span>
                  {onAssignKeys && (
                    <Button variant="outline" size="sm" onClick={onAssignKeys}>
                      Assign Key
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Quick actions */}
        {onClick && (
          <div className="pt-3 border-t">
            <Button variant="outline" size="sm" onClick={onClick} className="w-full">
              View Full Details
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}