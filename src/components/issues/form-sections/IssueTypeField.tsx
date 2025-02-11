
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ISSUE_TYPES } from "../constants/issueTypes";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";

interface IssueTypeFieldProps {
  form: UseFormReturn<FormData>;
}

export function IssueTypeField({ form }: IssueTypeFieldProps) {
  return (
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
  );
}
