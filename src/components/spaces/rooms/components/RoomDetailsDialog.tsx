import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { ModalFrame } from "@/components/common/ModalFrame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Calendar, 
  User, 
  Archive,
  Info,
  Edit,
  Trash2,
  Users,
  AlertTriangle
} from "lucide-react";
import { Room } from "../types/RoomTypes";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { StatusEnum } from "../types/roomEnums";

interface RoomDetailsDialogProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function RoomDetailsDialog({ 
  room, 
  isOpen, 
  onClose, 
  onDelete 
}: RoomDetailsDialogProps) {
  if (!room) return null;

  const initialData = {
    id: room.id,
    name: room.name,
    status: room.status as StatusEnum,
    floorId: room.floor_id,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'under_maintenance':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <ModalFrame
        title={
          <div className="flex items-center justify-between pr-2">
            <span className="text-lg font-semibold truncate">{room.name}</span>
            <Badge variant={getStatusVariant(room.status)}>
              {room.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        }
        description={
          <span>
            Room #{room.room_number} • {room.room_type.replace('_', ' ')}
          </span>
        }
        size="md"
      >
        <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Building:</span>
                  <span>{room.floor?.building?.name || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Floor:</span>
                  <span>{room.floor?.name || "N/A"}</span>
                </div>
                {room.phone_number && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{room.phone_number}</span>
                  </div>
                )}
                {room.current_function && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Function:</span>
                    <span>{room.current_function}</span>
                  </div>
                )}
              </div>
            </div>

            {room.description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">{room.description}</p>
                </div>
              </>
            )}

            {/* Storage Information */}
            {room.is_storage && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Storage Details
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {room.storage_type && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{room.storage_type.replace('_', ' ')}</span>
                      </div>
                    )}
                    {room.storage_capacity && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span>{room.storage_capacity}</span>
                      </div>
                    )}
                    {room.storage_notes && (
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="text-xs text-muted-foreground">{room.storage_notes}</p>
                      </div>
                    )}
                  </div>
                  {/* Mobile-friendly Inventory Button */}
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => {
                      const event = new CustomEvent('openInventoryDialog', { detail: { roomId: room.id, roomName: room.name } });
                      window.dispatchEvent(event);
                    }}
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    View Inventory
                  </Button>
                </div>
              </>
            )}

            {/* Issues */}
            {room.issues && room.issues.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Current Issues ({room.issues.length})
                  </h4>
                  <div className="space-y-2">
                    {room.issues.slice(0, 3).map((issue: any, index: number) => (
                      <div key={index} className="p-2 bg-muted rounded-md">
                        <p className="text-xs font-medium">{issue.title || issue.issue_type}</p>
                        {issue.description && (
                          <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                        )}
                      </div>
                    ))}
                    {room.issues.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{room.issues.length - 3} more issues
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Occupants */}
            {room.current_occupants && room.current_occupants.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Current Occupants ({room.current_occupants.length})
                  </h4>
                  <div className="space-y-2">
                    {room.current_occupants.slice(0, 5).map((occupant: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{occupant.name || occupant.user_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {occupant.role || occupant.position}
                        </Badge>
                      </div>
                    ))}
                    {room.current_occupants.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{room.current_occupants.length - 5} more occupants
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Timestamps */}
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(room.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{formatDate(room.updated_at)}</span>
                </div>
                {room.function_change_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Function Changed:</span>
                    <span>{formatDate(room.function_change_date)}</span>
                  </div>
                )}
              </div>
            </div>

        {/* Issues */}
        {room.issues && room.issues.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Current Issues ({room.issues.length})
              </h4>
              <div className="space-y-2">
                {room.issues.slice(0, 3).map((issue: any, index: number) => (
                  <div key={index} className="p-2 bg-muted rounded-md">
                    <p className="text-xs font-medium">{issue.title || issue.issue_type}</p>
                    {issue.description && (
                      <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                    )}
                  </div>
                ))}
                {room.issues.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{room.issues.length - 3} more issues
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Occupants */}
        {room.current_occupants && room.current_occupants.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Current Occupants ({room.current_occupants.length})
              </h4>
              <div className="space-y-2">
                {room.current_occupants.slice(0, 5).map((occupant: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{occupant.name || occupant.user_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {occupant.role || occupant.position}
                    </Badge>
                  </div>
                ))}
                {room.current_occupants.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{room.current_occupants.length - 5} more occupants
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Timestamps */}
        <Separator />
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{formatDate(room.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated:</span>
              <span>{formatDate(room.updated_at)}</span>
            </div>
            {room.function_change_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Function Changed:</span>
                <span>{formatDate(room.function_change_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="border-t pt-4 space-y-2">
        <EditSpaceDialog
          id={room.id}
          type="room"
          initialData={{
            id: room.id,
            name: room.name,
            room_number: room.room_number || '',
            room_type: room.room_type,
            description: room.description || '',
            status: room.status,
            floor_id: room.floor_id,
            is_storage: room.is_storage || false,
            storage_type: room.storage_type || null,
            storage_capacity: room.storage_capacity || null,
            storage_notes: room.storage_notes || null,
            parent_room_id: room.parent_room_id || null,
            current_function: room.current_function || null,
            phone_number: room.phone_number || null,
            courtroom_photos: room.courtroom_photos || null,
            connections: room.space_connections?.map(conn => ({
              id: conn.id,
              connectionType: conn.connection_type,
              toSpaceId: conn.to_space_id,
              direction: conn.direction || null
            })) || [],
            type: "room"
          }}
          variant="custom"
        >
          <Button className="w-full" size="lg">
            <Edit className="h-4 w-4 mr-2" />
            Edit Room
          </Button>
        </EditSpaceDialog>
        <Button
          variant="destructive"
          className="w-full"
          size="lg"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
              onDelete(room.id);
              onClose();
            }
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Room
        </Button>
      </div>
    </ModalFrame>
  </Dialog>
);
}