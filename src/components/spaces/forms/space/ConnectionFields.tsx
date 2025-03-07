
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";

interface ConnectionFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
}

export function ConnectionFields({ form, floorId }: ConnectionFieldsProps) {
  const [newConnection, setNewConnection] = useState({
    toSpaceId: "",
    connectionType: "",
    direction: ""
  });
  
  const spaceType = form.watch("type");
  const isHallway = spaceType === 'hallway';

  const { data: spaces } = useQuery({
    queryKey: ["floor-spaces", floorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("new_spaces")
        .select("id, name, type")
        .eq("floor_id", floorId)
        .eq("status", "active");

      if (error) throw error;
      return data || [];
    },
    enabled: !!floorId
  });
  
  // Get selected space type
  const selectedSpace = spaces?.find(space => space.id === newConnection.toSpaceId);
  const selectedSpaceType = selectedSpace?.type;
  const isSelectedSpaceHallway = selectedSpaceType === 'hallway';

  const handleAddConnection = () => {
    if (!newConnection.toSpaceId || !newConnection.connectionType) {
      toast.error("Please select a space and connection type");
      return;
    }

    const currentConnections = form.getValues("connections") || [];
    form.setValue("connections", [...currentConnections, newConnection], { shouldValidate: true });
    
    setNewConnection({
      toSpaceId: "",
      connectionType: "",
      direction: ""
    });
    
    toast.success("Connection added");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Add Connection (Optional)</h3>
      
      <div className="space-y-3">
        <Select
          value={newConnection.toSpaceId}
          onValueChange={(value) => setNewConnection({...newConnection, toSpaceId: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select space to connect to" />
          </SelectTrigger>
          <SelectContent>
            {spaces?.map((space) => (
              <SelectItem key={space.id} value={space.id}>
                {space.name} ({space.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={newConnection.connectionType}
          onValueChange={(value) => setNewConnection({...newConnection, connectionType: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select connection type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="door">Door</SelectItem>
            <SelectItem value="direct">Direct</SelectItem>
            <SelectItem value="secured">Secured</SelectItem>
            {(isHallway && isSelectedSpaceHallway) && (
              <SelectItem value="transition">Transition Door</SelectItem>
            )}
          </SelectContent>
        </Select>

        {isSelectedSpaceHallway && (
          <Select
            value={newConnection.direction}
            onValueChange={(value) => setNewConnection({...newConnection, direction: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select hallway position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">Start of Hallway</SelectItem>
              <SelectItem value="center">Middle of Hallway</SelectItem>
              <SelectItem value="end">End of Hallway</SelectItem>
              <SelectItem value="right">Right Side of Hallway</SelectItem>
              <SelectItem value="left">Left Side of Hallway</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleAddConnection}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </div>
    </div>
  );
}
