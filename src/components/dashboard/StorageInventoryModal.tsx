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
import { Loader2, Package, Plus, Minus, Camera, History, ImageIcon, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ItemPhotoUpload } from "@/components/inventory/ItemPhotoUpload";
import { ItemHistoryModal } from "@/components/inventory/ItemHistoryModal";

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
  const [selectedPhotoItem, setSelectedPhotoItem] = useState<any>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [photoPreviewItem, setPhotoPreviewItem] = useState<any>(null);

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
                      <div className="flex items-center gap-3">
                        {/* Photo thumbnail */}
                        {item.photo_url ? (
                          <div 
                            className="w-12 h-12 rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setPhotoPreviewItem(item)}
                          >
                            <img
                              src={item.photo_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/50">
                            <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">
                              {item.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {item.category && (
                              <Badge variant="outline" className="text-xs">
                                {item.category.name}
                              </Badge>
                            )}
                            {item.photo_url && (
                              <Badge variant="secondary" className="text-xs">
                                Has Photo
                              </Badge>
                            )}
                            {item.minimum_quantity && item.quantity < item.minimum_quantity && (
                              <Badge variant="destructive" className="text-xs">
                                Low Stock
                              </Badge>
                            )}
                          </div>
                        </div>
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
                        
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setSelectedPhotoItem(item)}
                          title="Manage photo"
                        >
                          <Camera className="h-3 w-3" />
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setSelectedHistoryItem(item)}
                          title="View history"
                        >
                          <History className="h-3 w-3" />
                        </Button>
                        
                        {item.photo_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPhotoPreviewItem(item)}
                            title="View photo"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
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

        {/* Photo Upload Modal */}
        {selectedPhotoItem && (
          <ItemPhotoUpload
            open={!!selectedPhotoItem}
            onOpenChange={(open) => !open && setSelectedPhotoItem(null)}
            itemId={selectedPhotoItem.id}
            itemName={selectedPhotoItem.name}
            currentPhotoUrl={selectedPhotoItem.photo_url}
            onPhotoUploaded={(url) => {
              // This will trigger a re-fetch of inventory data
              // The useInventory hook should handle this automatically
            }}
          />
        )}

        {/* History Modal */}
        {selectedHistoryItem && (
          <ItemHistoryModal
            open={!!selectedHistoryItem}
            onOpenChange={(open) => !open && setSelectedHistoryItem(null)}
            itemId={selectedHistoryItem.id}
            itemName={selectedHistoryItem.name}
          />
        )}

        {/* Photo Preview Modal */}
        {photoPreviewItem && (
          <Dialog open={!!photoPreviewItem} onOpenChange={(open) => !open && setPhotoPreviewItem(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{photoPreviewItem.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={photoPreviewItem.photo_url}
                  alt={photoPreviewItem.name}
                  className="w-full h-auto max-h-[60vh] object-contain rounded-lg border"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPhotoItem(photoPreviewItem)}
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Manage Photo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPhotoPreviewItem(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}