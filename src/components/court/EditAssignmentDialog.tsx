import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FormButtons } from "@/components/ui/form-buttons";

type CourtAssignment = {
  id: string;
  term_id: string;
  room_id: string;
  room_number: string;
  part: string;
  justice: string;
  clerks: string[];
  sergeant: string;
  fax: string;
  tel: string;
  calendar_day: string;
  part_details: any;
  created_at: string;
  updated_at: string;
};

type CourtTerm = {
  id: string;
  term_name: string;
  term_number: string;
};

type CourtRoom = {
  id: string;
  room_number: string;
  courtroom_number: string;
};

interface EditAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: CourtAssignment;
  terms: CourtTerm[];
  courtrooms: CourtRoom[];
}

export const EditAssignmentDialog = ({
  open,
  onOpenChange,
  assignment,
  terms,
  courtrooms,
}: EditAssignmentDialogProps) => {
  const [formData, setFormData] = useState({
    term_id: "",
    room_id: "",
    part: "",
    justice: "",
    sergeant: "",
    tel: "",
    fax: "",
    calendar_day: "",
    clerks: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form data when assignment changes
  useEffect(() => {
    if (assignment) {
      setFormData({
        term_id: assignment.term_id || "",
        room_id: assignment.room_id || "",
        part: assignment.part || "",
        justice: assignment.justice || "",
        sergeant: assignment.sergeant || "",
        tel: assignment.tel || "",
        fax: assignment.fax || "",
        calendar_day: assignment.calendar_day || "",
        clerks: assignment.clerks?.join(", ") || "",
      });
    }
  }, [assignment]);

  const updateAssignmentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Get the room number for the selected room
      const selectedRoom = courtrooms.find(r => r.id === data.room_id);
      const roomNumber = selectedRoom?.room_number || "";

      const { error } = await supabase
        .from("court_assignments")
        .update({
          term_id: data.term_id,
          room_id: data.room_id,
          room_number: roomNumber,
          part: data.part,
          justice: data.justice,
          sergeant: data.sergeant || null,
          tel: data.tel || null,
          fax: data.fax || null,
          calendar_day: data.calendar_day || null,
          clerks: data.clerks ? data.clerks.split(",").map(c => c.trim()) : [],
        })
        .eq("id", assignment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments"] });
      toast({
        title: "Assignment updated",
        description: "Court assignment has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update assignment: " + error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.term_id || !formData.room_id || !formData.part || !formData.justice) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields.",
      });
      return;
    }

    updateAssignmentMutation.mutate(formData);
  };

  const selectedRoom = courtrooms.find(r => r.id === formData.room_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Court Assignment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Term Selection */}
            <div className="space-y-2">
              <Label htmlFor="term">Court Term *</Label>
              <Select
                value={formData.term_id}
                onValueChange={(value) => setFormData({ ...formData, term_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.term_name} (#{term.term_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Selection */}
            <div className="space-y-2">
              <Label htmlFor="room">Courtroom *</Label>
              <Select
                value={formData.room_id}
                onValueChange={(value) => setFormData({ ...formData, room_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a courtroom" />
                </SelectTrigger>
                <SelectContent>
                  {courtrooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.room_number} 
                      {room.courtroom_number && ` (${room.courtroom_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Part */}
            <div className="space-y-2">
              <Label htmlFor="part">Part *</Label>
              <Input
                id="part"
                value={formData.part}
                onChange={(e) => setFormData({ ...formData, part: e.target.value })}
                placeholder="e.g., 62, IAS 1, etc."
              />
            </div>

            {/* Justice */}
            <div className="space-y-2">
              <Label htmlFor="justice">Justice *</Label>
              <Input
                id="justice"
                value={formData.justice}
                onChange={(e) => setFormData({ ...formData, justice: e.target.value })}
                placeholder="Justice name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Sergeant */}
            <div className="space-y-2">
              <Label htmlFor="sergeant">Sergeant</Label>
              <Input
                id="sergeant"
                value={formData.sergeant}
                onChange={(e) => setFormData({ ...formData, sergeant: e.target.value })}
                placeholder="Sergeant name"
              />
            </div>

            {/* Calendar Day */}
            <div className="space-y-2">
              <Label htmlFor="calendar_day">Calendar Day</Label>
              <Input
                id="calendar_day"
                value={formData.calendar_day}
                onChange={(e) => setFormData({ ...formData, calendar_day: e.target.value })}
                placeholder="e.g., Monday, Tuesday, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="tel">Phone</Label>
              <Input
                id="tel"
                value={formData.tel}
                onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                placeholder="Phone number"
              />
            </div>

            {/* Fax */}
            <div className="space-y-2">
              <Label htmlFor="fax">Fax</Label>
              <Input
                id="fax"
                value={formData.fax}
                onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                placeholder="Fax number"
              />
            </div>
          </div>

          {/* Clerks */}
          <div className="space-y-2">
            <Label htmlFor="clerks">Clerks</Label>
            <Textarea
              id="clerks"
              value={formData.clerks}
              onChange={(e) => setFormData({ ...formData, clerks: e.target.value })}
              placeholder="Enter clerk names separated by commas"
              rows={3}
            />
          </div>

          {/* Room Preview */}
          {selectedRoom && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Selected Courtroom:</p>
              <p className="text-sm text-muted-foreground">
                Room {selectedRoom.room_number}
                {selectedRoom.courtroom_number && ` (Courtroom ${selectedRoom.courtroom_number})`}
              </p>
            </div>
          )}

          <FormButtons
            onCancel={() => onOpenChange(false)}
            isSubmitting={updateAssignmentMutation.isPending}
            submitLabel="Update Assignment"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};