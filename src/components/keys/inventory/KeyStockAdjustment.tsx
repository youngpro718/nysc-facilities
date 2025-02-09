import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Minus } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const stockAdjustmentSchema = z.object({
  transactionType: z.enum(["add", "remove", "adjustment"]),
  quantity: z.number().min(1),
  reason: z.string().min(1),
  notes: z.string().optional(),
});

type StockAdjustmentForm = z.infer<typeof stockAdjustmentSchema>;

export function KeyStockAdjustment({ keyId, keyName }: { keyId: string; keyName: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<StockAdjustmentForm>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      transactionType: "add",
      quantity: 1,
      reason: "",
      notes: "",
    },
  });

  const onSubmit = async (data: StockAdjustmentForm) => {
    const { error } = await supabase
      .from("key_stock_transactions")
      .insert({
        key_id: keyId,
        transaction_type: data.transactionType,
        quantity: data.transactionType === "remove" ? -data.quantity : data.quantity,
        reason: data.reason,
        notes: data.notes,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error adjusting stock",
        description: error.message,
      });
    } else {
      toast({
        title: "Stock adjusted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["keys"] });
      queryClient.invalidateQueries({ queryKey: ["keyStats"] });
      setOpen(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          Adjust Stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock for {keyName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="add">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Stock
                        </div>
                      </SelectItem>
                      <SelectItem value="remove">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4" />
                          Remove Stock
                        </div>
                      </SelectItem>
                      <SelectItem value="adjustment">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Adjustment
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}