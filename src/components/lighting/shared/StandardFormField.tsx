import { ReactNode } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { UseFormReturn, FieldPath, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

interface StandardFormFieldProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  helpText?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  required?: boolean;
}

export function StandardFormField<T extends FieldValues>({
  form,
  name,
  label,
  description,
  helpText,
  icon,
  children,
  className,
  required = false
}: StandardFormFieldProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={cn("space-y-2", className)}>
          <FormLabel className={cn(
            "flex items-center gap-2 text-sm font-medium",
            fieldState.error && "text-destructive",
            required && "after:content-['*'] after:text-destructive after:ml-1"
          )}>
            {icon}
            {label}
          </FormLabel>
          
          {description && (
            <FormDescription className="text-xs text-muted-foreground">
              {description}
            </FormDescription>
          )}
          
          <FormControl>
            {children}
          </FormControl>
          
          {helpText && !fieldState.error && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              💡 {helpText}
            </div>
          )}
          
          <FormMessage />
        </FormItem>
      )}
    />
  );
}