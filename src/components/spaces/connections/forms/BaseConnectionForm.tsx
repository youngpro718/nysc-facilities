import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export interface BaseFormFieldProps {
  label: string;
  name: string;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  form: unknown;
}

export const BaseFormField = ({ label, name, placeholder, options, disabled, form }: BaseFormFieldProps) => (
  <FormField
    control={form.control}
    name={name}
    render={({ field }) => (
      <FormItem className="space-y-1.5">
        <FormLabel className="text-sm font-medium">{label}</FormLabel>
        <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
          <FormControl>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="cursor-pointer hover:bg-accent"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage className="text-xs" />
      </FormItem>
    )}
  />
);

export const SubmitButton = ({ isLoading, children }: { isLoading: boolean; children: React.ReactNode }) => (
  <Button 
    type="submit" 
    disabled={isLoading} 
    className="w-full mt-6 transition-all"
    variant="default"
  >
    {isLoading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </>
    ) : children}
  </Button>
);