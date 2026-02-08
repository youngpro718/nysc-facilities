
import { useState, useEffect } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Loader2 } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { generateFixtureName } from "./schemas/lightingSchema";
import { toast } from "sonner";

// Simplified schema for bulk creation
const bulkCreateSchema = z.object({
  space_id: z.string().min(1, "Space is required"),
  space_type: z.enum(["room", "hallway"]),
  position: z.enum(["ceiling", "wall", "floor", "desk"]),
  quantity: z.number().min(1).max(50).default(1),
  type: z.enum(["standard", "emergency", "exit_sign", "decorative", "motion_sensor"]),
  technology: z.enum(["LED", "Fluorescent", "Bulb"]).nullable(),
  bulb_count: z.number().min(1).default(1),
  status: z.enum(["functional", "maintenance_needed", "non_functional"]).default("functional"),
});

type BulkCreateFormData = z.infer<typeof bulkCreateSchema>;

interface BulkCreateLightingDialogProps {
  onFixtureCreated: () => void;
}

export function BulkCreateLightingDialog({ onFixtureCreated }: BulkCreateLightingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<BulkCreateFormData>({
    resolver: zodResolver(bulkCreateSchema),
    defaultValues: {
      quantity: 1,
      type: "standard",
      status: "functional",
      technology: "LED",
      bulb_count: 1,
      space_type: "room",
    }
  });

  // Fetch spaces (similar to BasicSettingsFields)
  const { data: spaces } = useQuery({
    queryKey: ['spaces-with-building-floor'],
    queryFn: async () => {
      const [roomsResult, hallwaysResult] = await Promise.all([
        supabase.from('rooms').select('id, name, room_number, floor_id, floors:floor_id(name, buildings:building_id(name))').eq('status', 'active'),
        supabase.from('hallways').select('id, name, floor_id, floors:floor_id(name, buildings:building_id(name))').eq('status', 'active')
      ]);
      
      const rooms = (roomsResult.data || []).map((room: Record<string, unknown>) => ({
        ...room, type: 'room' as const, displayName: `Room ${room.room_number || ''}${room.name ? ` — ${room.name}` : ''}`
      }));
      
      const hallways = (hallwaysResult.data || []).map((hallway: Record<string, unknown>) => ({
        ...hallway, type: 'hallway' as const, displayName: hallway.name, room_number: null
      }));
      
      return [...rooms, ...hallways];
    }
  });

  const spaceType = form.watch('space_type');

  const onSubmit = async (data: BulkCreateFormData) => {
    setIsSubmitting(true);
    try {
      const selectedSpace = spaces?.find(s => s.id === data.space_id);
      if (!selectedSpace) throw new Error("Selected space not found");

      // Get starting sequence
      const { data: sequenceStart, error: sequenceError } = await supabase
        .rpc('get_next_lighting_sequence', { p_space_id: data.space_id });

      if (sequenceError) throw sequenceError;

      let currentSequence = typeof sequenceStart === 'number' ? sequenceStart : 1;
      const fixturesToCreate = [];
      const assignmentsToCreate = [];

      for (let i = 0; i < data.quantity; i++) {
        const name = generateFixtureName(
          data.space_type,
          selectedSpace.name,
          selectedSpace.room_number,
          data.position,
          currentSequence
        );

        // Prepare fixture data
        const fixtureData = {
          name,
          type: data.type,
          technology: data.technology,
          bulb_count: data.bulb_count,
          status: data.status,
          space_id: data.space_id,
          space_type: data.space_type,
          position: data.position,
          room_number: selectedSpace.room_number,
          // Defaults for other fields
          electrical_issues: { short_circuit: false, wiring_issues: false, voltage_problems: false },
          ballast_issue: false
        };

        // Insert one by one to get ID
        const { data: createdFixture, error: createError } = await supabase
          .from('lighting_fixtures')
          .insert(fixtureData)
          .select()
          .single();
          
        if (createError) throw createError;

        assignmentsToCreate.push({
          fixture_id: createdFixture.id,
          space_id: data.space_id,
          space_type: data.space_type,
          position: data.position,
          sequence_number: currentSequence
        });

        currentSequence++;
      }

      // Batch insert assignments
      if (assignmentsToCreate.length > 0) {
        const { error: assignError } = await supabase
          .from('spatial_assignments')
          .insert(assignmentsToCreate);
        
        if (assignError) logger.error("Error creating assignments:", assignError);
      }

      toast.success(`Successfully created ${data.quantity} fixtures`);
      queryClient.invalidateQueries({ queryKey: ['lighting_fixtures'] });
      onFixtureCreated();
      setOpen(false);
      form.reset();

    } catch (error) {
      logger.error("Bulk create error:", error);
      toast.error(getErrorMessage(error) || "Failed to create fixtures");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Copy className="h-4 w-4" />
          Bulk Add
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Add Lighting Fixtures</DialogTitle>
          <DialogDescription>
            Quickly add multiple identical fixtures to a specific location.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="space_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Space Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="room">Room</SelectItem>
                        <SelectItem value="hallway">Hallway</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="space_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {spaces?.filter(s => s.type === spaceType).map((space: Record<string, unknown>) => (
                            <SelectItem key={space.id} value={space.id}>
                              {space.displayName}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ceiling">Ceiling</SelectItem>
                        <SelectItem value="wall">Wall</SelectItem>
                        <SelectItem value="floor">Floor</SelectItem>
                        <SelectItem value="desk">Desk</SelectItem>
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
                        max={50} 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixture Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="exit_sign">Exit Sign</SelectItem>
                        <SelectItem value="decorative">Decorative</SelectItem>
                        <SelectItem value="motion_sensor">Motion Sensor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technology"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technology</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tech" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LED">LED</SelectItem>
                        <SelectItem value="Fluorescent">Fluorescent</SelectItem>
                        <SelectItem value="Bulb">Incandescent/Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="functional">Functional</SelectItem>
                        <SelectItem value="maintenance_needed">Maintenance Needed</SelectItem>
                        <SelectItem value="non_functional">Non-Functional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="bulb_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bulbs per Fixture</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create {form.watch('quantity')} Fixtures
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
