import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  MapPin, 
  TrendingDown, 
  Search,
  ChevronRight,
  Box,
  AlertTriangle
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type StorageRoom = {
  id: string;
  name: string;
  room_number: string;
  storage_type: string | null;
  storage_capacity: number | null;
  floor_id: string;
  floors?: {
    name: string;
    buildings?: {
      name: string;
    };
  } | null;
};

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  unit: string;
  status: string;
  location_details: string | null;
  category_id: string;
  storage_room_id?: string | null;
  inventory_categories?: {
    name: string;
    color: string;
  } | null;
};

type StorageRoomWithItems = StorageRoom & {
  items: InventoryItem[];
  totalItems: number;
  lowStockItems: number;
  totalQuantity: number;
};

export const StorageRoomsPanel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  // Fetch storage rooms
  const { data: storageRooms, isLoading: roomsLoading } = useQuery<StorageRoom[]>({
    queryKey: ["storage-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id,
          name,
          room_number,
          storage_type,
          storage_capacity,
          floor_id,
          floors!rooms_floor_id_fkey (
            name,
            buildings!floors_building_id_fkey (
              name
            )
          )
        `)
        .eq("is_storage", true)
        .order("room_number");
      
      if (error) throw error;
      // Transform the nested array structure from Supabase to our type
      return (data || []).map(room => ({
        ...room,
        floors: Array.isArray(room.floors) && room.floors.length > 0 
          ? {
              name: room.floors[0].name,
              buildings: Array.isArray(room.floors[0].buildings) && room.floors[0].buildings.length > 0
                ? { name: room.floors[0].buildings[0].name }
                : undefined
            }
          : null
      })) as StorageRoom[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch all inventory items
  const { data: inventoryItems, isLoading: itemsLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventory-items-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(`
          id,
          name,
          quantity,
          minimum_quantity,
          unit,
          status,
          location_details,
          category_id,
          storage_room_id,
          inventory_categories (
            name,
            color
          )
        `)
        .order("name");
      
      if (error) throw error;
      // Transform the nested array structure from Supabase to our type
      return (data || []).map(item => ({
        ...item,
        inventory_categories: Array.isArray(item.inventory_categories) && item.inventory_categories.length > 0
          ? item.inventory_categories[0]
          : null
      })) as InventoryItem[];
    },
    staleTime: 2 * 60 * 1000,
  });

  // Combine storage rooms with their items
  const storageRoomsWithItems: StorageRoomWithItems[] = (storageRooms || []).map(room => {
    const roomItems = (inventoryItems || []).filter(item => item.storage_room_id === room.id);
    // Low stock if quantity is below minimum
    const lowStockItems = roomItems.filter(item => item.quantity > 0 && item.minimum_quantity > 0 && item.quantity < item.minimum_quantity);
    const totalQuantity = roomItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      ...room,
      items: roomItems,
      totalItems: roomItems.length,
      lowStockItems: lowStockItems.length,
      totalQuantity,
    };
  });

  // Filter by search query
  const filteredRooms = storageRoomsWithItems.filter(room => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      room.name.toLowerCase().includes(query) ||
      room.room_number.toLowerCase().includes(query) ||
      room.items.some(item => item.name.toLowerCase().includes(query))
    );
  });

  // Calculate summary stats
  const totalStorageRooms = storageRoomsWithItems.length;
  const totalItemsAcrossRooms = storageRoomsWithItems.reduce((sum, room) => sum + room.totalItems, 0);
  const totalLowStockItems = storageRoomsWithItems.reduce((sum, room) => sum + room.lowStockItems, 0);
  const roomsWithLowStock = storageRoomsWithItems.filter(room => room.lowStockItems > 0).length;

  const isLoading = roomsLoading || itemsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Rooms</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStorageRooms}</div>
            <p className="text-xs text-muted-foreground">Active storage locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItemsAcrossRooms}</div>
            <p className="text-xs text-muted-foreground">Unique items stored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalLowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items need reordering</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms w/ Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{roomsWithLowStock}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search storage rooms or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Storage Rooms List */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Rooms & Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No storage rooms found</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredRooms.map((room) => (
                <AccordionItem key={room.id} value={room.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">{room.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Room {room.room_number}
                            {room.floors?.buildings?.name && ` • ${room.floors.buildings.name}`}
                            {room.floors?.name && ` • ${room.floors.name}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{room.totalItems} items</div>
                          {room.lowStockItems > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {room.lowStockItems} low stock
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 space-y-2">
                      {room.items.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No items in this storage room</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {room.items.map((item) => {
                            const isLowStock = item.quantity < item.minimum_quantity;
                            return (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                  isLowStock 
                                    ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10' 
                                    : 'bg-card border-border hover:bg-accent/50'
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className={`p-2 rounded-md ${isLowStock ? 'bg-destructive/10' : 'bg-muted'}`}>
                                    <Package className={`h-4 w-4 ${isLowStock ? 'text-destructive' : 'text-muted-foreground'}`} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-foreground">{item.name}</div>
                                    {item.location_details && (
                                      <div className="text-xs text-muted-foreground">
                                        {item.location_details}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  {item.inventory_categories && (
                                    <Badge variant="secondary" className="font-normal">
                                      {item.inventory_categories.name}
                                    </Badge>
                                  )}
                                  <div className="text-right min-w-[80px]">
                                    <div className={`font-semibold ${isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                                      {item.quantity} {item.unit}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Min: {item.minimum_quantity}
                                    </div>
                                  </div>
                                  {isLowStock && (
                                    <Badge variant="destructive" className="ml-2 shrink-0">
                                      <TrendingDown className="h-3 w-3 mr-1" />
                                      Low
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
