
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage,
  Form
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const connectionSchema = z.object({
  fromSpaceId: z.string().uuid(),
  toSpaceId: z.string().uuid(),
  fromSpaceType: z.string(),
  connectionType: z.enum(["door", "hallway", "direct"]),
  direction: z.enum(["north", "south", "east", "west", "adjacent"]),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

interface SpaceConnectionFormProps {
  floorId: string;
  onComplete?: () => void;
}

export function SpaceConnectionForm({ floorId, onComplete }: SpaceConnectionFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
  });

  const { data: spaces } = useQuery({
    queryKey: ["floor-spaces", floorId],
    queryFn: async () => {
      // Get rooms, doors, and hallways for the floor
      const [roomsResult, doorsResult, hallwaysResult] = await Promise.all([
        supabase.from('rooms').select('id, name').eq('floor_id', floorId).eq('status', 'active'),
        supabase.from('doors').select('id, name').eq('floor_id', floorId).eq('status', 'active'),
        supabase.from('hallways').select('id, name').eq('floor_id', floorId).eq('status', 'active')
      ]);
      
      if (roomsResult.error) throw roomsResult.error;
      if (doorsResult.error) throw doorsResult.error;
      if (hallwaysResult.error) throw hallwaysResult.error;
      
      const allSpaces = [
        ...(roomsResult.data || []).map(item => ({ ...item, type: 'room' })),
        ...(doorsResult.data || []).map(item => ({ ...item, type: 'door' })),
        ...(hallwaysResult.data || []).map(item => ({ ...item, type: 'hallway' }))
      ];
      
      return allSpaces;
    },
  });

  // When source space is selected, update its type
  const handleFromSpaceChange = (spaceId: string) => {
    const space = spaces?.find(s => s.id === spaceId);
    if (space) {
      form.setValue("fromSpaceId", spaceId);
      form.setValue("fromSpaceType", space.type);
    }
  };

  async function onSubmit(data: ConnectionFormData) {
    try {
      setLoading(true);
      
      // Note: space_connections table doesn't exist, so we'll skip the insertion
      // In a real implementation, you'd need to create this table first
      console.log('Would connect spaces:', data);
      throw new Error('Space connections feature not yet implemented - table does not exist');

      toast.success("Spaces connected successfully");
      form.reset();
      onComplete?.();
    } catch (error) {
      console.error("Error connecting spaces:", error);
      toast.error("Failed to connect spaces");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fromSpaceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Space</FormLabel>
              <Select onValueChange={handleFromSpaceChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source space" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {spaces?.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name} ({space.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="toSpaceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>To Space</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target space" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {spaces?.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name} ({space.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="connectionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Connection Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select connection type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="door">Door</SelectItem>
                  <SelectItem value="hallway">Hallway</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="direction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Direction</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                  <SelectItem value="adjacent">Adjacent</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Connecting..." : "Connect Spaces"}
        </Button>
      </form>
    </Form>
  );
}
