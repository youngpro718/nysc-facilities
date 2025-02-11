
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useIssueTemplate } from "../hooks/useIssueTemplate";
import type { FormData } from "../types/IssueTypes";
import { LucideIcon } from "lucide-react";
import * as icons from "lucide-react";

interface IssueTypeFormProps {
  form: UseFormReturn<FormData>;
}

export function IssueTypeForm({ form }: IssueTypeFormProps) {
  const { templates, isLoading } = useIssueTemplate();
  const selectedType = form.watch("type");
  const selectedTemplate = templates?.find(t => t.type === selectedType);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {templates?.map((template) => {
          // Dynamically get icon from lucide-react
          const IconComponent = icons[template.icon_name as keyof typeof icons] as LucideIcon;

          return (
            <Card
              key={template.type}
              className={`p-6 cursor-pointer hover:border-primary transition-colors ${
                form.watch("type") === template.type ? 
                  "border-2 border-primary bg-primary/5" : 
                  "border border-white/10"
              }`}
              onClick={() => {
                form.setValue("type", template.type);
                form.setValue("priority", template.default_priority);
              }}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="text-primary">
                  {IconComponent && <IconComponent className="h-12 w-12" />}
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-lg">{template.subcategory}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select for {template.subcategory.toLowerCase()} related issues
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedTemplate && (
        <>
          <FormField
            control={form.control}
            name="template_fields.problem_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Problem Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 text-base bg-background/50 border-white/10">
                      <SelectValue placeholder="Select the specific problem" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedTemplate.problem_types.map((type) => (
                      <SelectItem key={type} value={type} className="text-base">
                        {type}
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
        </>
      )}
    </div>
  );
}
