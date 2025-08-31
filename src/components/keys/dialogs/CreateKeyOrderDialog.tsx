
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Key } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreateKeyOrderData } from "../types/OrderTypes";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  key_id: z.string().uuid({ message: "Please select a key" }),
  quantity: z.coerce.number().int().positive({ message: "Quantity must be positive" }),
  recipient_id: z.string().uuid().optional(),
  expected_delivery_date: z.date().optional(),
  notes: z.string().optional(),
});

interface CreateKeyOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateKeyOrderData) => Promise<any>;
  isSubmitting: boolean;
}

export function CreateKeyOrderDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isSubmitting 
}: CreateKeyOrderDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key_id: "",
      quantity: 1,
      recipient_id: undefined,
      expected_delivery_date: undefined,
      notes: "",
    },
  });

  const { data: availableKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ["keys-for-order"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keys")
        .select("id, name, type");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: occupants, isLoading: isLoadingOccupants } = useQuery({
    queryKey: ["occupants-for-order"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupants")
        .select("id, first_name, last_name, department")
        .eq("status", "active")
        .order("last_name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const orderData: CreateKeyOrderData = {
      key_id: values.key_id,
      quantity: values.quantity,
      recipient_id: values.recipient_id,
      expected_delivery_date: values.expected_delivery_date ? values.expected_delivery_date.toISOString() : undefined,
      notes: values.notes,
    };

    const result = await onSubmit(orderData);
    if (result) {
      onOpenChange(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Key Order</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="key_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a key" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingKeys ? (
                        <SelectItem value="loading" disabled>
                          Loading keys...
                        </SelectItem>
                      ) : (
                        availableKeys?.map((key) => (
                          <SelectItem key={key.id} value={key.id}>
                            <div className="flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              {key.name} ({key.type})
                            </div>
                          </SelectItem>
                        ))
                      )}
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
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a recipient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">General inventory</SelectItem>
                      {isLoadingOccupants ? (
                        <SelectItem value="loading" disabled>
                          Loading occupants...
                        </SelectItem>
                      ) : (
                        occupants?.map((occupant) => (
                          <SelectItem key={occupant.id} value={occupant.id}>
                            {occupant.first_name} {occupant.last_name}
                            {occupant.department && ` (${occupant.department})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expected_delivery_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expected Delivery Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => date < new Date()}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
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
                    <Textarea {...field} placeholder="Add any additional information" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Create Order"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
