
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/IssueTypes";

interface IssueDetailsFormProps {
  form: UseFormReturn<FormData>;
}

export function IssueDetailsForm({ form }: IssueDetailsFormProps) {
  return (
    <ScrollArea className="h-[calc(100vh-12rem)] px-4">
      <div className="space-y-4 pr-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Title</FormLabel>
              <FormControl>
                <Input {...field} className="h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Description</FormLabel>
              <FormControl>
                <Textarea {...field} className="min-h-[120px] text-base leading-relaxed" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </ScrollArea>
  );
}
