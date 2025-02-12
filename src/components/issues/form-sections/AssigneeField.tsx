
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AssigneeFieldProps {
  form: UseFormReturn<FormData>;
}

export function AssigneeField({ form }: AssigneeFieldProps) {
  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <FormField
      control={form.control}
      name="assignee_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Assignee</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {profiles?.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.first_name} {profile.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
