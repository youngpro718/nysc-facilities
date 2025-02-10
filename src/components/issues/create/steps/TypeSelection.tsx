
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Thermometer, Droplet, Zap, Wrench } from "lucide-react";
import type { FormData } from "../../types/IssueTypes";

interface TypeSelectionProps {
  form: UseFormReturn<FormData>;
}

const issueTypes = [
  {
    type: "CLIMATE_CONTROL" as const,
    icon: <Thermometer className="h-12 w-12" />,
    label: "Climate Control",
    description: "Temperature or ventilation issues"
  },
  {
    type: "LEAK" as const,
    icon: <Droplet className="h-12 w-12" />,
    label: "Water Leak",
    description: "Water leak or plumbing issues"
  },
  {
    type: "ELECTRICAL_NEEDS" as const,
    icon: <Zap className="h-12 w-12" />,
    label: "Electrical",
    description: "Electrical or power issues"
  },
  {
    type: "GENERAL_REQUESTS" as const,
    icon: <Wrench className="h-12 w-12" />,
    label: "General Request",
    description: "Other maintenance or facility issues"
  }
];

export function TypeSelection({ form }: TypeSelectionProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        {issueTypes.map((type) => (
          <Card
            key={type.type}
            className={`p-6 cursor-pointer hover:border-primary transition-colors ${
              form.watch("type") === type.type ? "border-2 border-primary bg-primary/5" : "border border-white/10"
            }`}
            onClick={() => form.setValue("type", type.type)}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="text-primary">{type.icon}</div>
              <div className="text-center">
                <h3 className="font-medium text-lg">{type.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <FormField
        control={form.control}
        name="priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-lg font-medium">Priority Level</FormLabel>
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
    </div>
  );
}
