import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  MapPin, 
  TrendingDown, 
  Search,
  Box,
  AlertTriangle,
  Loader2,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  outOfStockItems: number;
  totalQuantity: number;
  capacityPercent: number;
};

type ViewMode = 'grid' | 'list';

export const StorageRoomsPanel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  const { data: storageRooms, isLoading: roomsLoading } = useQuery<StorageRoom[]>({
    queryKey: ["storage-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id, name, room_number, storage_type, storage_capacity, floor_id,
          floors!rooms_floor_id_fkey (
            name,
            buildings!floors_building_id_fkey ( name )
          )
        `)
        .eq("is_storage", true)
        .order("room_number");
      
      if (error) throw error;
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

  const { data: inventoryItems, isLoading: itemsLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventory-items-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(`
          id, name, quantity, minimum_quantity, unit, status,
          location_details, category_id, storage_room_id,
          inventory_categories ( name, color )
        `)
        .order("name");
      
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        inventory_categories: Array.isArray(item.inventory_categories) && item.inventory_categories.length > 0
          ? item.inventory_categories[0]
          : null
      })) as InventoryItem[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const storageRoomsWithItems: StorageRoomWithItems[] = (storageRooms || []).map(room => {
    const roomItems = (inventoryItems || []).filter(item => item.storage_room_id === room.id);
    const lowStockItems = roomItems.filter(item => item.quantity > 0 && item.minimum_quantity > 0 && item.quantity < item.minimum_quantity);
    const outOfStockItems = roomItems.filter(item => item.quantity === 0);
    const totalQuantity = roomItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Capacity: use storage_capacity if set, otherwise estimate from item count
    const capacity = room.storage_capacity || Math.max(roomItems.length * 1.5, 20);
    const capacityPercent = Math.min(100, Math.round((roomItems.length / capacity) * 100));

    return {
      ...room,
      items: roomItems,
      totalItems: roomItems.length,
      lowStockItems: lowStockItems.length,
      outOfStockItems: outOfStockItems.length,
      totalQuantity,
      capacityPercent,
    };
  });

  const filteredRooms = storageRoomsWithItems.filter(room => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      room.name.toLowerCase().includes(query) ||
      room.room_number.toLowerCase().includes(query) ||
      room.items.some(item => item.name.toLowerCase().includes(query))
    );
  });

  const totalStorageRooms = storageRoomsWithItems.length;
  const totalItemsAcrossRooms = storageRoomsWithItems.reduce((sum, room) => sum + room.totalItems, 0);
  const totalLowStockItems = storageRoomsWithItems.reduce((sum, room) => sum + room.lowStockItems, 0);
  const totalOutOfStock = storageRoomsWithItems.reduce((sum, room) => sum + room.outOfStockItems, 0);

  const isLoading = roomsLoading || itemsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getCapacityColor = (percent: number) => {
    if (percent >= 90) return 'text-destructive';
    if (percent >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getCapacityBarClass = (percent: number) => {
    if (percent >= 90) return '[&>div]:bg-destructive';
    if (percent >= 70) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-green-500';
  };

  const getHealthBadge = (room: StorageRoomWithItems) => {
    if (room.outOfStockItems > 0) {
      return <Badge variant="destructive" className="text-xs">{room.outOfStockItems} out</Badge>;
    }
    if (room.lowStockItems > 0) {
      return (
        <Badge className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700">
          {room.lowStockItems} low
        </Badge>
      );
    }
    return <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">Healthy</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:overflow-visible">
        <Card className="shrink-0 w-[200px] snap-start sm:w-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rooms</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStorageRooms}</div>
            <p className="text-xs text-muted-foreground">Active locations</p>
          </CardContent>
        </Card>

        <Card className="shrink-0 w-[200px] snap-start sm:w-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItemsAcrossRooms}</div>
            <p className="text-xs text-muted-foreground">Unique items stored</p>
          </CardContent>
        </Card>

        <Card className="shrink-0 w-[200px] snap-start sm:w-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totalLowStockItems > 0 && "text-amber-600 dark:text-amber-400")}>{totalLowStockItems}</div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>

        <Card className="shrink-0 w-[200px] snap-start sm:w-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", totalOutOfStock > 0 && "text-destructive")}>{totalOutOfStock}</div>
            <p className="text-xs text-muted-foreground">Immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + View Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms or items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Storage Rooms */}
      {filteredRooms.length === 0 ? (
        <Card className="p-8 text-center">
          <Box className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No storage rooms found</p>
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid View - Room Cards with capacity meters */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRooms.map((room) => {
            const isExpanded = expandedRoom === room.id;
            return (
              <Card 
                key={room.id} 
                className={cn(
                  "transition-all cursor-pointer hover:shadow-md",
                  room.outOfStockItems > 0 && "border-destructive/30",
                  room.lowStockItems > 0 && room.outOfStockItems === 0 && "border-amber-400/30"
                )}
                onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{room.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Room {room.room_number}
                          {room.floors?.name && ` • ${room.floors.name}`}
                        </p>
                      </div>
                    </div>
                    {getHealthBadge(room)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Capacity Meter */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className={cn("font-medium", getCapacityColor(room.capacityPercent))}>
                        {room.capacityPercent}%
                      </span>
                    </div>
                    <Progress 
                      value={room.capacityPercent} 
                      className={cn("h-2", getCapacityBarClass(room.capacityPercent))} 
                    />
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-md p-2">
                      <div className="text-lg font-bold">{room.totalItems}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">Items</div>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                      <div className={cn("text-lg font-bold", room.lowStockItems > 0 && "text-amber-600 dark:text-amber-400")}>
                        {room.lowStockItems}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight">Low</div>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                      <div className={cn("text-lg font-bold", room.outOfStockItems > 0 && "text-destructive")}>
                        {room.outOfStockItems}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight">Out</div>
                    </div>
                  </div>

                  {/* Expanded Item List */}
                  {isExpanded && (
                    <div className="border-t pt-3 space-y-1.5 max-h-[300px] overflow-y-auto">
                      {room.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No items</p>
                      ) : (
                        room.items.map((item) => {
                          const isLow = item.minimum_quantity > 0 && item.quantity > 0 && item.quantity < item.minimum_quantity;
                          const isOut = item.quantity === 0;
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-md text-sm",
                                isOut ? "bg-destructive/5" : isLow ? "bg-amber-500/5" : "bg-muted/30"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full shrink-0",
                                  isOut ? "bg-destructive" : isLow ? "bg-amber-500" : "bg-green-500"
                                )} />
                                <span className="truncate">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                {item.location_details && (
                                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {item.location_details}
                                  </span>
                                )}
                                <span className={cn(
                                  "font-medium tabular-nums",
                                  isOut ? "text-destructive" : isLow ? "text-amber-600 dark:text-amber-400" : ""
                                )}>
                                  {item.quantity}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* Expand hint */}
                  <div className="flex justify-center">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View - Compact rows */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredRooms.map((room) => {
                const isExpanded = expandedRoom === room.id;
                return (
                  <div key={room.id}>
                    <button
                      className="w-full flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors text-left"
                      onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{room.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Room {room.room_number}
                          {room.floors?.buildings?.name && ` • ${room.floors.buildings.name}`}
                        </div>
                      </div>
                      {/* Capacity bar inline */}
                      <div className="w-24 hidden sm:block">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-muted-foreground">Cap.</span>
                          <span className={getCapacityColor(room.capacityPercent)}>{room.capacityPercent}%</span>
                        </div>
                        <Progress value={room.capacityPercent} className={cn("h-1.5", getCapacityBarClass(room.capacityPercent))} />
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-medium">{room.totalItems} items</div>
                        {getHealthBadge(room)}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-1.5 max-h-[300px] overflow-y-auto border-t bg-muted/20">
                        {room.items.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">No items in this room</p>
                        ) : (
                          room.items.map((item) => {
                            const isLow = item.minimum_quantity > 0 && item.quantity > 0 && item.quantity < item.minimum_quantity;
                            const isOut = item.quantity === 0;
                            const stockPercent = item.minimum_quantity > 0 
                              ? Math.min(100, Math.round((item.quantity / item.minimum_quantity) * 100))
                              : 100;
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  "flex items-center gap-3 p-2.5 rounded-md text-sm mt-1.5",
                                  isOut ? "bg-destructive/5 border border-destructive/20" : isLow ? "bg-amber-500/5 border border-amber-400/20" : "bg-card border"
                                )}
                              >
                                <Package className={cn(
                                  "h-4 w-4 shrink-0",
                                  isOut ? "text-destructive" : isLow ? "text-amber-500" : "text-muted-foreground"
                                )} />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{item.name}</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {item.location_details && (
                                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                        {item.location_details}
                                      </span>
                                    )}
                                    {item.inventory_categories && (
                                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                        <span 
                                          className="inline-block h-1.5 w-1.5 rounded-full mr-1" 
                                          style={{ backgroundColor: item.inventory_categories.color }} 
                                        />
                                        {item.inventory_categories.name}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {/* Stock level bar */}
                                <div className="w-16 hidden sm:block">
                                  <Progress 
                                    value={stockPercent} 
                                    className={cn(
                                      "h-1.5",
                                      isOut ? "[&>div]:bg-destructive" : isLow ? "[&>div]:bg-amber-500" : "[&>div]:bg-green-500"
                                    )} 
                                  />
                                </div>
                                <div className="text-right shrink-0 min-w-[60px]">
                                  <div className={cn(
                                    "font-semibold tabular-nums",
                                    isOut ? "text-destructive" : isLow ? "text-amber-600 dark:text-amber-400" : ""
                                  )}>
                                    {item.quantity} {item.unit}
                                  </div>
                                  {item.minimum_quantity > 0 && (
                                    <div className="text-[10px] text-muted-foreground">
                                      min: {item.minimum_quantity}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
