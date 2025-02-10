
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
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-medium">Title</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                className="h-12 text-base bg-background/50 border-white/10" 
                placeholder="Enter issue title"
              />
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
            <FormLabel className="text-base font-medium">Description</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                className="min-h-[120px] text-base leading-relaxed bg-background/50 border-white/10" 
                placeholder="Describe the issue in detail"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
