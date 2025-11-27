import React, { useState, useMemo } from "react";
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
import { Loader2, Package, Plus, Minus, Camera, History, ImageIcon, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ItemPhotoUpload } from "@/components/inventory/ItemPhotoUpload";
import { ItemHistoryModal } from "@/components/inventory/ItemHistoryModal";
import { StockStatusBadge } from "@/components/inventory/StockStatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  
  // Pagination and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<"name" | "quantity">("name");
  
  // Filter and paginate items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    let filtered = items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.quantity - a.quantity; // Descending for quantity
    });
    return filtered;
  }, [items, searchQuery, sortBy]);
  
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);
  
  // Reset page when search changes
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery]);

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
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base">Current Inventory</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "quantity")}>
                    <SelectTrigger className="w-28 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="quantity">Quantity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {filteredItems.length > 0 && (
                <div className="text-sm text-muted-foreground mt-2">
                  Showing {Math.min((page - 1) * pageSize + 1, filteredItems.length)}–{Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length} items
                </div>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading inventory...</span>
                </div>
              ) : paginatedItems.length > 0 ? (
                <div className="space-y-3">
                  {paginatedItems.map((item) => (
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
                            <StockStatusBadge 
                              quantity={item.quantity} 
                              minimumQuantity={item.minimum_quantity || 0}
                              size="sm"
                            />
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
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Show:</span>
                        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                          Page {page} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page >= totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {searchQuery ? (
                    <>
                      <p>No items match "{searchQuery}"</p>
                      <p className="text-sm">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <p>No items in storage</p>
                      <p className="text-sm">Add your first item above</p>
                    </>
                  )}
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