
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategorySelector } from "./CategorySelector";
import { InventoryFormInputs } from "./types/inventoryTypes";
import { supabase } from "@/lib/supabase";
import { QUERY_KEYS } from "@/lib/queryKeys";

const inventoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  category_id: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  minimum_quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
  storage_room_id: z.string().optional(),
  location_details: z.string().optional(),
  preferred_vendor: z.string().optional(),
  notes: z.string().optional(),
  catalog_item_id: z.string().nullable().optional(),
});

interface InventoryFormProps {
  onSubmit: (data: InventoryFormInputs) => void;
  defaultValues?: Partial<InventoryFormInputs>;
  isSubmitting?: boolean;
  /** The item being edited, so the catalog-link controls can look up other rooms and guard against re-linking a listing that already has stock counted under it. */
  itemId?: string;
}

const STANDALONE_CATALOG_VALUE = "standalone";

export function InventoryForm({ onSubmit, defaultValues, isSubmitting, itemId }: InventoryFormProps) {
  const form = useForm<InventoryFormInputs>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      quantity: defaultValues?.quantity || 0,
      category_id: defaultValues?.category_id || "",
      description: defaultValues?.description || "",
      minimum_quantity: defaultValues?.minimum_quantity || undefined,
      unit: defaultValues?.unit || "",
      storage_room_id: defaultValues?.storage_room_id || "",
      location_details: defaultValues?.location_details || "",
      preferred_vendor: defaultValues?.preferred_vendor || "",
      notes: defaultValues?.notes || "",
      catalog_item_id: defaultValues?.catalog_item_id || null,
    },
  });

  const { data: storageRooms } = useQuery({
    queryKey: QUERY_KEYS.storageRooms(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, room_number")
        .eq("is_storage", true)
        .order("room_number");
      if (error) throw error;
      return data as { id: string; name: string; room_number: string }[];
    },
  });

  // Other active, unlinked listings this item could count under instead of
  // showing as its own catalog entry.
  const { data: linkTargets } = useQuery({
    queryKey: ["inventory-catalog-link-targets", itemId || "new"],
    enabled: !!itemId,
    queryFn: async () => {
      let query = supabase
        .from("inventory_items")
        .select("id, name, storage_room_id")
        .eq("status", "active")
        .is("catalog_item_id", null)
        .order("name");
      if (itemId) {
        query = query.neq("id", itemId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as { id: string; name: string; storage_room_id: string | null }[];
    },
  });

  // If other rooms' stock is already linked under this item, it must stay a
  // listing (single-level grouping is enforced by a DB trigger).
  const { data: linkedChildCount } = useQuery({
    queryKey: ["inventory-catalog-link-children", itemId],
    enabled: !!itemId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("inventory_items")
        .select("id", { count: "exact", head: true })
        .eq("catalog_item_id", itemId);
      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Item name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU # (Stock Keeping Unit)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ABC-123 or leave blank" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0}
                    {...field}
                    onChange={e => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., pieces, boxes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <CategorySelector
                  value={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter item description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minimum_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Quantity (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location_details"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Details (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Shelf A3, Cabinet 2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="storage_room_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Storage Room</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a storage room" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {storageRooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.room_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferred_vendor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Vendor (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Vendor name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {itemId && (
          <FormField
            control={form.control}
            name="catalog_item_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catalog listing</FormLabel>
                {linkedChildCount && linkedChildCount > 0 ? (
                  <p className="text-sm text-muted-foreground border rounded-md px-3 py-2">
                    This is a catalog listing with stock from {linkedChildCount} other{" "}
                    {linkedChildCount === 1 ? "room" : "rooms"} counted under it. Unlink those
                    items first if you want to move this one under another listing.
                  </p>
                ) : (
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === STANDALONE_CATALOG_VALUE ? null : value)
                    }
                    value={field.value || STANDALONE_CATALOG_VALUE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Own listing (shows in catalog)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={STANDALONE_CATALOG_VALUE}>
                        Own listing (shows in catalog)
                      </SelectItem>
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
                  once. Stock here still counts toward availability.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
