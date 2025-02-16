
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelector } from "./CategorySelector";
import { InventoryFormInputs } from "./types/inventoryTypes";

const inventoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().min(0, "Quantity must be 0 or greater"),
  category_id: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  minimum_quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
  location_details: z.string().optional(),
  reorder_point: z.number().min(0).optional(),
  preferred_vendor: z.string().optional(),
  notes: z.string().optional(),
});

interface InventoryFormProps {
  onSubmit: (data: InventoryFormInputs) => void;
  defaultValues?: Partial<InventoryFormInputs>;
  isSubmitting?: boolean;
}

export function InventoryForm({ onSubmit, defaultValues, isSubmitting }: InventoryFormProps) {
  const form = useForm<InventoryFormInputs>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      quantity: defaultValues?.quantity || 0,
      category_id: defaultValues?.category_id || "",
      description: defaultValues?.description || "",
      minimum_quantity: defaultValues?.minimum_quantity || undefined,
      unit: defaultValues?.unit || "",
      location_details: defaultValues?.location_details || "",
      reorder_point: defaultValues?.reorder_point || undefined,
      preferred_vendor: defaultValues?.preferred_vendor || "",
      notes: defaultValues?.notes || "",
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
                    {...field}
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reorder_point"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Point (optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min={0}
                    {...field}
                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
