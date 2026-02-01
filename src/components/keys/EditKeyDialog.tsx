import React, { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { KeyData } from "./types/KeyTypes";
import { MultiSelect } from "@/components/ui/multi-select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModalFrame } from "@/components/common/ModalFrame";
import { FormButtons } from "@/components/ui/form-buttons";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const editKeySchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Key name must be at least 2 characters."),
  type: z.enum(["physical_key", "elevator_pass", "room_key"]),
  status: z.enum(["available", "assigned", "lost", "decommissioned"]),
  is_passkey: z.boolean(),
  door_locations: z.array(z.string()).optional(),
});

type EditKeyFormData = z.infer<typeof editKeySchema>;

interface EditKeyDialogProps {
  keyData: KeyData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditKeyDialog({ keyData, open, onOpenChange }: EditKeyDialogProps) {
  const form = useForm<EditKeyFormData>({
    resolver: zodResolver(editKeySchema),
    defaultValues: {
      id: keyData.id,
      name: keyData.name,
      type: keyData.type,
      status: keyData.status,
      is_passkey: keyData.is_passkey,
      door_locations: [],
    },
  });

  const { data: doors = [], isLoading: isLoadingDoors } = useQuery({
    queryKey: ["doors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doors")
        .select("*")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !keyData.is_passkey,
  });

  useEffect(() => {
    const fetchDoorLocations = async () => {
      const { data, error } = await supabase
        .from("room_key_access")
        .select("room_id")
        .eq("key_id", keyData.id);

      if (error) {
        console.error("Error fetching door locations:", error.message);
        form.setValue("door_locations", []);
        return;
      }

      const locations = data?.map((d) => d.room_id) || [];
      form.setValue("door_locations", locations);
    };

    if (open && !keyData.is_passkey) {
      fetchDoorLocations();
    }
  }, [open, keyData.id, keyData.is_passkey, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditKeyFormData) => {
      // Update key record
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

      // Handle room locations if not a passkey
      if (!data.is_passkey && data.door_locations && data.door_locations.length > 0) {
        const { error: deleteError } = await supabase
          .from("room_key_access")
          .delete()
          .eq("key_id", keyData.id);

        if (deleteError) throw deleteError;

        const locationsToInsert = data.door_locations.map((roomId) => ({
          key_id: keyData.id,
          room_id: roomId,
          access_type: "standard",
        }));

        const { error: locationError } = await supabase
          .from("room_key_access")
          .insert(locationsToInsert);

        if (locationError) throw locationError;
      }
    },
    onSuccess: () => {
      toast.success("Key updated successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error("Error updating key: " + error.message);
    },
  });

  const onSubmit = (data: EditKeyFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Key"
      description="Make changes to the key here. Click save when you're done."
      size="sm"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Key Name" {...field} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="physical_key">Physical Key</SelectItem>
                    <SelectItem value="elevator_pass">Elevator Pass</SelectItem>
                    <SelectItem value="room_key">Room Key</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
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

          <FormField
            control={form.control}
            name="is_passkey"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Passkey</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {!form.watch("is_passkey") && (
            <FormField
              control={form.control}
              name="door_locations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Door Locations</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={
                        doors?.map((door) => ({
                          label: door.name,
                          value: door.id,
                        })) || []
                      }
                      onChange={(values) => field.onChange(values)}
                      selected={field.value || []}
                      isLoading={isLoadingDoors}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormButtons
            onCancel={() => onOpenChange(false)}
            isSubmitting={updateMutation.isPending}
            submitLabel="Update Key"
          />
        </form>
      </Form>
    </ModalFrame>
  );
}
