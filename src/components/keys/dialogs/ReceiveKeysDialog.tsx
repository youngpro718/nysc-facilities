
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { KeyOrder } from "../types/OrderTypes";

const formSchema = z.object({
  quantity_received: z
    .number()
    .int()
    .positive({ message: "Quantity must be positive" }),
  notes: z.string().optional(),
});

interface ReceiveKeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: KeyOrder;
  onSubmit: (quantity: number) => Promise<void>;
  isSubmitting: boolean;
}

export function ReceiveKeysDialog({
  open,
  onOpenChange,
  order,
  onSubmit,
  isSubmitting,
}: ReceiveKeysDialogProps) {
  const [maxQuantity, setMaxQuantity] = useState(order.quantity);

  useEffect(() => {
    // Calculate remaining quantity to be received
    if (order.status === 'partially_received') {
      // This is a rough estimate as we don't have the exact received quantity
      // For a more accurate calculation, we'd need to fetch the sum of received quantities
      setMaxQuantity(Math.max(1, Math.floor(order.quantity / 2)));
    } else {
      setMaxQuantity(order.quantity);
    }
  }, [order]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity_received: 1,
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    } else {
      // Set default quantity to max or 1, whichever is smaller
      form.setValue("quantity_received", Math.min(maxQuantity, 1));
    }
  }, [open, form, maxQuantity]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await onSubmit(values.quantity_received);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Receive Keys</DialogTitle>
        </DialogHeader>
        <div>
          <p className="mb-4">
            <span className="font-medium">Order:</span> {order.quantity} keys of type "{order.key_name}"
            {order.recipient_name && ` for ${order.recipient_name}`}
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity_received"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Received</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={maxQuantity}
                      {...field}
                      onChange={(e) => 
                        field.onChange(
                          Math.min(
                            maxQuantity, 
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        )
                      }
                    />
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any additional information about this receipt"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Receive Keys"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
