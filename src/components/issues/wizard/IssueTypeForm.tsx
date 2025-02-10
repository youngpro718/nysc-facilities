
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/IssueTypes";

interface IssueTypeFormProps {
  form: UseFormReturn<FormData>;
}

const issueCategories = [
  { value: "LIGHTING", label: "Lighting" },
  { value: "GENERAL_REQUESTS", label: "General Requests" },
  { value: "PLUMBING_NEEDS", label: "Plumbing" },
  { value: "ELECTRICAL_NEEDS", label: "Electrical" },
  { value: "CLIMATE_CONTROL", label: "Climate Control" }
];

const problemsByCategory: Record<string, Array<{ value: string, label: string }>> = {
  LIGHTING: [
    { value: "LIGHTING", label: "Light Out" },
    { value: "LIGHTING", label: "Flickering Light" },
    { value: "LIGHTING", label: "Emergency Light Issue" },
    { value: "LIGHTING", label: "Motion Sensor Problem" }
  ],
  GENERAL_REQUESTS: [
    { value: "GENERAL_REQUESTS", label: "General Maintenance" },
    { value: "GENERAL_REQUESTS", label: "Cleaning Request" }
  ],
  PLUMBING_NEEDS: [
    { value: "PLUMBING_NEEDS", label: "Water Leak" },
    { value: "PLUMBING_NEEDS", label: "Clogged Drain" }
  ],
  ELECTRICAL_NEEDS: [
    { value: "ELECTRICAL_NEEDS", label: "Power Outage" },
    { value: "ELECTRICAL_NEEDS", label: "Faulty Outlet" }
  ],
  CLIMATE_CONTROL: [
    { value: "CLIMATE_CONTROL", label: "Temperature Issue" },
    { value: "CLIMATE_CONTROL", label: "Ventilation Problem" }
  ]
};

export function IssueTypeForm({ form }: IssueTypeFormProps) {
  const selectedCategory = form.watch("type");

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

      {selectedCategory && (
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
                    {problemsByCategory[selectedCategory]?.map((problem) => (
                      <SelectItem 
                        key={problem.label} 
                        value={problem.label}
                        className="text-base"
                      >
                        {problem.label}
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
            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
