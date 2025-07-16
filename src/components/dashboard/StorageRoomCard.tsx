import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Building2, Archive, Camera, AlertTriangle, Plus } from "lucide-react";
import { DetailedRoomAssignment } from "@/hooks/occupants/useOccupantAssignments";
import { useInventory } from "@/components/inventory/hooks/useInventory";
import { StorageInventoryModal } from "./StorageInventoryModal";

interface StorageRoomCardProps {
  storageAssignments: DetailedRoomAssignment[];
  onManageInventory?: (roomId: string) => void;
}

export function StorageRoomCard({
  storageAssignments,
  onManageInventory
}: StorageRoomCardProps) {
  const [selectedRoom, setSelectedRoom] = useState<DetailedRoomAssignment | null>(null);

  if (!storageAssignments.length) {
    return null;
  }

  const getStorageTypeIcon = (type?: string) => {
    switch (type) {
      case 'secure':
        return '🔒';
      case 'climate_controlled':
        return '🌡️';
      case 'general':
      default:
        return '📦';
    }
  };

  const getStorageTypeBadge = (type?: string) => {
    switch (type) {
      case 'secure':
        return 'Secure Storage';
      case 'climate_controlled':
        return 'Climate Controlled';
      case 'general':
        return 'General Storage';
      default:
        return 'Storage';
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            My Storage Rooms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {storageAssignments.map((room) => (
            <StorageRoomItem
              key={room.id}
              room={room}
              onManageInventory={() => setSelectedRoom(room)}
              typeIcon={getStorageTypeIcon(room.storage_type)}
              typeBadge={getStorageTypeBadge(room.storage_type)}
            />
          ))}
        </CardContent>
      </Card>
      
      {selectedRoom && (
        <StorageInventoryModal
          open={!!selectedRoom}
          onOpenChange={(open) => !open && setSelectedRoom(null)}
          roomId={selectedRoom.room_id}
          roomName={selectedRoom.room_name}
        />
      )}
    </>
  );
}

interface StorageRoomItemProps {
  room: DetailedRoomAssignment;
  onManageInventory?: (roomId: string) => void;
  typeIcon: string;
  typeBadge: string;
}

function StorageRoomItem({ 
  room, 
  onManageInventory, 
  typeIcon, 
  typeBadge 
}: StorageRoomItemProps) {
  const { items, isLoading } = useInventory({ roomId: room.room_id });
  
  const totalItems = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const lowStockItems = items?.filter(item => 
    item.minimum_quantity && item.quantity <= item.minimum_quantity
  ).length || 0;

  return (
    <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeIcon}</span>
          <div>
            <div className="font-medium text-sm flex items-center gap-2">
              {room.room_name}
              <Badge variant="outline" className="text-xs">
                {typeBadge}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 inline mr-1" />
              {room.building_name} • Room {room.room_number}
            </div>
          </div>
        </div>
        
        {room.storage_capacity && (
          <Badge variant="secondary" className="text-xs">
            Capacity: {room.storage_capacity}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-primary">
            {isLoading ? "..." : totalItems}
          </div>
          <div className="text-xs text-muted-foreground">Total Items</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-semibold ${
            lowStockItems > 0 ? "text-destructive" : "text-muted-foreground"
          }`}>
            {isLoading ? "..." : lowStockItems}
          </div>
          <div className="text-xs text-muted-foreground">Low Stock</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          size="sm" 
          onClick={() => onManageInventory?.(room.room_id)}
          className="flex-1"
        >
          <Archive className="h-3 w-3 mr-2" />
          Manage Inventory
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onManageInventory?.(room.room_id)}
          className="flex-1"
        >
          <Camera className="h-3 w-3 mr-2" />
          Add Photos
        </Button>
        {lowStockItems > 0 && (
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => onManageInventory?.(room.room_id)}
          >
            <AlertTriangle className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}