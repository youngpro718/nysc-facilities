
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { KeyFormData } from "../types/KeyTypes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface OccupantFieldProps {
  form: UseFormReturn<KeyFormData>;
}

export function OccupantField({ form }: OccupantFieldProps) {
  const { data: occupants } = useQuery({
    queryKey: ["occupants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupants")
        .select("*")
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <FormField
        control={form.control}
        name="occupantId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assign to Occupant (Optional)</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select occupant" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {occupants?.map((occupant) => (
                  <SelectItem key={occupant.id} value={occupant.id}>
                    {occupant.first_name} {occupant.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch("occupantId") && form.watch("quantity") > 1 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Note: Only one key will be assigned to the selected occupant
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
