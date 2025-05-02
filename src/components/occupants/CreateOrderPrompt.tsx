
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShoppingCart } from "lucide-react";

const formSchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .positive({ message: "Quantity must be positive" })
    .min(1, { message: "Please order at least 1 key" })
});

interface CreateOrderPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyName?: string;
  onCreateOrder: (quantity: number) => Promise<void>;
  isSubmitting: boolean;
}

export function CreateOrderPrompt({
  open,
  onOpenChange,
  keyName,
  onCreateOrder,
  isSubmitting
}: CreateOrderPromptProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await onCreateOrder(values.quantity);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !isSubmitting && onOpenChange(newOpen)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Keys
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <p className="text-muted-foreground">
            No keys of type <span className="font-semibold">{keyName || "selected"}</span> are currently available. Would you like to create an order?
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the number of keys you need to order
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating order..." : "Create Order"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
