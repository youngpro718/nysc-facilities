
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../../types/IssueTypes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TemplateFieldsProps {
  form: UseFormReturn<FormData>;
  selectedType?: string;
}

interface TemplateField {
  name: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  label: string;
  options?: string[];
}

export function TemplateFields({ form, selectedType }: TemplateFieldsProps) {
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);

  useEffect(() => {
    async function fetchTemplateFields() {
      if (!selectedType) return;

      const { data: template, error } = await supabase
        .from('issue_type_templates')
        .select('*')
        .eq('type', selectedType)
        .single();

      if (error) {
        console.error('Error fetching template:', error);
        return;
      }

      if (template) {
        const requiredFields = Object.entries(template.required_fields || {}).map(([key, value]) => ({
          name: key,
          ...value as any,
          required: true
        }));
        
        const optionalFields = Object.entries(template.optional_fields || {}).map(([key, value]) => ({
          name: key,
          ...value as any,
          required: false
        }));

        setTemplateFields([...requiredFields, ...optionalFields]);
      }
    }

    fetchTemplateFields();
  }, [selectedType]);

  if (!templateFields.length) return null;

  return (
    <div className="space-y-6">
      {templateFields.map((field) => (
        <FormField
          key={field.name}
          control={form.control}
          name={`template_fields.${field.name}`}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </FormLabel>
              <FormControl>
                {field.type === 'select' && field.options ? (
                  <Select
                    value={formField.value}
                    onValueChange={formField.onChange}
                  >
                    <SelectTrigger className="h-12 text-base bg-background/50 border-white/10">
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option} className="text-base">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    {...formField}
                    type={field.type === 'number' ? 'number' : 'text'}
                    className="h-12 text-base bg-background/50 border-white/10"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
