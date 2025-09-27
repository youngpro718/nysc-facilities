import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RoomOption {
  id: string;
  name: string | null;
  room_number: string | null;
  floor_id: string | null;
  floors?: { building_id: string | null } | null;
}

export const ReportIssueDialog = ({ open, onOpenChange }: ReportIssueDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    space_name: "",
    space_type: "courtroom",
    issue_type: "",
    severity: "medium",
    recurring_issue: false,
    room_id: "",
    building_id: "",
  });

  // Get rooms for space selection
  const { data: rooms } = useQuery<RoomOption[]>({
    queryKey: ["rooms-for-issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, room_number, floor_id, floors(building_id)")
        .order("room_number");
      if (error) throw error;
      return (data as unknown as RoomOption[]) || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Issue form submitted with data:', formData);
    toast.message('Submitting issue…');
    
    // If user selected a room, ensure room_id is set
    if (formData.space_type === 'room' && !formData.room_id) {
      return toast.error("Room required", { description: "Please select a room for this issue." });
    }

    try {
      if (!formData.title.trim()) {
        return toast.error("Title required", { description: "Please enter a brief issue title." });
      }
      console.log('Inserting into unified issues table...');
      const { error } = await supabase
        .from("issues")
        .insert({
          title: formData.title,
          description: formData.description,
          type: formData.issue_type,
          // Normalize: treat "critical" selection as "urgent" to trigger DB workflows
          priority: (formData.severity === 'critical' ? 'urgent' : formData.severity),
          status: 'open',
          room_id: formData.room_id || null,
          building_id: formData.building_id || null,
        } as any);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      console.log('Successfully inserted issue into unified table');

      // Invalidate all issue-related queries to ensure immediate UI updates
      await queryClient.invalidateQueries({ queryKey: ['issues'] });
      await queryClient.invalidateQueries({ queryKey: ['userIssues'] });
      await queryClient.invalidateQueries({ queryKey: ['roomIssues'] });
      await queryClient.invalidateQueries({ queryKey: ['maintenanceIssues'] });
      await queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
      await queryClient.invalidateQueries({ queryKey: ['court-issues'] });
      await queryClient.invalidateQueries({ queryKey: ['interactive-operations'] });
      await queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
      await queryClient.invalidateQueries({ queryKey: ['assignment-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['courtroom-availability'] });

      toast.success("Issue reported", { description: "The maintenance issue has been reported successfully." });

      setFormData({
        title: "",
        description: "",
        space_name: "",
        space_type: "courtroom",
        issue_type: "",
        severity: "medium",
        recurring_issue: false,
        room_id: "",
        building_id: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast.error("Failed to report issue", { description: "Please try again." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report Maintenance Issue</DialogTitle>
          <DialogDescription>
            Provide details about the maintenance problem, including location and severity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Issue Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the problem"
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
                  value={formData.room_id}
                  onValueChange={(value) => {
                    const selected = rooms?.find((r: RoomOption) => r.id === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      room_id: value,
                      space_name: selected?.room_number || '',
                      building_id: selected?.floors?.building_id || '',
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {(rooms || []).map((room: RoomOption) => (
                      <SelectItem key={room.id} value={room.id}>
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
                  placeholder="Enter space identifier (optional)"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issue_type">Issue Type *</Label>
              <Select 
                value={formData.issue_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, issue_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select 
                value={formData.severity} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring_issue"
              checked={formData.recurring_issue}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, recurring_issue: checked as boolean }))
              }
            />
            <Label htmlFor="recurring_issue">This is a recurring issue</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Report Issue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};