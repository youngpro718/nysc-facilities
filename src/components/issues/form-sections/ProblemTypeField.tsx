
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROBLEM_TYPES } from "../constants/issueTypes";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";

interface ProblemTypeFieldProps {
  form: UseFormReturn<FormData>;
}

export function ProblemTypeField({ form }: ProblemTypeFieldProps) {
  const issueType = form.watch('issue_type');

  if (!issueType) return null;

  return (
    <FormField
      control={form.control}
      name="problem_type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Problem Type</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select problem type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {PROBLEM_TYPES[issueType]?.map((type) => (
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
