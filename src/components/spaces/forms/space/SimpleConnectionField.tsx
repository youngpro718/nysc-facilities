
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";

interface SimpleConnectionFieldProps {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
}

export function SimpleConnectionField({ form, floorId }: SimpleConnectionFieldProps) {
  return (
    <div className="space-y-4">
      <FormLabel>Connected Spaces (Optional)</FormLabel>
      <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
        Space connections feature is currently disabled.
      </div>
    </div>
  );
}
