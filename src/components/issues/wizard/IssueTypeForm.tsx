
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import type { FormData } from "../types/IssueTypes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface IssueTypeFormProps {
  form: UseFormReturn<FormData>;
}

export function IssueTypeForm({ form }: IssueTypeFormProps) {
  const { data: templates } = useQuery({
    queryKey: ['issue-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issue_type_templates')
        .select('*')
        .order('template_order');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates?.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "p-4 cursor-pointer hover:border-primary transition-colors",
              form.watch("type") === template.type && "border-2 border-primary bg-primary/5"
            )}
            onClick={() => {
              form.setValue("type", template.type);
              form.setValue("priority", template.default_priority || "medium");
            }}
          >
            <div className="text-center">
              <h3 className="font-medium">{template.subcategory}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {template.subcategory ? `Select for ${template.subcategory.toLowerCase()} related issues` : 'General issues'}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <FormField
        control={form.control}
        name="priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Priority</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
