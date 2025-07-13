import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Plus, Minus, Package2 } from "lucide-react";
import { InventoryItem } from "../types/inventoryTypes";

interface MobileInventoryGridProps {
  items: InventoryItem[];
  isLoading: boolean;
  isUpdatingQuantity: boolean;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export function MobileInventoryGrid({
  items,
  isLoading,
  isUpdatingQuantity,
  onUpdateQuantity,
  onEditItem,
  onDeleteItem
}: MobileInventoryGridProps) {
  const handleQuantityChange = (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity >= 0) {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-24 animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">No items found</p>
        <p className="text-sm text-muted-foreground">Add your first inventory item to get started</p>
      </div>
    );
  }

  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="grid gap-3">
      {sortedItems.map(item => (
        <Card key={item.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-base leading-tight truncate pr-2">
                    {item.name}
                  </h4>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditItem(item)}>
                        Edit Item
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this item?')) {
                            onDeleteItem(item.id);
                          }
                        }}
                      >
                        Delete Item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {item.category && (
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{
                        backgroundColor: `${item.category.color}20`,
                        borderColor: item.category.color
                      }}
                    >
                      {item.category.name}
                    </Badge>
                  )}
                  <Badge 
                    variant={item.quantity <= (item.minimum_quantity || 0) ? "destructive" : "default"}
                    className="text-xs"
                  >
                    {item.quantity <= (item.minimum_quantity || 0) ? "Low Stock" : "In Stock"}
                  </Badge>
                </div>

                {item.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                      disabled={item.quantity <= 0 || isUpdatingQuantity}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="font-mono text-lg font-medium min-w-[3rem] text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                      disabled={isUpdatingQuantity}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {item.unit && (
                    <span className="text-sm text-muted-foreground">{item.unit}</span>
                  )}
                </div>

                {item.minimum_quantity && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Min: {item.minimum_quantity}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}