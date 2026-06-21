import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QUERY_CONFIG } from '@/config';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@shared/hooks/use-toast";
import { FormButtons } from "@/components/ui/form-buttons";
import { getErrorMessage } from "@/lib/errorUtils";
import { invalidateInventoryStockQueries } from "@features/inventory/utils/invalidation";
import { describePackaging, buildPackagingNote, pluralize } from "@features/inventory/utils/packaging";

type InventoryItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  minimum_quantity: number;
  unit: string;
  pack_size: number | null;
  packaging_note: string | null;
  pack_label: string | null;
  case_label: string | null;
  case_size: number | null;
  order_code_threshold: number | null;
  status: string;
  location_details: string;
  preferred_vendor: string;
  sku: string | null;
  notes: string;
  category_id: string;
  storage_room_id: string;
};

type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
};

type StorageRoom = {
  id: string;
  name: string;
  room_number: string;
};

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem;
}

export const EditItemDialog = ({ open, onOpenChange, item }: EditItemDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    minimum_quantity: "",
    unit: "",
    pack_size: "",
    pack_label: "",
    case_label: "",
    case_size: "",
    order_code_threshold: "",
    category_id: "",
    storage_room_id: "",
    location_details: "",
    preferred_vendor: "",
    vendor_sku: "",
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        quantity: item.quantity?.toString() || "",
        minimum_quantity: item.minimum_quantity?.toString() || "",
        unit: item.unit || "",
        pack_size: item.pack_size?.toString() || "",
        pack_label: item.pack_label || "",
        case_label: item.case_label || "",
        case_size: item.case_size?.toString() || "",
        order_code_threshold: item.order_code_threshold?.toString() || "",
        category_id: item.category_id || "",
        storage_room_id: item.storage_room_id || "",
        location_details: item.location_details || "",
        preferred_vendor: item.preferred_vendor || "",
        vendor_sku: item.sku || "",
        notes: item.notes || "",
      });
    }
  }, [item]);

  const { data: categories } = useQuery({
    queryKey: QUERY_KEYS.inventoryCategories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: QUERY_CONFIG.stale.long,
    gcTime: QUERY_CONFIG.gc.long,
  });

  const { data: storageRooms } = useQuery({
    queryKey: QUERY_KEYS.storageRooms(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, room_number, original_room_type, temporary_storage_use")
        .eq("is_storage", true)
        .order("room_number");
      if (error) throw error;
      return data as StorageRoom[];
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const newQuantity = parseInt(data.quantity) || 0;
      const oldQuantity = item.quantity;
      
      // 1. Create transaction record if quantity changed
      if (newQuantity !== oldQuantity) {
        const { error: txError } = await supabase
          .from("inventory_item_transactions")
          .insert({
            item_id: item.id,
            transaction_type: 'adjustment',
            quantity: newQuantity,
            previous_quantity: oldQuantity,
            new_quantity: newQuantity,
            notes: 'Manual edit via Edit Item dialog',
          });
        if (txError) throw txError;
        // Trigger will automatically update inventory_items.quantity
      }
      
      // 2. Update other fields (NOT quantity - trigger handles that)
      const { error } = await supabase
        .from("inventory_items")
        .update({
          name: data.name,
          description: data.description || null,
          minimum_quantity: parseInt(data.minimum_quantity) || 0,
          unit: data.unit || null,
          pack_size: data.pack_size ? parseInt(data.pack_size) : null,
          pack_label: data.pack_label || null,
          case_label: data.case_label || null,
          case_size: data.case_size ? parseInt(data.case_size) : null,
          order_code_threshold: data.order_code_threshold ? parseInt(data.order_code_threshold) : null,
          // packaging_note is the auto-generated human description of the tiers
          packaging_note: buildPackagingNote({
            unit: data.unit,
            pack_label: data.pack_label,
            pack_size: data.pack_size ? parseInt(data.pack_size) : null,
            case_label: data.case_label,
            case_size: data.case_size ? parseInt(data.case_size) : null,
          }),
          category_id: data.category_id || null,
          storage_room_id: data.storage_room_id || null,
          location_details: data.location_details || null,
          preferred_vendor: data.preferred_vendor || null,
          sku: data.vendor_sku || null,
          notes: data.notes || null,
        })
        .eq("id", item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateInventoryStockQueries(queryClient);
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "inventory-items" ||
          query.queryKey[0] === "inventory-stats" ||
          query.queryKey[0] === "inventory-categories" ||
          query.queryKey[0] === "optimized-inventory" ||
          query.queryKey[0] === "storage-rooms",
      });
      
      toast({
        title: "Item updated",
        description: "Inventory item has been updated successfully.",
      });
      
      // Delay closing dialog to allow queries to refetch
      setTimeout(() => {
        onOpenChange(false);
      }, 300);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update item: ${getErrorMessage(error)}`,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Missing field",
        description: "Item name is required.",
      });
      return;
    }

    updateItemMutation.mutate(formData);
  };

  const unitWord = formData.unit.trim() || "unit";
  const packWord = formData.pack_label.trim() || "pack";
  const caseWord = formData.case_label.trim() || "case";
  const unitPlural = pluralize(unitWord);
  const packPlural = pluralize(packWord);
  const packagingPreview = describePackaging({
    unit: formData.unit,
    pack_label: formData.pack_label,
    pack_size: formData.pack_size ? Number(formData.pack_size) : null,
    case_label: formData.case_label,
    case_size: formData.case_size ? Number(formData.case_size) : null,
  });

  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title="Edit Inventory Item"
    >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Smallest unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., battery, pen, sheet, ream"
                />
              </div>
            </div>

            {/* Packaging ladder: single -> pack -> case. Powers the order buttons + "= 1 box" hints. */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <div>
                <p className="text-sm font-medium">Packaging</p>
                <p className="text-xs text-muted-foreground">
                  Quantity is counted in <strong>{unitPlural}</strong>. Define a {packWord} and {caseWord} so
                  people can order by the {packWord} or {caseWord} instead of counting.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pack_label">Middle tier name</Label>
                  <Input
                    id="pack_label"
                    value={formData.pack_label}
                    onChange={(e) => setFormData({ ...formData, pack_label: e.target.value })}
                    placeholder="e.g., pack, box"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pack_size">{unitPlural} per {packWord}</Label>
                  <Input
                    id="pack_size"
                    type="number"
                    min="1"
                    value={formData.pack_size}
                    onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                    placeholder="e.g., 4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="case_label">Top tier name</Label>
                  <Input
                    id="case_label"
                    value={formData.case_label}
                    onChange={(e) => setFormData({ ...formData, case_label: e.target.value })}
                    placeholder="e.g., case"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case_size">{packPlural} per {caseWord}</Label>
                  <Input
                    id="case_size"
                    type="number"
                    min="1"
                    value={formData.case_size}
                    onChange={(e) => setFormData({ ...formData, case_size: e.target.value })}
                    placeholder="e.g., 26"
                  />
                </div>
              </div>

              {packagingPreview && (
                <p className="text-xs font-medium text-foreground/80">{packagingPreview}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_code_threshold">Require access code above</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="order_code_threshold"
                  type="number"
                  min="1"
                  className="max-w-[140px]"
                  value={formData.order_code_threshold}
                  onChange={(e) => setFormData({ ...formData, order_code_threshold: e.target.value })}
                  placeholder="e.g., 24"
                />
                <span className="text-sm text-muted-foreground">
                  {unitPlural} — larger orders ask the person for their personal code. Leave blank for no limit.
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the item"
                rows={2}
              />
            </div>
          </div>

          {/* Quantity & Category */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quantity & Category</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Current Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_quantity">Minimum Quantity</Label>
                <Input
                  id="minimum_quantity"
                  type="number"
                  value={formData.minimum_quantity}
                  onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger aria-label="Inventory category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Location</h3>
            
            <div className="space-y-2">
              <Label htmlFor="storage_room">Storage Room</Label>
              <Select
                value={formData.storage_room_id}
                onValueChange={(value) => setFormData({ ...formData, storage_room_id: value })}
              >
                <SelectTrigger aria-label="Storage room">
                  <SelectValue placeholder="Select a storage room" />
                </SelectTrigger>
                <SelectContent>
                  {storageRooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.room_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_details">Location Details</Label>
              <Input
                id="location_details"
                value={formData.location_details}
                onChange={(e) => setFormData({ ...formData, location_details: e.target.value })}
                placeholder="e.g., Shelf A-3, Cabinet 2"
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Vendor & Ordering</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferred_vendor">Preferred Vendor</Label>
                <Input
                  id="preferred_vendor"
                  value={formData.preferred_vendor}
                  onChange={(e) => setFormData({ ...formData, preferred_vendor: e.target.value })}
                  placeholder="Vendor or supplier name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_sku">Vendor SKU</Label>
                <Input
                  id="vendor_sku"
                  value={formData.vendor_sku}
                  onChange={(e) => setFormData({ ...formData, vendor_sku: e.target.value })}
                  placeholder="SKU or product code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or comments"
                rows={3}
              />
            </div>
          </div>

          <FormButtons
            onCancel={() => onOpenChange(false)}
            isSubmitting={updateItemMutation.isPending}
            submitLabel="Update Item"
          />
        </form>
    </ModalFrame>
  );
};
