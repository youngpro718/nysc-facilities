
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { IssuePhotoForm } from "./wizard/IssuePhotoForm";
import { usePhotoUpload } from "./hooks/usePhotoUpload";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type IssuePriority = 'low' | 'medium' | 'high';
type IssueType = 'Power' | 'Plumbing' | 'HVAC' | 'Door' | 'Cleaning' | 'Pest Control' | 'Other';

interface FormData {
  title: string;
  description: string;
  priority: IssuePriority;
  building_id?: string;
  floor_id?: string;
  room_id?: string;
  issue_type: IssueType;
  problem_type?: string;
}

// Define database types
interface Building {
  id: string;
  name: string;
  status: string;
}

interface Floor {
  id: string;
  name: string;
  floor_number: number;
  status: string;
}

interface Room {
  id: string;
  name: string;
  room_number: string;
  status: string;
}

const ISSUE_TYPES = [
  'Power',
  'Plumbing',
  'HVAC',
  'Door',
  'Cleaning',
  'Pest Control',
  'Other'
] as const;

export function QuickIssueForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isManualTitle, setIsManualTitle] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState<IssueType | null>(null);
  const { uploading, selectedPhotos, handlePhotoUpload, setSelectedPhotos } = usePhotoUpload();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    defaultValues: {
      priority: 'medium',
      description: '',
    }
  });

  // Fetch buildings with explicit typing
  const { data: buildings } = useQuery<Building[]>({
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

  // Fetch floors with explicit typing
  const { data: floors } = useQuery<Floor[]>({
    queryKey: ['floors', form.watch('building_id')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', form.watch('building_id'))
        .eq('status', 'active')
        .order('floor_number');
      if (error) throw error;
      return data;
    },
    enabled: !!form.watch('building_id'),
  });

  // Fetch rooms for selected floor
  const { data: rooms } = useQuery({
    queryKey: ['rooms', form.watch('floor_id')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('floor_id', form.watch('floor_id'))
        .eq('status', 'active')
        .order('room_number');
      if (error) throw error;
      return data;
    },
    enabled: !!form.watch('floor_id'),
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('issues')
        .insert({
          title: data.title,
          description: data.description,
          type: data.issue_type,
          priority: data.priority,
          status: 'open',
          building_id: data.building_id,
          floor_id: data.floor_id,
          room_id: data.room_id,
          photos: selectedPhotos,
          seen: false
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      toast.success("Issue reported successfully");
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to report issue");
    }
  });

  const generateTitle = (data: Partial<FormData>) => {
    if (!data.issue_type) return '';
    const parts = [
      data.issue_type,
      'Issue',
      data.problem_type ? `- ${data.problem_type}` : '',
      data.priority ? `- ${data.priority.toUpperCase()} Priority` : ''
    ];
    return parts.filter(Boolean).join(' ');
  };

  const onSubmit = async (data: FormData) => {
    if (!isManualTitle) {
      data.title = generateTitle(data);
    }
    createIssueMutation.mutate(data);
  };

  const handlePhotoRemove = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Watch for issue type changes to suggest priority
  const watchIssueType = form.watch('issue_type');
  if (watchIssueType && watchIssueType !== selectedIssueType) {
    setSelectedIssueType(watchIssueType);
    // Suggest priority based on issue type
    if (watchIssueType === 'HVAC' || watchIssueType === 'Power') {
      form.setValue('priority', 'high');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  {ISSUE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center space-x-2">
          <Switch
            checked={isManualTitle}
            onCheckedChange={setIsManualTitle}
            id="manual-title"
          />
          <FormLabel htmlFor="manual-title" className="cursor-pointer">
            Edit title manually
          </FormLabel>
        </div>

        {isManualTitle && (
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
        )}

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
                  form.setValue('room_id', undefined);
                }} 
                value={field.value}
                disabled={!form.watch('building_id')}
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
                disabled={!form.watch('floor_id')}
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

        <div className="space-y-4">
          <IssuePhotoForm
            selectedPhotos={selectedPhotos}
            uploading={uploading}
            onPhotoUpload={handlePhotoUpload}
            onPhotoRemove={handlePhotoRemove}
          />
          
          {selectedIssueType && !selectedPhotos.length && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Adding photos helps maintenance staff better understand and resolve the issue.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={uploading || createIssueMutation.isPending}
          className="w-full"
        >
          Submit Issue
        </Button>
      </form>
    </Form>
  );
}
