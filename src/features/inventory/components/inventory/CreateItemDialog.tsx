import { useEffect, useState } from "react";
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
import { categoryTracksCondition } from "@features/inventory/utils/condition";
import { useRolePermissions } from "@features/auth/hooks/useRolePermissions";

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

interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a storage room (e.g. when adding an item from a room's panel). */
  defaultStorageRoomId?: string | null;
}

export const CreateItemDialog = ({ open, onOpenChange, defaultStorageRoomId }: CreateItemDialogProps) => {
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
  // Purchasing decisions (reorder gates, vendor, catalog placement) belong to
  // purchasing/admin — court aides only handle the physical stock.
  const canManagePurchasing = userRole !== 'court_aide';

  useEffect(() => {
    if (open && defaultStorageRoomId) {
      setFormData(prev => ({ ...prev, storage_room_id: defaultStorageRoomId }));
    }
  }, [open, defaultStorageRoomId]);

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

  const selectedCategoryName = categories?.find((c) => c.id === formData.category_id)?.name;
  const showCondition = categoryTracksCondition(selectedCategoryName);

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

  // Catalog listings the new item can be linked under (active items that are
  // themselves listings). Linking makes this row room-level stock behind an
  // existing listing instead of a second catalog entry for the same product.
  const { data: linkTargets } = useQuery({
    queryKey: ["inventory-catalog-link-targets", "new"],
    enabled: open && canManagePurchasing,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id, name, storage_room_id")
        .eq("status", "active")
        .is("catalog_item_id", null)
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string; storage_room_id: string | null }[];
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Purchasing fields are only written when that section is visible —
      // items created by court aides get purchasing defaults until
      // purchasing/admin fills them in.
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
        .insert({
          name: data.name,
          description: data.description || null,
          quantity: parseInt(data.quantity) || 0,
          minimum_quantity: parseInt(data.minimum_quantity) || 0,
          pack_size: data.pack_size ? parseInt(data.pack_size) : null,
          case_size: data.case_size ? parseInt(data.case_size) : null,
          packaging_note: data.packaging_note.trim() || null,
          category_id: data.category_id || null,
          storage_room_id: data.storage_room_id || null,
          location_details: data.location_details || null,
          notes: data.notes || null,
          condition: data.condition,
          status: "active",
          ...purchasingFields,
        });

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
        title: "Item created",
        description: "Inventory item has been created successfully.",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create item: ${getErrorMessage(error)}`,
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

    createItemMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
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
      condition: "new",
    });
    onOpenChange(false);
  };

  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title="Add New Inventory Item"
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
                onValueChange={(value) => {
                  const nextTracksCondition = categoryTracksCondition(categories?.find((c) => c.id === value)?.name);
                  setFormData({
                    ...formData,
                    category_id: value,
                    condition: nextTracksCondition ? formData.condition : "new",
                  });
                }}
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

            {showCondition && (
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
                  If a room already has stock of this item in a different condition, add this
                  as its own entry rather than mixing it in — that's what keeps give-away
                  accurate later.
                </p>
              </div>
            )}
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
                <p className="text-xs text-muted-foreground">
                  Adding stock of a product that's already in the catalog (e.g. the same copy
                  paper in another building)? Pick its listing here so people ordering see it
                  once. Stock in this room still counts and staff can pull from it when
                  fulfilling orders.
                </p>
              </div>
            </div>
          )}

          <FormButtons
            onCancel={handleClose}
            isSubmitting={createItemMutation.isPending}
            submitLabel="Create Item"
          />
        </form>
    </ModalFrame>
  );
};
