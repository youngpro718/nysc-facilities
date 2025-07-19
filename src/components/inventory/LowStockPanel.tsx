
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, TrendingDown, Plus } from "lucide-react";

type LowStockItem = {
  id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  unit: string;
  location_details: string;
  preferred_vendor: string;
  category_name: string;
  category_color: string;
  room_name: string;
  room_number: string;
  storage_room_id: string;
};

export const LowStockPanel = () => {
  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ["low-stock-items"],
    queryFn: async (): Promise<LowStockItem[]> => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(`
          *,
          inventory_categories(name, color)
        `)
        .not("minimum_quantity", "is", null)
        .lt("quantity", "minimum_quantity")
        .order("quantity", { ascending: true });

      if (error) throw error;

      // Get room data separately for items that have storage_room_id
      const itemsWithRooms = await Promise.all(
        (data || []).map(async (item) => {
          let roomData = { name: "", room_number: "" };
          
          if (item.storage_room_id) {
            const { data: room } = await supabase
              .from("rooms")
              .select("name, room_number")
              .eq("id", item.storage_room_id)
              .single();
            
            if (room) {
              roomData = { name: room.name || "", room_number: room.room_number || "" };
            }
          }

          return {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            minimum_quantity: item.minimum_quantity || 0,
            unit: item.unit || '',
            location_details: item.location_details || '',
            preferred_vendor: item.preferred_vendor || '',
            category_name: item.inventory_categories?.name || "Uncategorized",
            category_color: item.inventory_categories?.color || "gray",
            room_name: roomData.name,
            room_number: roomData.room_number,
            storage_room_id: item.storage_room_id,
          };
        })
      );

      return itemsWithRooms;
    },
  });

  const { data: outOfStockItems } = useQuery({
    queryKey: ["out-of-stock-items"],
    queryFn: async (): Promise<LowStockItem[]> => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(`
          *,
          inventory_categories(name, color)
        `)
        .eq("quantity", 0)
        .order("name");

      if (error) throw error;

      // Get room data separately for items that have storage_room_id
      const itemsWithRooms = await Promise.all(
        (data || []).map(async (item) => {
          let roomData = { name: "", room_number: "" };
          
          if (item.storage_room_id) {
            const { data: room } = await supabase
              .from("rooms")
              .select("name, room_number")
              .eq("id", item.storage_room_id)
              .single();
            
            if (room) {
              roomData = { name: room.name || "", room_number: room.room_number || "" };
            }
          }

          return {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            minimum_quantity: item.minimum_quantity || 0,
            unit: item.unit || '',
            location_details: item.location_details || '',
            preferred_vendor: item.preferred_vendor || '',
            category_name: item.inventory_categories?.name || "Uncategorized",
            category_color: item.inventory_categories?.color || "gray",
            room_name: roomData.name,
            room_number: roomData.room_number,
            storage_room_id: item.storage_room_id,
          };
        })
      );

      return itemsWithRooms;
    },
  });

  const getStockLevel = (quantity: number, minimum: number) => {
    if (quantity === 0) return { level: "critical", label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (quantity < minimum * 0.5) return { level: "critical", label: "Critical", color: "bg-red-100 text-red-800" };
    if (quantity < minimum) return { level: "low", label: "Low Stock", color: "bg-orange-100 text-orange-800" };
    return { level: "normal", label: "Normal", color: "bg-green-100 text-green-800" };
  };

  const getCategoryColor = (color: string) => {
    const colorMap: Record<string, string> = {
      red: "bg-red-100 text-red-800",
      blue: "bg-blue-100 text-blue-800",
      green: "bg-green-100 text-green-800",
      orange: "bg-orange-100 text-orange-800",
      purple: "bg-purple-100 text-purple-800",
      yellow: "bg-yellow-100 text-yellow-800",
      pink: "bg-pink-100 text-pink-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return colorMap[color] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading low stock items...</div>;
  }

  const criticalItems = lowStockItems?.filter(item => getStockLevel(item.quantity, item.minimum_quantity).level === "critical") || [];
  const lowItems = lowStockItems?.filter(item => getStockLevel(item.quantity, item.minimum_quantity).level === "low") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Low Stock Management</h2>
          <p className="text-muted-foreground">Monitor and manage items that need restocking</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{criticalItems.length}</div>
            <p className="text-xs text-muted-foreground">Very low levels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <Package className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowItems.length}</div>
            <p className="text-xs text-muted-foreground">Need restocking soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Out of Stock Items */}
      {outOfStockItems && outOfStockItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Out of Stock Items
          </h3>
          <div className="grid gap-4">
            {outOfStockItems.map((item) => (
              <Card key={item.id} className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{item.name}</h4>
                        <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>
                        <Badge className={getCategoryColor(item.category_color)}>
                          {item.category_name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Current: {item.quantity} {item.unit}</span>
                        <span>Required: {item.minimum_quantity} {item.unit}</span>
                        {item.room_name && (
                          <span>Location: {item.room_name} ({item.room_number})</span>
                        )}
                      </div>
                      {item.preferred_vendor && (
                        <p className="text-sm text-muted-foreground">
                          Vendor: {item.preferred_vendor}
                        </p>
                      )}
                    </div>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Restock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Items */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-600" />
            Low Stock Items
          </h3>
          <div className="grid gap-4">
            {lowStockItems.map((item) => {
              const stockLevel = getStockLevel(item.quantity, item.minimum_quantity);
              return (
                <Card key={item.id} className={stockLevel.level === "critical" ? "border-red-200" : "border-orange-200"}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{item.name}</h4>
                          <Badge className={stockLevel.color}>
                            {stockLevel.label}
                          </Badge>
                          <Badge className={getCategoryColor(item.category_color)}>
                            {item.category_name}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Current: {item.quantity} {item.unit}</span>
                          <span>Minimum: {item.minimum_quantity} {item.unit}</span>
                          <span>Need: {Math.max(0, item.minimum_quantity - item.quantity)} {item.unit}</span>
                          {item.room_name && (
                            <span>Location: {item.room_name} ({item.room_number})</span>
                          )}
                        </div>
                        {item.preferred_vendor && (
                          <p className="text-sm text-muted-foreground">
                            Vendor: {item.preferred_vendor}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Stock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* No Low Stock Items */}
      {(!lowStockItems || lowStockItems.length === 0) && (!outOfStockItems || outOfStockItems.length === 0) && (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-green-600 opacity-50" />
          <h3 className="text-lg font-semibold mb-2 text-green-800">All Items Well Stocked!</h3>
          <p className="text-muted-foreground">
            No items are currently below their minimum stock levels.
          </p>
        </Card>
      )}
    </div>
  );
};
