
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";

interface SimpleConnectionFieldProps {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
}

export function SimpleConnectionField({ form, floorId }: SimpleConnectionFieldProps) {
  const [selectedSpace, setSelectedSpace] = useState("");
  const [connectionType, setConnectionType] = useState<"door" | "direct" | "hallway" | "">("");

  const { data: availableSpaces } = useQuery({
    queryKey: ["floor-spaces", floorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("new_spaces")
        .select("id, name, type")
        .eq("floor_id", floorId)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!floorId
  });

  const currentConnections = form.watch("connections") || [];

  const addConnection = () => {
    if (!selectedSpace || !connectionType) return;

    const newConnection = {
      toSpaceId: selectedSpace,
      connectionType: connectionType as "door" | "direct" | "hallway",
      direction: "adjacent" as const
    };

    form.setValue("connections", [...currentConnections, newConnection]);
    setSelectedSpace("");
    setConnectionType("");
  };

  const removeConnection = (index: number) => {
    const updatedConnections = currentConnections.filter((_, i) => i !== index);
    form.setValue("connections", updatedConnections);
  };

  return (
    <div className="space-y-4">
      <FormLabel>Connected Spaces (Optional)</FormLabel>
      
      {/* Show existing connections */}
      {currentConnections.length > 0 && (
        <div className="space-y-2">
          {currentConnections.map((connection, index) => {
            const space = availableSpaces?.find(s => s.id === connection.toSpaceId);
            return (
              <Badge key={index} variant="secondary" className="flex items-center gap-2 w-fit">
                {space?.name} ({connection.connectionType})
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0"
                  onClick={() => removeConnection(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Add new connection */}
      <div className="flex gap-2">
        <Select value={selectedSpace} onValueChange={setSelectedSpace}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select space" />
          </SelectTrigger>
          <SelectContent>
            {availableSpaces?.map((space) => (
              <SelectItem key={space.id} value={space.id}>
                {space.name} ({space.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={connectionType} onValueChange={(value) => setConnectionType(value as "door" | "direct" | "hallway")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="door">Door</SelectItem>
            <SelectItem value="direct">Direct</SelectItem>
            <SelectItem value="hallway">Hallway</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addConnection}
          disabled={!selectedSpace || !connectionType}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
