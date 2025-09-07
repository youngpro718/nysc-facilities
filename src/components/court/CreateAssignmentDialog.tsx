import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
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

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courtrooms: CourtRoom[];
}

export const CreateAssignmentDialog = ({
  open,
  onOpenChange,
  courtrooms,
}: CreateAssignmentDialogProps) => {
  const [formData, setFormData] = useState({
    term_name: "",
    term_number: "",
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

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Get the room number for the selected room
      const selectedRoom = courtrooms.find(r => r.id === data.room_id);
      const roomNumber = selectedRoom?.room_number || "";

      const { error } = await supabase
        .from("court_assignments")
        .insert({
          room_id: data.room_id,
          room_number: roomNumber,
          part: data.part,
          justice: data.justice,
          sergeant: data.sergeant || null,
          tel: data.tel || null,
          fax: data.fax || null,
          calendar_day: data.calendar_day || null,
          clerks: data.clerks ? data.clerks.split(",").map(c => c.trim()) : [],
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments"] });
      toast({
        title: "Assignment created",
        description: "Court assignment has been created successfully.",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create assignment: " + error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.room_id || !formData.part || !formData.justice) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in Room, Part, and Justice fields.",
      });
      return;
    }

    createAssignmentMutation.mutate(formData);
  };

  const handleClose = () => {
    setFormData({
      term_name: "",
      term_number: "",
      room_id: "",
      part: "",
      justice: "",
      sergeant: "",
      tel: "",
      fax: "",
      calendar_day: "",
      clerks: "",
    });
    onOpenChange(false);
  };

  const selectedRoom = courtrooms.find(r => r.id === formData.room_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Court Assignment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            onCancel={handleClose}
            isSubmitting={createAssignmentMutation.isPending}
            submitLabel="Create Assignment"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};