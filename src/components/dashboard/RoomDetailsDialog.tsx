import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  Phone, 
  ShoppingBag, 
  CircleAlert, 
  Clipboard,
  Pencil,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { EditSpaceDialog } from "@/components/spaces/EditSpaceDialog";
import { RoomInventory } from "@/components/spaces/RoomInventory";
import { useRoomQuery } from "@/hooks/queries/useRoomQuery";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface RoomDetailsDialogProps {
  roomId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomDetailsDialog({ roomId, open, onOpenChange }: RoomDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Reset active tab when dialog opens/closes
  useEffect(() => {
    if (open) {
      setActiveTab("details");
    }
  }, [open]);

  // Fetch room details
  const { data: room, isLoading, error } = useRoomQuery(roomId || "", {
    enabled: !!roomId && open
  });

  // Handle dialog close
  const handleClose = () => {
    onOpenChange(false);
  };

  if (!roomId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between w-full">
              <div>
                <DialogTitle className="text-2xl">
                  {isLoading ? <Skeleton className="h-8 w-56" /> : room?.name}
                </DialogTitle>
                <DialogDescription>
                  {isLoading ? <Skeleton className="h-5 w-32 mt-1" /> : `Room ${room?.room_number}`}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {!isLoading && room?.is_storage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setActiveTab("inventory")}
                  >
                    <Clipboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Inventory</span>
                  </Button>
                )}
                {!isLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {!isLoading && room && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={
                  room.status === 'active' ? 'default' :
                  room.status === 'inactive' ? 'destructive' : 'outline'
                }>
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </Badge>
                
                <Badge variant="secondary">
                  {room.room_type.replace(/_/g, ' ')}
                </Badge>
                
                {room.is_storage && (
                  <Badge variant="secondary">
                    Storage
                  </Badge>
                )}
              </div>
            )}
          </DialogHeader>
          
          <Separator />
          
          {room?.is_storage && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="px-6 pt-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="h-[calc(90vh-11rem)]">
                {renderDetailsContent(room, isLoading, error)}
              </TabsContent>
              
              <TabsContent value="inventory" className="h-[calc(90vh-11rem)]">
                {room ? (
                  <div className="p-6 h-full">
                    <RoomInventory roomId={room.id} />
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    {error ? "Error loading room data" : "Loading..."}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) || (
            <div className="h-[calc(90vh-11rem)]">
              {renderDetailsContent(room, isLoading, error)}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      {isEditDialogOpen && room && (
        <EditSpaceDialog
          id={room.id}
          type="room"
          initialData={{
            id: room.id,
            name: room.name,
            roomNumber: room.room_number || '',
            roomType: room.room_type,
            description: room.description || '',
            status: room.status,
            floorId: room.floor_id,
            isStorage: room.is_storage || false,
            storageType: room.storage_type || null,
            storageCapacity: room.storage_capacity || null,
            storageNotes: room.storage_notes || null,
            parentRoomId: room.parent_room_id || null,
            currentFunction: room.current_function || null,
            phoneNumber: room.phone_number || null,
            // Only include courtroom_photos if it exists on the room object
            ...(('courtroom_photos' in room && room.courtroom_photos) ? { courtroom_photos: room.courtroom_photos } : {}),
            connections: (Array.isArray(room.space_connections) ? room.space_connections.map(conn => ({
              id: conn.id, 
              connectionType: conn.connection_type,
              toSpaceId: conn.to_space_id,
              direction: conn.direction || null
            })) : []),
            type: "room"
          }}
        />
      )}
    </>
  );
}

function renderDetailsContent(room: any, isLoading: boolean, error: any) {
  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        Error loading room data: {error.message}
      </div>
    );
  }
  
  if (isLoading || !room) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Description */}
        {room.description && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Description</h3>
            <p className="text-muted-foreground">{room.description}</p>
          </div>
        )}
        
        {/* Location */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Location
          </h3>
          <div className="text-muted-foreground">
            <p>{room.floor?.building?.name}</p>
            <p>Floor: {room.floor?.name}</p>
          </div>
        </div>
        
        {/* Occupants */}
        {room.current_occupants && room.current_occupants.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Occupants ({room.current_occupants.length})
            </h3>
            <div className="space-y-3">
              {room.current_occupants.map((occupant: any, index: number) => (
                <div key={index} className="p-3 bg-muted/50 rounded-md">
                  <div className="font-medium">
                    {occupant.first_name} {occupant.last_name}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="capitalize">
                      {occupant.assignment_type?.replace(/_/g, ' ')}
                      {occupant.is_primary && ' (Primary)'}
                    </span>
                    <span>
                      Since {format(new Date(occupant.assigned_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Contact */}
        {room.phone_number && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              Contact
            </h3>
            <p className="text-muted-foreground">{room.phone_number}</p>
          </div>
        )}
        
        {/* Storage Info */}
        {room.is_storage && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              Storage Information
            </h3>
            <div className="space-y-1 text-muted-foreground">
              {room.storage_type && (
                <p><span className="font-medium">Type:</span> {room.storage_type.replace(/_/g, ' ')}</p>
              )}
              {room.storage_capacity && (
                <p><span className="font-medium">Capacity:</span> {room.storage_capacity}</p>
              )}
              {room.storage_notes && (
                <p><span className="font-medium">Notes:</span> {room.storage_notes}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Issues */}
        {room.issues && room.issues.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <CircleAlert className="h-5 w-5 text-muted-foreground" />
              Recent Issues ({room.issues.length})
            </h3>
            <div className="space-y-3">
              {room.issues.map((issue: any, index: number) => (
                <div key={index} className="p-3 bg-muted/50 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant={
                      issue.status === 'open' ? 'default' :
                      issue.status === 'in_progress' ? 'secondary' :
                      issue.status === 'resolved' ? 'outline' : 'destructive'
                    }>
                      {issue.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(issue.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm">{issue.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
