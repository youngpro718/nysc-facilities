import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Layers } from "lucide-react";

interface AssignZoneDialogProps {
  selectedFixtures: string[];
  onComplete: () => void;
}

export function AssignZoneDialog({ selectedFixtures, onComplete }: AssignZoneDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: zones } = useQuery({
    queryKey: ['lighting_zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_zones')
        .select('id, name, type')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleAssign = async () => {
    if (!selectedZone) {
      toast.error("Please select a zone");
      return;
    }

    try {
      const { error } = await supabase
        .from('lighting_fixtures')
        .update({ zone_id: selectedZone })
        .in('id', selectedFixtures);

      if (error) throw error;

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['lighting_zones'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-stats'] });

      toast.success("Fixtures assigned to zone successfully");
      onComplete();
      setOpen(false);
    } catch (error: any) {
      console.error('Error assigning fixtures to zone:', error);
      toast.error(error.message || "Failed to assign fixtures to zone");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Layers className="h-4 w-4 mr-2" />
          Assign to Zone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Fixtures to Zone</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select onValueChange={setSelectedZone} value={selectedZone}>
            <SelectTrigger>
              <SelectValue placeholder="Select zone" />
            </SelectTrigger>
            <SelectContent>
              {zones?.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name} ({zone.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex justify-end">
            <Button onClick={handleAssign}>
              Assign {selectedFixtures.length} Fixture{selectedFixtures.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 