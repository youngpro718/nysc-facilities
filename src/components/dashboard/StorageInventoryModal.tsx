import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useInventory } from "@/components/inventory/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Package, Plus, Minus, Camera, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StorageInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomName: string;
}

export function StorageInventoryModal({
  open,
  onOpenChange,
  roomId,
  roomName,
}: StorageInventoryModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { items, isLoading, createItem, updateItem } = useInventory({ roomId });
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemQuantity.trim()) {
      toast({
        title: "Error",
        description: "Please enter both item name and quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      await createItem({
        name: newItemName,
        quantity: parseInt(newItemQuantity),
        storage_room_id: roomId,
      });
      setNewItemName("");
      setNewItemQuantity("");
      toast({
        title: "Success",
        description: "Item added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    try {
      await updateItem({ id: itemId, quantity: newQuantity });
      toast({
        title: "Success",
        description: "Quantity updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Storage Inventory - {roomName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Item */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add New Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <Label htmlFor="item-quantity">Quantity</Label>
                  <Input
                    id="item-quantity"
                    type="number"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading inventory...</span>
                </div>
              ) : items && items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                        {item.category && (
                          <Badge variant="outline" className="mt-1">
                            {item.category.name}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => 
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="text-lg font-semibold min-w-[3ch] text-center">
                          {item.quantity}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => 
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        
                        <Button size="sm" variant="ghost">
                          <Camera className="h-3 w-3" />
                        </Button>
                        
                        <Button size="sm" variant="ghost">
                          <History className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items in storage</p>
                  <p className="text-sm">Add your first item above</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}