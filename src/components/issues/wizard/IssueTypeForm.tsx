
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/IssueTypes";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface IssueTypeFormProps {
  form: UseFormReturn<FormData>;
}

interface IssueTemplate {
  type: string;
  subcategory: string;
  required_fields: Record<string, boolean>;
  optional_fields: Record<string, boolean>;
  default_priority: string;
  default_assigned_to: "DCAS" | "OCA" | "Self" | "Outside_Vendor";
}

const issueCategories = [
  { value: "ACCESS_REQUEST", label: "Access Request" },
  { value: "BUILDING_SYSTEMS", label: "Building Systems" },
  { value: "CEILING", label: "Ceiling" },
  { value: "CLEANING_REQUEST", label: "Cleaning Request" },
  { value: "CLIMATE_CONTROL", label: "Climate Control" },
  { value: "DOOR", label: "Door" },
  { value: "ELECTRICAL_NEEDS", label: "Electrical" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "EXTERIOR_FACADE", label: "Exterior/Facade" },
  { value: "FLAGPOLE_FLAG", label: "Flagpole/Flag" },
  { value: "FLOORING", label: "Flooring" },
  { value: "GENERAL_REQUESTS", label: "General Requests" },
  { value: "LEAK", label: "Leak" },
  { value: "LIGHTING", label: "Lighting" },
  { value: "LOCK", label: "Lock" },
  { value: "PLUMBING_NEEDS", label: "Plumbing" },
  { value: "RESTROOM_REPAIR", label: "Restroom Repair" },
  { value: "SIGNAGE", label: "Signage" },
  { value: "WINDOW", label: "Window" }
];

export function IssueTypeForm({ form }: IssueTypeFormProps) {
  const [subcategories, setSubcategories] = useState<{ value: string, label: string }[]>([]);
  const [templates, setTemplates] = useState<IssueTemplate[]>([]);
  const selectedCategory = form.watch("type");

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from('issue_type_templates')
        .select('*')
        .eq('type', selectedCategory);

      if (error) {
        console.error('Error fetching templates:', error);
        return;
      }

      // Transform the data to match our IssueTemplate interface
      const transformedData = data.map(template => ({
        ...template,
        required_fields: typeof template.required_fields === 'string' 
          ? JSON.parse(template.required_fields)
          : template.required_fields,
        optional_fields: typeof template.optional_fields === 'string'
          ? JSON.parse(template.optional_fields)
          : template.optional_fields,
        default_assigned_to: template.default_assigned_to as "DCAS" | "OCA" | "Self" | "Outside_Vendor"
      }));

      setTemplates(transformedData);
      const subcats = transformedData.map(template => ({
        value: template.subcategory,
        label: template.subcategory
      }));
      setSubcategories(subcats);
    };

    if (selectedCategory) {
      fetchTemplates();
    }
  }, [selectedCategory]);

  // Update default values when template is selected
  useEffect(() => {
    const selectedSubcategory = form.watch("template_fields.problem");
    const template = templates.find(t => t.subcategory === selectedSubcategory);
    
    if (template) {
      form.setValue("priority", template.default_priority);
      form.setValue("assigned_to", template.default_assigned_to);
    }
  }, [form.watch("template_fields.problem"), templates, form]);

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">Issue Category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-12 text-base bg-background/50 border-white/10">
                  <SelectValue placeholder="Select issue category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <ScrollArea className="h-[300px]">
                  {issueCategories.map((category) => (
                    <SelectItem 
                      key={category.value} 
                      value={category.value}
                      className="text-base"
                    >
                      {category.label}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedCategory && subcategories.length > 0 && (
        <FormField
          control={form.control}
          name="template_fields.problem"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Problem Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-12 text-base bg-background/50 border-white/10">
                    <SelectValue placeholder="Select specific problem" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <ScrollArea className="h-[300px]">
                    {subcategories.map((subcategory) => (
                      <SelectItem 
                        key={subcategory.value} 
                        value={subcategory.value}
                        className="text-base"
                      >
                        {subcategory.label}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      <FormField
        control={form.control}
        name="priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">Priority Level</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-12 text-base bg-background/50 border-white/10">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="low" className="text-base">Low Priority</SelectItem>
                <SelectItem value="medium" className="text-base">Medium Priority</SelectItem>
                <SelectItem value="high" className="text-base">High Priority</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="assigned_to"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">Assign To</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-12 text-base bg-background/50 border-white/10">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="DCAS" className="text-base">DCAS</SelectItem>
                <SelectItem value="OCA" className="text-base">OCA</SelectItem>
                <SelectItem value="Self" className="text-base">Self</SelectItem>
                <SelectItem value="Outside_Vendor" className="text-base">Outside Vendor</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
