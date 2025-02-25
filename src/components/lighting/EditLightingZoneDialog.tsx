import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { lightingZoneSchema, LightingZoneFormData } from "./schemas/lightingSchema";

interface EditLightingZoneDialogProps {
  zone: {
    id: string;
    name: string;
    type: string;
    floor_id: string;
  };
  onZoneUpdated: () => void;
}

export function EditLightingZoneDialog({ zone, onZoneUpdated }: EditLightingZoneDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<LightingZoneFormData>({
    resolver: zodResolver(lightingZoneSchema),
    defaultValues: {
      name: zone.name,
      type: zone.type as "general" | "emergency" | "restricted",
      floorId: zone.floor_id
    }
  });

  const onSubmit = async (data: LightingZoneFormData) => {
    try {
      const { error } = await supabase
        .from('lighting_zones')
        .update({
          name: data.name,
          type: data.type,
          floor_id: data.floorId
        })
        .eq('id', zone.id);

      if (error) throw error;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['lighting_zones'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-stats'] });

      toast.success("Lighting zone updated successfully");
      onZoneUpdated();
      setOpen(false);
    } catch (error: any) {
      console.error('Error updating lighting zone:', error);
      toast.error(error.message || "Failed to update lighting zone");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Lighting Zone</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter zone name" {...field} />
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
                  <FormLabel>Zone Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 