import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/services/core/supabaseClient";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@shared/hooks/use-toast";
import { FinishEntry, FinishType } from "./FinishesStep";

interface AddFinishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  editingEntry?: FinishEntry | null;
}

interface FinishFormData {
  finish_type: FinishType;
  status: 'scheduled' | 'in_progress' | 'completed';
  scheduled_date: string;
  completed_date: string;
  // Painting
  color_name: string;
  color_code: string;
  color_hex: string;
  finish: string;
  brand: string;
  // Flooring
  flooring_type: 'carpet' | 'vct' | '';
  // Blinds
  style: string;
  material: string;
  // Furniture
  items: string;
  order_number: string;
  // Other
  description: string;
  // Common
  vendor_contractor: string;
  cost: string;
  notes: string;
}

const defaultValues: FinishFormData = {
  finish_type: "painting",
  status: "completed",
  scheduled_date: "",
  completed_date: "",
  color_name: "",
  color_code: "",
  color_hex: "#ffffff",
  finish: "",
  brand: "",
  flooring_type: "",
  style: "",
  material: "",
  items: "",
  order_number: "",
  description: "",
  vendor_contractor: "",
  cost: "",
  notes: "",
};

export function AddFinishDialog({
  open,
  onOpenChange,
  roomId,
  editingEntry,
}: AddFinishDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FinishFormData>({ defaultValues });
  const finishType = form.watch("finish_type");
  const status = form.watch("status");

  useEffect(() => {
    if (editingEntry) {
      const details = (editingEntry.details || {}) as Record<string, string>;
      form.reset({
        finish_type: editingEntry.finish_type,
        status: (editingEntry.status as FinishFormData['status']) || "completed",
        scheduled_date: editingEntry.scheduled_date || "",
        completed_date: editingEntry.completed_date || "",
        color_name: editingEntry.color || "",
        color_code: details?.color_code || "",
        color_hex: details?.color_hex || "#ffffff",
        finish: details?.finish || "",
        brand: details?.brand || "",
        flooring_type: (details?.flooring_type as FinishFormData['flooring_type']) || "",
        style: details?.style || "",
        material: details?.material || "",
        items: details?.items || "",
        order_number: details?.order_number || "",
        description: details?.description || "",
        vendor_contractor: editingEntry.vendor_contractor || "",
        cost: editingEntry.cost?.toString() || "",
        notes: editingEntry.notes || "",
      });
    } else {
      form.reset(defaultValues);
    }
  }, [editingEntry, form, open]);

  const mutation = useMutation({
    mutationFn: async (data: FinishFormData) => {
      const details: Record<string, string> = {};

      switch (data.finish_type) {
        case "painting":
          if (data.color_code) details.color_code = data.color_code;
          if (data.color_hex) details.color_hex = data.color_hex;
          if (data.finish) details.finish = data.finish;
          if (data.brand) details.brand = data.brand;
          break;
        case "carpeting":
          if (data.flooring_type) details.flooring_type = data.flooring_type;
          break;
        case "blinds":
          if (data.style) details.style = data.style;
          if (data.material) details.material = data.material;
          break;
        case "furniture":
          if (data.items) details.items = data.items;
          if (data.order_number) details.order_number = data.order_number;
          break;
        case "other":
          if (data.description) details.description = data.description;
          break;
      }

      const payload = {
        room_id: roomId,
        finish_type: data.finish_type,
        status: data.status,
        scheduled_date: data.status !== 'completed' && data.scheduled_date ? data.scheduled_date : null,
        completed_date: data.status === 'completed' && data.completed_date ? data.completed_date : null,
        color: data.color_name || null,
        vendor_contractor: data.vendor_contractor || null,
        cost: data.cost ? parseFloat(data.cost) : null,
        notes: data.notes || null,
        details,
      };

      if (editingEntry) {
        const { error } = await db
          .from("room_finishes_log")
          .update(payload)
          .eq("id", editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from("room_finishes_log")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-finishes", roomId] });
      toast({ title: editingEntry ? "Entry updated" : "Entry added" });
      onOpenChange(false);
      form.reset(defaultValues);
    },
    onError: (error) => {
      toast({
        title: "Error saving entry",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FinishFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingEntry ? "Edit Entry" : "Add Finish Entry"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Type */}
            <FormField
              control={form.control}
              name="finish_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="painting">Painting</SelectItem>
                      <SelectItem value="carpeting">Flooring</SelectItem>
                      <SelectItem value="blinds">Blinds</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">📅 Scheduled</SelectItem>
                      <SelectItem value="in_progress">🔧 In Progress</SelectItem>
                      <SelectItem value="completed">✓ Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scheduled Date — shown when not completed */}
            {status !== 'completed' && (
              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Completed Date — shown when completed */}
            {status === 'completed' && (
              <FormField
                control={form.control}
                name="completed_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Completed</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Painting-specific fields */}
            {finishType === "painting" && (
              <>
                <FormField
                  control={form.control}
                  name="color_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., White Dove, Pale Oak" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color Code</FormLabel>
                      <div className="flex gap-2 items-center">
                        <FormControl>
                          <Input placeholder="e.g., OC-17, 2137-50" {...field} />
                        </FormControl>
                        <FormField
                          control={form.control}
                          name="color_hex"
                          render={({ field: hexField }) => (
                            <Input
                              type="color"
                              className="w-12 p-1 h-10 shrink-0"
                              value={hexField.value || "#ffffff"}
                              onChange={(e) => hexField.onChange(e.target.value)}
                            />
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="finish"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Finish Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select finish (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="flat">Flat</SelectItem>
                          <SelectItem value="eggshell">Eggshell</SelectItem>
                          <SelectItem value="satin">Satin</SelectItem>
                          <SelectItem value="semi-gloss">Semi-Gloss</SelectItem>
                          <SelectItem value="gloss">Gloss</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Benjamin Moore" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Flooring-specific fields */}
            {finishType === "carpeting" && (
              <FormField
                control={form.control}
                name="flooring_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flooring Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select flooring type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="carpet">Carpet</SelectItem>
                        <SelectItem value="vct">VCT (Vinyl Composition Tile)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Blinds-specific fields */}
            {finishType === "blinds" && (
              <>
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vertical">Vertical</SelectItem>
                          <SelectItem value="horizontal">Horizontal</SelectItem>
                          <SelectItem value="roller">Roller</SelectItem>
                          <SelectItem value="cellular">Cellular/Honeycomb</SelectItem>
                          <SelectItem value="roman">Roman</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Vinyl, Fabric, Wood" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Furniture-specific fields */}
            {finishType === "furniture" && (
              <>
                <FormField
                  control={form.control}
                  name="items"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Items</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Desk, Chair, Bookcase, Filing Cabinet"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="order_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order/PO Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., PO-12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Other-specific fields */}
            {finishType === "other" && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the work done" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="vendor_contractor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor/Contractor</FormLabel>
                  <FormControl>
                    <Input placeholder="Company or contractor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                    <Textarea placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : editingEntry ? "Update" : "Add Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
