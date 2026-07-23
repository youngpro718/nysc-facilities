import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QUERY_CONFIG } from '@/config';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";

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
  requires_justification: boolean | null;
  condition: string | null;
  status: string;
  location_details: string;
  preferred_vendor: string;
  sku: string | null;
  notes: string;
  category_id: string;
  storage_room_id: string;
  catalog_item_id?: string | null;
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
    requires_justification: false,
    packaging_note: "",
    category_id: "",
    storage_room_id: "",
    location_details: "",
    preferred_vendor: "",
    vendor_sku: "",
    notes: "",
    catalog_item_id: "standalone",
    condition: "new" as "new" | "used",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useRolePermissions();
  // Purchasing decisions (reorder gates, vendor, how the item appears in the
  // ordering catalog) belong to purchasing/admin. Court aides handle the
  // physical stock — hide those controls from them entirely so nothing can
  // be changed by accident.
  const canManagePurchasing = userRole !== 'court_aide';

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
        requires_justification: item.requires_justification ?? false,
        packaging_note: item.packaging_note || "",
        category_id: item.category_id || "",
        storage_room_id: item.storage_room_id || "",
        location_details: item.location_details || "",
        preferred_vendor: item.preferred_vendor || "",
        vendor_sku: item.sku || "",
        notes: item.notes || "",
        catalog_item_id: item.catalog_item_id || "standalone",
        condition: item.condition === "used" ? "used" : "new",
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

  // Catalog listings this item could be linked under: active items that are
  // themselves listings (not linked under something else). People ordering
  // see one listing; linked items are room-level stock behind it.
  const { data: linkTargets } = useQuery({
    queryKey: ["inventory-catalog-link-targets", item?.id],
    enabled: open && !!item?.id && canManagePurchasing,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, storage_room_id")
        .eq("status", "active")
        .is("catalog_item_id", null)
        .neq("id", item.id)
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string; storage_room_id: string | null }[];
    },
  });

  // An item that already has other rooms' stock linked under it must stay a
  // listing (single-level grouping, enforced by a DB trigger).
  const { data: linkedChildCount } = useQuery({
    queryKey: ["inventory-catalog-link-children", item?.id],
    enabled: open && !!item?.id && canManagePurchasing,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("catalog_item_id", item.id);
      if (error) throw error;
      return count ?? 0;
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
      
      // 2. Update other fields (NOT quantity - trigger handles that).
      // Purchasing fields are only written when the purchasing section is
      // visible — a court aide's save must never touch them.
      const purchasingFields = canManagePurchasing
        ? {
            order_code_threshold: data.order_code_threshold ? parseInt(data.order_code_threshold) : null,
            requires_justification: data.requires_justification,
            preferred_vendor: data.preferred_vendor || null,
            sku: data.vendor_sku || null,
            catalog_item_id:
              data.catalog_item_id && data.catalog_item_id !== "standalone"
                ? data.catalog_item_id
                : null,
          }
        : {};

      const { error } = await supabase
        .from("inventory_items")
        .update({
          name: data.name,
          description: data.description || null,
          minimum_quantity: parseInt(data.minimum_quantity) || 0,
          pack_size: data.pack_size ? parseInt(data.pack_size) : null,
          case_size: data.case_size ? parseInt(data.case_size) : null,
          packaging_note: data.packaging_note.trim() || null,
          category_id: data.category_id || null,
          storage_room_id: data.storage_room_id || null,
          location_details: data.location_details || null,
          notes: data.notes || null,
          condition: data.condition,
          ...purchasingFields,
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
              <Label>Condition</Label>
              <ToggleGroup
                type="single"
                value={formData.condition}
                onValueChange={(value) => value && setFormData({ ...formData, condition: value as "new" | "used" })}
                className="justify-start"
              >
                <ToggleGroupItem value="new" aria-label="New" className="px-4">
                  New
                </ToggleGroupItem>
                <ToggleGroupItem value="used" aria-label="Used" className="px-4">
                  Used
                </ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                If this room has both new and used stock of the same item, keep them as
                separate entries (one "New", one "Used") so it's clear which one gets handed out.
              </p>
            </div>

            {/* Packaging — counts only, no label naming. Auto-falls back to "units"/"pack"/"case" in displays. */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
              <p className="text-sm font-medium">Packaging</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pack_size">Units per pack</Label>
                  <Input
                    id="pack_size"
                    type="number"
                    min="1"
                    value={formData.pack_size}
                    onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                    placeholder="e.g., 4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case_size">Packs per case</Label>
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

              <div className="space-y-2">
                <Label htmlFor="packaging_note">What's in one item? <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="packaging_note"
                  value={formData.packaging_note}
                  onChange={(e) => setFormData({ ...formData, packaging_note: e.target.value })}
                  placeholder="e.g., pack of 3, single sheet, 12-pack"
                />
                <p className="text-xs text-muted-foreground">
                  Free text shown to people ordering, so they know what they get for one.
                </p>
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

          {/* Purchasing & Catalog — everything only purchasing/admin should
              touch lives in this one section, and court aides never see it. */}
          {canManagePurchasing && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Purchasing & Catalog</h3>
                <p className="text-xs text-muted-foreground">
                  Reorder gates, vendor info, and how this item appears in the ordering catalog.
                </p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <p className="text-sm font-medium">Order controls</p>

                <div className="space-y-2">
                  <Label htmlFor="order_code_threshold">Require an access code above</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      id="order_code_threshold"
                      type="number"
                      min="1"
                      className="max-w-[140px]"
                      value={formData.order_code_threshold}
                      onChange={(e) => setFormData({ ...formData, order_code_threshold: e.target.value })}
                      placeholder="e.g., 4"
                    />
                    <span className="text-sm text-muted-foreground">
                      units — larger orders prompt the person for their personal code. Leave blank for no limit.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="requires_justification"
                    checked={formData.requires_justification}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requires_justification: checked === true })
                    }
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="requires_justification" className="cursor-pointer">
                      Requires supervisor approval
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Every order for this item routes to a supervisor for approval before fulfillment, regardless of quantity.
                    </p>
                  </div>
                </div>
              </div>

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
                <Label htmlFor="catalog_item_id">Catalog listing</Label>
                {linkedChildCount && linkedChildCount > 0 ? (
                  <p className="text-sm text-muted-foreground border rounded-md px-3 py-2">
                    This is a catalog listing with stock from {linkedChildCount} other{" "}
                    {linkedChildCount === 1 ? "room" : "rooms"} counted under it. Unlink those
                    items first if you want to move this one under another listing.
                  </p>
                ) : (
                  <Select
                    value={formData.catalog_item_id}
                    onValueChange={(value) => setFormData({ ...formData, catalog_item_id: value })}
                  >
                    <SelectTrigger aria-label="Catalog listing">
                      <SelectValue placeholder="Own listing (shows in catalog)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standalone">Own listing (shows in catalog)</SelectItem>
                      {linkTargets?.map((target) => {
                        const room = storageRooms?.find((r) => r.id === target.storage_room_id);
                        return (
                          <SelectItem key={target.id} value={target.id}>
                            Counts under: {target.name}
                            {room ? ` (${room.room_number})` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Link this room's stock under another item so people ordering see the product
                  once. Stock here still counts toward availability, and staff can pick this
                  room when fulfilling orders.
                </p>
              </div>
            </div>
          )}

          <FormButtons
            onCancel={() => onOpenChange(false)}
            isSubmitting={updateItemMutation.isPending}
            submitLabel="Update Item"
          />
        </form>
    </ModalFrame>
  );
};
