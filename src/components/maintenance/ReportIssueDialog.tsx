import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportIssueDialog = ({ open, onOpenChange }: ReportIssueDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    space_name: "",
    space_type: "courtroom",
    issue_type: "",
    severity: "medium",
    recurring_issue: false,
  });

  // Get rooms for space selection
  const { data: rooms } = useQuery({
    queryKey: ["rooms-for-issues"],
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
    console.log('Issue form submitted with data:', formData);
    
    try {
      console.log('Inserting into unified issues table...');
      const { error } = await supabase
        .from("issues")
        .insert({
          title: formData.title,
          description: formData.description,
          location_description: formData.space_name,
          space_type: formData.space_type,
          issue_type: formData.issue_type,
          priority: formData.severity === 'critical' ? 'high' : formData.severity,
          status: 'open'
        });

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

      toast({
        title: "Issue Reported",
        description: "The maintenance issue has been reported successfully.",
      });

      setFormData({
        title: "",
        description: "",
        space_name: "",
        space_type: "courtroom",
        issue_type: "",
        severity: "medium",
        recurring_issue: false,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast({
        title: "Error",
        description: "Failed to report issue. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report Maintenance Issue</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Issue Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of the problem"
              required
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