import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  AlertTriangle,
  Archive,
  Calendar,
  Trash2,
  User,
  Users,
  X,
  Key,
} from "lucide-react";
import { EditSpaceDialog } from "../../EditSpaceDialog";
import { RoomCard } from "../RoomCard";
import { Room } from "../types/RoomTypes";
import React from "react";
import { useRoomAccess } from "@/hooks/useRoomAccess";

interface RoomDetailsPanelProps {
  room: Room | null;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const getStatusVariant = (status?: string) => {
  switch (status) {
    case "active":
      return "default" as const;
    case "inactive":
      return "secondary" as const;
    case "under_maintenance":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

export function RoomDetailsPanel({ room, onDelete, onClose }: RoomDetailsPanelProps) {
  const { data: accessInfo } = useRoomAccess(room?.id);

  if (!room) {
    return (
      <Card className="sticky top-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            Room Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Select a room from the list to view details.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-3">
              <span className="truncate" title={room.name}>{room.name}</span>
              <Badge variant={getStatusVariant(room.status)}>{room.status?.replace("_", " ")}</Badge>
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              Room #{room.room_number} • {room.room_type?.replace("_", " ")}
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual summary card (includes photos/stats) */}
        <div className="relative">
          <div className="rounded-xl p-[2px] bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30">
            <div className="rounded-[10px] bg-background">
              <RoomCard variant="panel" room={room} onDelete={onDelete} onRoomClick={() => {}} />
            </div>
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

        {/* Key Access Information */}
        {accessInfo && accessInfo.key_holders.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Key Access ({accessInfo.key_holders.length})
              </h4>
              <div className="space-y-2">
                {accessInfo.key_holders.slice(0, 5).map((holder, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                    <div className="flex flex-col">
                      <span className="font-medium">{holder.first_name} {holder.last_name}</span>
                      <span className="text-xs text-muted-foreground">{holder.key_name} {holder.is_passkey && '(Passkey)'}</span>
                    </div>
                    {holder.department && (
                      <Badge variant="outline" className="text-xs scale-90">
                        {holder.department}
                      </Badge>
                    )}
                  </div>
                ))}
                {accessInfo.key_holders.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    + {accessInfo.key_holders.length - 5} more key holders
                  </p>
                )}
              </div>
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
                    <span>{room.storage_type.replace("_", " ")}</span>
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
              <Button
                variant="outline"
                className="w-full mt-1"
                onClick={() => {
                  const event = new CustomEvent("openInventoryDialog", {
                    detail: { roomId: room.id, roomName: room.name },
                  });
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
        {room.issues && (room.issues as any[])?.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Current Issues ({(room.issues as any[]).length})
              </h4>
              <div className="space-y-2">
                {(room.issues as any[]).slice(0, 3).map((issue: any, index: number) => (
                  <div key={index} className="p-2 bg-muted rounded-md">
                    <p className="text-xs font-medium">{issue.title || issue.issue_type}</p>
                    {issue.description && (
                      <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
                    )}
                  </div>
                ))}
                {(room.issues as any[]).length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{(room.issues as any[]).length - 3} more issues
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Occupants */}
        {room.current_occupants && (room.current_occupants as any[])?.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Current Occupants ({(room.current_occupants as any[]).length})
              </h4>
              <div className="space-y-2">
                {(room.current_occupants as any[]).slice(0, 5).map((occupant: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{occupant.name || occupant.user_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {occupant.role || occupant.position}
                    </Badge>
                  </div>
                ))}
                {(room.current_occupants as any[]).length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{(room.current_occupants as any[]).length - 5} more occupants
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
              <span>{room.created_at ? formatDate(room.created_at as unknown as string) : "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated:</span>
              <span>{room.updated_at ? formatDate(room.updated_at as unknown as string) : "N/A"}</span>
            </div>
            {room.function_change_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Function Changed:</span>
                <span>{formatDate(room.function_change_date as unknown as string)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-4 space-y-2">
          <EditSpaceDialog
            id={room.id}
            type="room"
            initialData={{
              id: room.id,
              name: room.name,
              room_number: room.room_number || "",
              room_type: room.room_type,
              description: room.description || "",
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
              connections:
                room.space_connections?.map((conn: any) => ({
                  id: conn.id,
                  connectionType: conn.connection_type,
                  toSpaceId: conn.to_space_id,
                  direction: conn.direction || null,
                })) || [],
              type: "room",
            }}
            variant="custom"
          >
            <Button className="w-full" size="lg">
              <User className="h-4 w-4 mr-2" />
              Edit Room
            </Button>
          </EditSpaceDialog>
          <Button
            variant="destructive"
            className="w-full"
            size="lg"
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to delete this room? This action cannot be undone."
                )
              ) {
                onDelete(room.id);
                onClose?.();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Room
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
