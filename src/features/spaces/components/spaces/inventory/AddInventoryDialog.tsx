
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QUERY_CONFIG } from '@/config';
import { QUERY_KEYS } from '@/lib/queryKeys';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InventoryFormInputs } from "./types/inventoryTypes";
import { useCatalogMatches } from "./hooks/useCatalogMatches";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  minimum_quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  location_details: z.string().optional(),
  preferred_vendor: z.string().optional(),
  notes: z.string().optional(),
});

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InventoryFormInputs) => Promise<void>;
  isSubmitting: boolean;
  /** The room this item is being added to (auto-assigned, not user-editable here). */
  roomId?: string;
  roomName?: string;
}

export function AddInventoryDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  roomId,
  roomName,
}: AddInventoryDialogProps) {
  const [linkedCatalogId, setLinkedCatalogId] = useState<string | null>(null);

  const form = useForm<InventoryFormInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      quantity: 0,
      minimum_quantity: 0,
      unit: "",
      category_id: "",
      location_details: "",
      preferred_vendor: "",
      notes: "",
    },
  });

  const nameValue = form.watch("name");
  const { data: catalogMatches } = useCatalogMatches(nameValue, roomId);

  useEffect(() => {
    // Reset the chosen link whenever the matched name changes, so a stale
    // link doesn't silently carry over after the user edits the name.
    setLinkedCatalogId(null);
  }, [catalogMatches]);

  const handleSubmit = async (data: InventoryFormInputs) => {
    await onSubmit({ ...data, catalog_item_id: linkedCatalogId });
  };

  const { data: categories } = useQuery({
    queryKey: QUERY_KEYS.inventoryCategories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
    staleTime: QUERY_CONFIG.stale.long,
    gcTime: QUERY_CONFIG.gc.long,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalFrame title="Add New Item" size="md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {roomName && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Adding to: </span>
                  <span className="font-medium">{roomName}</span>
                </div>
              )}

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

              {catalogMatches && catalogMatches.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 space-y-2 text-sm">
                  <p className="font-medium">Already stocked in other rooms</p>
                  {catalogMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between gap-2">
                      <span>
                        {match.room_name || "Unknown room"}
                        {match.room_number ? ` (${match.room_number})` : ""}: {match.quantity} in stock
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant={linkedCatalogId === match.id ? "default" : "outline"}
                        onClick={() =>
                          setLinkedCatalogId((prev) => (prev === match.id ? null : match.id))
                        }
                      >
                        {linkedCatalogId === match.id ? "Linked" : "Link"}
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Linking counts this room's stock under the same catalog listing, so people
                    ordering see one item and staff can pull from whichever room has stock.
                  </p>
                </div>
              )}

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
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimum_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Item description"
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
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., pieces, boxes" {...field} />
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
                      <FormLabel>Location Details</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Shelf A3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="preferred_vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Vendor</FormLabel>
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
                    <FormLabel>Notes</FormLabel>
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

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Item"}
                </Button>
              </div>
          </form>
        </Form>
      </ModalFrame>
    </Dialog>
  );
}
