
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Lightbulb } from "lucide-react";

interface AssignFixtureDialogProps {
  roomId: string;
  onAssignmentComplete?: () => void;
}

export function AssignFixtureDialog({ roomId, onAssignmentComplete }: AssignFixtureDialogProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<string>("ceiling");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current room details
  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('name, room_number')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  // Get next available sequence number for the selected position
  const { data: nextSequence = 1 } = useQuery({
    queryKey: ['next-sequence', roomId, position],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spatial_assignments')
        .select('sequence_number')
        .eq('space_id', roomId)
        .eq('position', position)
        .order('sequence_number', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data.length > 0 ? data[0].sequence_number + 1 : 1;
    },
    enabled: !!roomId && !!position
  });

  // Preview the generated name
  const generatedName = room ? 
    `Room ${room.room_number} - ${position.charAt(0).toUpperCase() + position.slice(1)} Light${nextSequence > 1 ? ' ' + nextSequence : ''}` : 
    '';

  const assignFixture = useMutation({
    mutationFn: async () => {
      // First create the fixture
      const { data: fixture, error: fixtureError } = await supabase
        .from('lighting_fixtures')
        .insert({
          name: generatedName,
          type: "standard",
          technology: "LED",
          status: "functional",
          bulb_count: 1,
          electrical_issues: {
            short_circuit: false,
            wiring_issues: false,
            voltage_problems: false
          },
          ballast_issue: false,
          emergency_circuit: false
        })
        .select()
        .single();

      if (fixtureError) throw fixtureError;

      // Then create the spatial assignment
      const { error: assignmentError } = await supabase
        .from('spatial_assignments')
        .insert({
          fixture_id: fixture.id,
          space_id: roomId,
          space_type: 'room',
          position: position,
          sequence_number: nextSequence
        });

      if (assignmentError) throw assignmentError;

      return fixture;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Fixture has been assigned to the room",
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['room-lighting', roomId] });
      onAssignmentComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to assign fixture. Please try again.",
        variant: "destructive",
      });
      console.error('Error assigning fixture:', error);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Lightbulb className="h-4 w-4" />
          Assign Fixture
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Lighting Fixture</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Position</label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ceiling">Ceiling</SelectItem>
                <SelectItem value="wall">Wall</SelectItem>
                <SelectItem value="floor">Floor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {generatedName && (
            <div className="text-sm text-muted-foreground">
              Fixture will be named: <span className="font-medium">{generatedName}</span>
            </div>
          )}

          <Button 
            onClick={() => assignFixture.mutate()}
            disabled={assignFixture.isPending}
            className="w-full"
          >
            {assignFixture.isPending ? "Assigning..." : "Assign Fixture"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
