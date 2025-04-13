import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface AssignKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedKeyId?: string;
  preselectedOccupantId?: string;
}

export function AssignKeyDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedKeyId,
  preselectedOccupantId,
}: AssignKeyDialogProps) {
  const [selectedKeyId, setSelectedKeyId] = useState<string>(preselectedKeyId || "");
  const [selectedOccupantId, setSelectedOccupantId] = useState<string>(preselectedOccupantId || "");
  const [isSpare, setIsSpare] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedKeyId(preselectedKeyId || "");
      setSelectedOccupantId(preselectedOccupantId || "");
      setIsSpare(false);
    }
  }, [open, preselectedKeyId, preselectedOccupantId]);

  // Fetch available keys
  const { data: availableKeys, isLoading: keysLoading } = useQuery({
    queryKey: ["available-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keys")
        .select("id, name, type, available_quantity, key_scope, location_data")
        .gt("available_quantity", 0)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch occupants
  const { data: occupants, isLoading: occupantsLoading } = useQuery({
    queryKey: ["occupants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupants")
        .select("id, first_name, last_name, department")
        .order("last_name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleSubmit = async () => {
    if (!selectedKeyId || !selectedOccupantId) {
      toast.error("Please select both a key and an occupant");
      return;
    }

    setIsSubmitting(true);

    try {
      // First check if the occupant already has this key assigned
      const { data: existingAssignments, error: checkError } = await supabase
        .from("key_assignments")
        .select("id, is_spare")
        .eq("key_id", selectedKeyId)
        .eq("occupant_id", selectedOccupantId)
        .is("returned_at", null);

      if (checkError) throw checkError;

      // If assigning a primary key, check if they already have one
      if (!isSpare && existingAssignments?.some(a => !a.is_spare)) {
        toast.error("This occupant already has a primary key assigned");
        return;
      }

      // Create the assignment
      const { error: assignmentError } = await supabase
        .from("key_assignments")
        .insert({
          key_id: selectedKeyId,
          occupant_id: selectedOccupantId,
          assigned_at: new Date().toISOString(),
          is_spare: isSpare,
          spare_key_reason: isSpare ? "additional_access" : null
        });

      if (assignmentError) throw assignmentError;

      // Update the available quantity
      const { data: key, error: keyError } = await supabase
        .from("keys")
        .select("available_quantity")
        .eq("id", selectedKeyId)
        .single();

      if (keyError) throw keyError;

      const { error: updateError } = await supabase
        .from("keys")
        .update({
          available_quantity: Math.max(0, (key.available_quantity || 1) - 1)
        })
        .eq("id", selectedKeyId);

      if (updateError) throw updateError;

      // Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["keys"] }),
        queryClient.invalidateQueries({ queryKey: ["available-keys"] }),
        queryClient.invalidateQueries({ queryKey: ["active-key-assignments"] }),
        queryClient.invalidateQueries({ queryKey: ["keyAssignments"] }),
        queryClient.invalidateQueries({ queryKey: ["occupant-keys"] }),
        queryClient.invalidateQueries({ queryKey: ["keys-stats"] })
      ]);

      toast.success("Key assigned successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error assigning key:", error);
      toast.error(error.message || "Failed to assign key");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get key details for display
  const selectedKey = availableKeys?.find(k => k.id === selectedKeyId);
  const selectedOccupant = occupants?.find(o => o.id === selectedOccupantId);

  // Format location data for display
  const getKeyLocation = (key: any) => {
    if (!key?.location_data) return "No location data";
    
    const { building_id, floor_id, room_id, door_id } = key.location_data;
    
    if (key.is_passkey) return "Passkey (Multiple locations)";
    
    const parts = [];
    if (building_id) parts.push("Building");
    if (floor_id) parts.push("Floor");
    if (room_id) parts.push("Room");
    if (door_id) parts.push("Door");
    
    return parts.length > 0 ? parts.join(" > ") : "No specific location";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Key to Occupant</DialogTitle>
          <DialogDescription>
            Select a key and an occupant to create a new assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="key">Key</Label>
            <Select
              value={selectedKeyId}
              onValueChange={setSelectedKeyId}
              disabled={keysLoading || isSubmitting}
            >
              <SelectTrigger id="key">
                <SelectValue placeholder="Select a key" />
              </SelectTrigger>
              <SelectContent>
                {keysLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading keys...</span>
                  </div>
                ) : availableKeys?.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No available keys found
                  </div>
                ) : (
                  availableKeys?.map((key) => (
                    <SelectItem key={key.id} value={key.id}>
                      {key.name} ({key.available_quantity} available)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedKey && (
              <p className="text-xs text-muted-foreground">
                Type: {selectedKey.type} | Location: {getKeyLocation(selectedKey)}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="occupant">Occupant</Label>
            <Select
              value={selectedOccupantId}
              onValueChange={setSelectedOccupantId}
              disabled={occupantsLoading || isSubmitting}
            >
              <SelectTrigger id="occupant">
                <SelectValue placeholder="Select an occupant" />
              </SelectTrigger>
              <SelectContent>
                {occupantsLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading occupants...</span>
                  </div>
                ) : occupants?.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No occupants found
                  </div>
                ) : (
                  occupants?.map((occupant) => (
                    <SelectItem key={occupant.id} value={occupant.id}>
                      {occupant.first_name} {occupant.last_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedOccupant && (
              <p className="text-xs text-muted-foreground">
                Department: {selectedOccupant.department || "Not specified"}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isSpare"
              checked={isSpare}
              onCheckedChange={(checked) => setIsSpare(checked as boolean)}
              disabled={isSubmitting}
            />
            <Label
              htmlFor="isSpare"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Assign as spare key
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedKeyId || !selectedOccupantId}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Key"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssignKeyDialog;
