import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ScheduleMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScheduleMaintenanceDialog = ({ open, onOpenChange }: ScheduleMaintenanceDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    maintenance_type: "",
    space_name: "",
    space_type: "courtroom",
    scheduled_start_date: "",
    scheduled_end_date: "",
    priority: "medium",
    impact_level: "minimal",
    notes: "",
    special_instructions: "",
  });

  // Get rooms for space selection
  const { data: rooms } = useQuery({
    queryKey: ["rooms-for-maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, room_number")
        .order("room_number");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("maintenance_schedules")
        .insert({
          ...formData,
          scheduled_start_date: new Date(formData.scheduled_start_date).toISOString(),
          scheduled_end_date: formData.scheduled_end_date 
            ? new Date(formData.scheduled_end_date).toISOString() 
            : null,
        });

      if (error) throw error;

      toast({
        title: "Maintenance Scheduled",
        description: "The maintenance has been scheduled successfully.",
      });

      setFormData({
        title: "",
        description: "",
        maintenance_type: "",
        space_name: "",
        space_type: "courtroom",
        scheduled_start_date: "",
        scheduled_end_date: "",
        priority: "medium",
        impact_level: "minimal",
        notes: "",
        special_instructions: "",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule maintenance. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Room 201 Painting"
                required
              />
            </div>

            <div>
              <Label htmlFor="maintenance_type">Maintenance Type *</Label>
              <Select 
                value={formData.maintenance_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, maintenance_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="flooring">Flooring</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the maintenance work to be performed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="space_type">Space Type</Label>
              <Select 
                value={formData.space_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, space_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="courtroom">Courtroom</SelectItem>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="hallway">Hallway</SelectItem>
                  <SelectItem value="door">Door</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="space_name">Space Name/Number *</Label>
              {formData.space_type === "room" && rooms ? (
                <Select 
                  value={formData.space_name} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, space_name: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.room_number}>
                        {room.room_number} - {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="space_name"
                  value={formData.space_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, space_name: e.target.value }))}
                  placeholder="Enter space identifier"
                  required
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_start_date">Start Date *</Label>
              <Input
                id="scheduled_start_date"
                type="datetime-local"
                value={formData.scheduled_start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_start_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="scheduled_end_date">End Date</Label>
              <Input
                id="scheduled_end_date"
                type="datetime-local"
                value={formData.scheduled_end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="impact_level">Impact Level</Label>
              <Select 
                value={formData.impact_level} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, impact_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Impact</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="significant">Significant</SelectItem>
                  <SelectItem value="full_closure">Full Closure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="special_instructions">Special Instructions</Label>
            <Textarea
              id="special_instructions"
              value={formData.special_instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, special_instructions: e.target.value }))}
              placeholder="Any special instructions for the maintenance team"
            />
          </div>

          <div>
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Internal notes for planning and coordination"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule Maintenance
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};