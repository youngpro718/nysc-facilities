
import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
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
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["general", "emergency", "restricted"]),
  floor_id: z.string().min(1, "Floor is required"),
});

type FormData = z.infer<typeof formSchema>;

export function CreateLightingZoneDialog({ onZoneCreated }: { onZoneCreated: () => void }) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "general",
      floor_id: "",
    },
  });

  const { data: floors } = useQuery({
    queryKey: ['floors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select(`
          id, 
          name, 
          buildings!floors_building_id_fkey(name)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from('lighting_zones')
        .insert({
          name: data.name,
          type: data.type,
          floor_id: data.floor_id,
        });

      if (error) throw error;

      toast.success("Lighting zone created successfully");
      onZoneCreated();
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to create lighting zone");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Zone
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Lighting Zone</DialogTitle>
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

            <FormField
              control={form.control}
              name="floor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select floor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {floors?.map((floor) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          {(floor.buildings as Record<string, unknown>)?.name || floor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Zone</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
