
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FormData {
  title: string;
  description: string;
  issue_type: string;
  priority: 'low' | 'medium' | 'high';
  building_id?: string;
  floor_id?: string;
  room_id?: string;
}

interface CreateIssueFormProps {
  onSuccess?: () => void;
}

export function CreateIssueForm({ onSuccess }: CreateIssueFormProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      priority: 'medium'
    }
  });

  // Fetch buildings
  const { data: buildings } = useQuery({
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
  const { data: floors } = useQuery({
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
  const { data: rooms } = useQuery({
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
      const { error } = await supabase
        .from('issues')
        .insert([{
          title: data.title,
          description: data.description,
          issue_type: data.issue_type,
          priority: data.priority,
          building_id: data.building_id,
          floor_id: data.floor_id,
          room_id: data.room_id,
          status: 'open'
        }]);

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
                  <Input {...field} placeholder="Issue title" />
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
                  <Textarea {...field} placeholder="Describe the issue" />
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
                    <SelectTrigger>
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
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select building" />
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
                  value={field.value}
                  disabled={!selectedBuilding}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
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
                  value={field.value}
                  disabled={!selectedFloor}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
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
            Create Issue
          </Button>
        </form>
      </Form>
    </Card>
  );
}
