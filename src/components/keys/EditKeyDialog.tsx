import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

const editKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["physical_key", "elevator_pass"], {
    required_error: "Please select a key type",
  }),
  door_locations: z.array(z.string()).optional(),
  status: z.enum(["available", "assigned", "lost", "decommissioned"], {
    required_error: "Please select a status",
  }),
  is_passkey: z.boolean(),
  quantity_adjustment: z.number().optional(),
});

type EditKeyFormData = z.infer<typeof editKeySchema>;

interface EditKeyDialogProps {
  keyData: {
    id: string;
    name: string;
    type: "physical_key" | "elevator_pass";
    status: "available" | "assigned" | "lost" | "decommissioned";
    is_passkey: boolean;
    total_quantity?: number;
    available_quantity?: number;
  };
}

export default function EditKeyDialog({ keyData }: EditKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<EditKeyFormData>({
    resolver: zodResolver(editKeySchema),
    defaultValues: {
      name: keyData.name,
      type: keyData.type,
      door_locations: [],
      status: keyData.status,
      is_passkey: keyData.is_passkey,
      quantity_adjustment: 0,
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, room_number")
        .eq("status", "active");

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching rooms",
          description: error.message,
        });
        return [];
      }

      return data;
    },
  });

  useEffect(() => {
    const fetchDoorLocations = async () => {
      const { data, error } = await supabase
        .from("key_door_locations")
        .select("door_location")
        .eq("key_id", keyData.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching door locations",
          description: error.message,
        });
        return;
      }

      const locations = data.map(d => d.door_location);
      form.setValue("door_locations", locations);
    };

    if (open && !keyData.is_passkey) {
      fetchDoorLocations();
    }
  }, [open, keyData.id, keyData.is_passkey, form, toast]);

  const onSubmit = async (data: EditKeyFormData) => {
    try {
      // Update key details
      const { error: keyError } = await supabase
        .from("keys")
        .update({
          name: data.name,
          type: data.type,
          status: data.status,
          is_passkey: data.is_passkey,
        })
        .eq("id", keyData.id);

      if (keyError) throw keyError;

      // Handle quantity adjustment if provided
      if (data.quantity_adjustment && data.quantity_adjustment !== 0) {
        const { error: stockError } = await supabase
          .from("key_stock_transactions")
          .insert({
            key_id: keyData.id,
            transaction_type: data.quantity_adjustment > 0 ? 'add' : 'remove',
            quantity: Math.abs(data.quantity_adjustment),
            reason: 'Manual adjustment',
          });

        if (stockError) throw stockError;
      }

      // Handle door locations only if not a passkey
      if (!data.is_passkey && data.door_locations && data.door_locations.length > 0) {
        // Delete existing door locations
        const { error: deleteError } = await supabase
          .from("key_door_locations")
          .delete()
          .eq("key_id", keyData.id);

        if (deleteError) throw deleteError;

        // Insert new door locations
        const { error: locationError } = await supabase
          .from("key_door_locations")
          .insert(
            data.door_locations.map(location => ({
              key_id: keyData.id,
              door_location: location,
            }))
          );

        if (locationError) throw locationError;
      }

      // Log the edit in audit logs
      const { error: auditError } = await supabase
        .from("key_audit_logs")
        .insert([{
          key_id: keyData.id,
          action_type: "updated",
          details: {
            name: data.name,
            type: data.type,
            status: data.status,
            is_passkey: data.is_passkey,
            door_locations: data.door_locations,
            quantity_adjustment: data.quantity_adjustment
          }
        }]);

      if (auditError) {
        console.error("Error logging key update:", auditError);
      }

      toast({
        title: "Key updated successfully",
        description: data.quantity_adjustment 
          ? `Updated key details and adjusted quantity by ${data.quantity_adjustment}`
          : "Updated key details",
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating key",
        description: error.message,
      });
    }
  };

  const isPasskey = form.watch("is_passkey");
  const quantityAdjustment = form.watch("quantity_adjustment");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Key</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter key name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select key type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="physical_key">Physical Key</SelectItem>
                      <SelectItem value="elevator_pass">Elevator Pass</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity_adjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjust Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Enter quantity adjustment"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a positive number to add keys or a negative number to remove keys
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {quantityAdjustment !== 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will {quantityAdjustment > 0 ? 'add' : 'remove'} {Math.abs(quantityAdjustment)} key(s) 
                  {quantityAdjustment > 0 ? ' to' : ' from'} the inventory
                </AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="is_passkey"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Passkey</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      This key can be used with passkey-enabled doors
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {!isPasskey && (
              <FormField
                control={form.control}
                name="door_locations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Door Location</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange([value])} 
                      value={field.value?.[0] || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select door location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms?.map((room) => (
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
            )}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select key status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="decommissioned">Decommissioned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Update Key
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}