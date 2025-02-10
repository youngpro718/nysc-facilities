
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/IssueTypes";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IssueTypeFormProps {
  form: UseFormReturn<FormData>;
}

export function IssueTypeForm({ form }: IssueTypeFormProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">Issue Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-12 text-base bg-background/50 border-white/10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  <SelectItem value="HVAC" className="text-base">HVAC</SelectItem>
                  <SelectItem value="Leak" className="text-base">Leak</SelectItem>
                  <SelectItem value="Electrical" className="text-base">Electrical</SelectItem>
                  <SelectItem value="Plaster" className="text-base">Plaster</SelectItem>
                  <SelectItem value="Cleaning" className="text-base">Cleaning</SelectItem>
                  <SelectItem value="Other" className="text-base">Other</SelectItem>
                </ScrollArea>
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
