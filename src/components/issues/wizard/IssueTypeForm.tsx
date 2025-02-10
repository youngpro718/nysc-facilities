
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/IssueTypes";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TemplateFields } from "../form/sections/TemplateFields";
import { Thermometer, Droplet, Zap, Construction, Brush, Wrench, LucideIcon } from "lucide-react";

interface IssueTypeFormProps {
  form: UseFormReturn<FormData>;
}

interface IssueTemplate {
  type: string;
  subcategory: string;
  required_fields: Record<string, any>;
  optional_fields: Record<string, any>;
  default_priority: string;
  default_assigned_to: "DCAS" | "OCA" | "Self" | "Outside_Vendor";
  icon_name: string;
  photos_required: boolean;
  min_photos: number;
  max_photos: number;
}

const iconMap: Record<string, LucideIcon> = {
  thermometer: Thermometer,
  droplet: Droplet,
  zap: Zap,
  construction: Construction,
  brush: Brush,
  wrench: Wrench,
};

export function IssueTypeForm({ form }: IssueTypeFormProps) {
  const [templates, setTemplates] = useState<IssueTemplate[]>([]);
  const [subcategories, setSubcategories] = useState<{ value: string, label: string }[]>([]);
  const selectedCategory = form.watch("type");

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from('issue_type_templates')
        .select('*')
        .order('template_order', { ascending: true });

      if (error) {
        console.error('Error fetching templates:', error);
        return;
      }

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
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedCategory && templates.length > 0) {
      const categoryTemplates = templates.filter(t => t.type === selectedCategory);
      const subcats = categoryTemplates.map(template => ({
        value: template.subcategory,
        label: template.subcategory
      }));
      setSubcategories(subcats);
    }
  }, [selectedCategory, templates]);

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
      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => {
          const Icon = iconMap[template.icon_name];
          return (
            <button
              key={`${template.type}-${template.subcategory}`}
              type="button"
              onClick={() => {
                form.setValue("type", template.type);
                form.setValue("template_fields.problem", template.subcategory);
              }}
              className={`flex flex-col items-center justify-center p-6 space-y-3 rounded-lg border-2 
                ${form.watch("type") === template.type ? 
                  "border-primary bg-primary/10" : 
                  "border-muted hover:border-primary transition-colors"}`}
            >
              {Icon && (
                <div className="text-primary">
                  <Icon className="h-12 w-12" />
                </div>
              )}
              <span className="text-sm font-medium text-center">
                {template.subcategory}
              </span>
            </button>
          );
        })}
      </div>

      {selectedCategory && subcategories.length > 0 && (
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
      )}

      <TemplateFields form={form} selectedType={selectedCategory} />
    </div>
  );
}
