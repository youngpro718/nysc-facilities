import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import type { OccupantFormData } from "../schemas/occupantSchema";

interface KeyAssignmentFieldProps {
  form: UseFormReturn<OccupantFormData>;
}

export function KeyAssignmentField({ form }: KeyAssignmentFieldProps) {
  const { data: availableKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ["available-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keys")
        .select("*")
        .eq("status", "available");

      if (error) throw error;
      return data;
    },
  });

  const handleKeyAdd = (keyId: string) => {
    const currentKeys = form.getValues("keys");
    if (!currentKeys.includes(keyId)) {
      form.setValue("keys", [...currentKeys, keyId]);
    }
  };

  const handleKeyRemove = (keyId: string) => {
    const currentKeys = form.getValues("keys");
    form.setValue("keys", currentKeys.filter(id => id !== keyId));
  };

  return (
    <FormField
      control={form.control}
      name="keys"
      render={() => (
        <FormItem>
          <FormLabel>Key Assignments</FormLabel>
          <Select
            onValueChange={handleKeyAdd}
            disabled={isLoadingKeys}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingKeys ? "Loading keys..." : "Select keys to assign"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableKeys?.map((key) => (
                <SelectItem key={key.id} value={key.id}>
                  {key.name} {key.is_passkey && "(Passkey)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2 mt-2">
            {form.getValues("keys").map((keyId) => {
              const key = availableKeys?.find(k => k.id === keyId);
              return (
                <Badge key={keyId} variant="secondary" className="flex items-center gap-1">
                  {key?.name}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleKeyRemove(keyId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}