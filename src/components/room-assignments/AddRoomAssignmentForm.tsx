import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddRoomAssignmentFormProps {
  occupantId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddRoomAssignmentForm({
  occupantId,
  onSuccess,
  onCancel,
}: AddRoomAssignmentFormProps) {
  const [selectedRoom, setSelectedRoom] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [schedule, setSchedule] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available rooms
  const { data: rooms } = useQuery({
    queryKey: ["rooms-for-assignment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id, 
          room_number, 
          name,
          floors (
            name,
            buildings (
              name
            )
          )
        `)
        .eq("status", "active")
        .order("room_number");

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async () => {
    if (!selectedRoom || !assignmentType) {
      toast.error("Please select a room and assignment type");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("occupant_room_assignments")
        .insert({
          occupant_id: occupantId,
          room_id: selectedRoom,
          assignment_type: assignmentType,
          is_primary: isPrimary,
          assigned_at: new Date().toISOString(),
          schedule: schedule.trim() || null,
          notes: notes.trim() || null,
        });

      if (error) throw error;

      toast.success("Room assignment created successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to create assignment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Room Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Room</Label>
          <Select value={selectedRoom} onValueChange={setSelectedRoom}>
            <SelectTrigger>
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {rooms?.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.room_number} - {room.name}
                  {room.floors && (
                    <span className="text-muted-foreground">
                      {" "} ({room.floors.buildings?.name}, {room.floors.name})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Assignment Type</Label>
          <Select value={assignmentType} onValueChange={setAssignmentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select assignment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary_office">Primary Office</SelectItem>
              <SelectItem value="secondary_office">Secondary Office</SelectItem>
              <SelectItem value="storage">Storage</SelectItem>
              <SelectItem value="shared_workspace">Shared Workspace</SelectItem>
              <SelectItem value="temporary">Temporary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            checked={isPrimary}
            onCheckedChange={(checked) => setIsPrimary(checked === true)}
          />
          <Label>Make this a primary assignment</Label>
        </div>

        <div className="space-y-2">
          <Label>Schedule (Optional)</Label>
          <Input
            placeholder="e.g., Mon-Fri 9AM-5PM"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Notes (Optional)</Label>
          <Textarea
            placeholder="Additional notes about the assignment"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Assignment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}