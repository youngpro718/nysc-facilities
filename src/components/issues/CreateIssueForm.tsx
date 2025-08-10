
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  issue_type: z.enum([
    "maintenance",
    "electrical",
    "plumbing",
    "hvac",
    "lighting",
    "security",
    "cleaning",
    "other",
  ] as const, {
    required_error: "Issue type is required",
  }),
  priority: z.enum(["low", "medium", "high"] as const),
  building_id: z.string().optional().nullable(),
  floor_id: z.string().optional().nullable(),
  room_id: z.string().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateIssueFormProps {
  onSuccess?: () => void;
}

export function CreateIssueForm({ onSuccess }: CreateIssueFormProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      issue_type: undefined as unknown as FormData["issue_type"],
      priority: 'medium',
      building_id: undefined,
      floor_id: undefined,
      room_id: undefined,
    },
  });

  // Fetch buildings
  const { data: buildings, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch floors for selected building
  const { data: floors, isLoading: isLoadingFloors } = useQuery({
    queryKey: ['floors', selectedBuilding],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', selectedBuilding)
        .eq('status', 'active')
        .order('floor_number');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBuilding,
  });

  // Fetch rooms for selected floor
  const { data: rooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['rooms', selectedFloor],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('floor_id', selectedFloor)
        .eq('status', 'active')
        .order('room_number');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedFloor,
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      // Build a compact payload without undefined/null optional fields
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        issue_type: data.issue_type,
        priority: data.priority,
        status: 'open',
      };
      if (data.building_id) payload.building_id = data.building_id;
      if (data.floor_id) payload.floor_id = data.floor_id;
      if (data.room_id) payload.room_id = data.room_id;

      const { error } = await supabase
        .from('issues')
        .insert([payload]);

      if (error) throw error;
      
      toast.success("Issue created successfully");
      form.reset();
      setSelectedBuilding(null);
      setSelectedFloor(null);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-background/5 backdrop-blur-xl border-white/10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Issue title" aria-invalid={!!form.formState.errors.title} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Describe the issue" aria-invalid={!!form.formState.errors.description} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="issue_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger aria-invalid={!!form.formState.errors.issue_type}>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="lighting">Lighting</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="building_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Building</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedBuilding(value);
                    setSelectedFloor(null);
                    form.setValue('floor_id', undefined);
                    form.setValue('room_id', undefined);
                  }} 
                  value={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger disabled={isLoadingBuildings}>
                      <SelectValue placeholder={isLoadingBuildings ? "Loading buildings..." : "Select building"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {buildings?.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.name}
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
            name="floor_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Floor</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedFloor(value);
                    form.setValue('room_id', undefined);
                  }} 
                  value={field.value ?? undefined}
                  disabled={!selectedBuilding || isLoadingFloors}
                >
                  <FormControl>
                    <SelectTrigger disabled={!selectedBuilding || isLoadingFloors}>
                      <SelectValue placeholder={!selectedBuilding ? "Select building first" : (isLoadingFloors ? "Loading floors..." : "Select floor")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {floors?.map((floor) => (
                      <SelectItem key={floor.id} value={floor.id}>
                        Floor {floor.floor_number} - {floor.name}
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
            name="room_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value ?? undefined}
                  disabled={!selectedFloor || isLoadingRooms}
                >
                  <FormControl>
                    <SelectTrigger disabled={!selectedFloor || isLoadingRooms}>
                      <SelectValue placeholder={!selectedFloor ? "Select floor first" : (isLoadingRooms ? "Loading rooms..." : "Select room")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {rooms?.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        Room {room.room_number} - {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Creating…' : 'Create Issue'}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
