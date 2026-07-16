import { useState } from "react";
import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ModalFrame } from "@shared/components/common/common/ModalFrame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@shared/hooks/use-toast";

interface ScheduleMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScheduleMaintenanceDialog = ({ open, onOpenChange }: ScheduleMaintenanceDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    maintenance_type: "",
    space_name: "",
    space_id: "" as string,
    space_type: "courtroom",
    scheduled_start_date: "",
    scheduled_end_date: "",
    priority: "medium",
    impact_level: "minimal",
    notes: "",
    special_instructions: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
    enabled: open,
  });

  // Mutation for creating maintenance schedule
  const createMaintenance = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("maintenance_schedules")
        .insert({
          title: data.title,
          description: data.description || '',
          maintenance_type: data.maintenance_type,
          space_name: data.space_name,
          space_id: data.space_id || null,
          space_type: data.space_type,
          scheduled_start_date: new Date(data.scheduled_start_date).toISOString(),
          scheduled_end_date: data.scheduled_end_date 
            ? new Date(data.scheduled_end_date).toISOString() 
            : null,
          status: 'scheduled',
          priority: data.priority,
          impact_level: data.impact_level,
          notes: data.notes || '',
          special_instructions: data.special_instructions || '',
          estimated_cost: null,
          notification_sent: false
        });

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate and refetch maintenance schedules
      queryClient.invalidateQueries({ queryKey: ["maintenance-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-stats"] });
      
      toast({
        title: "Maintenance Scheduled",
        description: "The maintenance has been scheduled successfully.",
      });

      setFormData({
        title: "",
        description: "",
        maintenance_type: "",
        space_name: "",
        space_id: "",
        space_type: "courtroom",
        scheduled_start_date: "",
        scheduled_end_date: "",
        priority: "medium",
        impact_level: "minimal",
        notes: "",
        special_instructions: "",
      });
      setValidationErrors({});
      onOpenChange(false);
    },
    onError: (error) => {
      logger.error('Error scheduling maintenance:', error);
      toast({
        title: "Error",
        description: "Failed to schedule maintenance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = "Enter a maintenance title.";
    if (!formData.maintenance_type) errors.maintenance_type = "Select a maintenance type.";
    if (!formData.space_name.trim()) errors.space_name = "Select or enter a location.";
    if (!formData.scheduled_start_date) errors.scheduled_start_date = "Choose a start date.";
    if (
      formData.scheduled_start_date &&
      formData.scheduled_end_date &&
      new Date(formData.scheduled_end_date) < new Date(formData.scheduled_start_date)
    ) {
      errors.scheduled_end_date = "End date must be after the start date.";
    }
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;
    createMaintenance.mutate(formData);
  };

  const clearError = (field: string) => {
    setValidationErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  return (
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Schedule Maintenance"
    >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }));
                  clearError("title");
                }}
                placeholder="e.g., Room 201 Painting"
                required
                aria-invalid={!!validationErrors.title}
                aria-describedby={validationErrors.title ? "maintenance-title-error" : undefined}
              />
              {validationErrors.title && (
                <p id="maintenance-title-error" className="text-sm text-destructive">{validationErrors.title}</p>
              )}
            </div>

            <div>
              <Label htmlFor="maintenance_type">Maintenance Type *</Label>
              <Select 
                value={formData.maintenance_type} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, maintenance_type: value }));
                  clearError("maintenance_type");
                }}
              >
                <SelectTrigger aria-label="Maintenance type" aria-invalid={!!validationErrors.maintenance_type}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="painting">Painting</SelectItem>
                  <SelectItem value="plaster">Plaster</SelectItem>
                  <SelectItem value="doors">Doors</SelectItem>
                  <SelectItem value="flooring">Flooring</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.maintenance_type && (
                <p className="text-sm text-destructive">{validationErrors.maintenance_type}</p>
              )}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="space_type">Room Type</Label>
              <Select 
                value={formData.space_type} 
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    space_type: value,
                    space_id: "",
                    space_name: "",
                  }));
                  clearError("space_name");
                }}
              >
                <SelectTrigger aria-label="Room type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="courtroom">Courtroom</SelectItem>
                  <SelectItem value="room">Room</SelectItem>
                  <SelectItem value="hallway">Hallway</SelectItem>
                  <SelectItem value="stairwell">Stairwell</SelectItem>
                  <SelectItem value="door">Door</SelectItem>
                  <SelectItem value="building">Building</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="space_name">Room Name/Number *</Label>
              {(formData.space_type === "room" || formData.space_type === "courtroom") && rooms ? (
                <Select 
                  value={formData.space_id} 
                  onValueChange={(value) => {
                    const selected = rooms.find(r => r.id === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      space_id: value,
                      space_name: selected?.room_number || value
                    }));
                    clearError("space_name");
                  }}
                >
                  <SelectTrigger aria-label={`Select ${formData.space_type}`} aria-invalid={!!validationErrors.space_name}>
                    <SelectValue placeholder={`Select ${formData.space_type}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
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
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, space_name: e.target.value }));
                    clearError("space_name");
                  }}
                  placeholder="Enter space identifier"
                  required
                  aria-invalid={!!validationErrors.space_name}
                />
              )}
              {validationErrors.space_name && (
                <p className="text-sm text-destructive">{validationErrors.space_name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_start_date">Start Date *</Label>
              <Input
                id="scheduled_start_date"
                type="datetime-local"
                value={formData.scheduled_start_date}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, scheduled_start_date: e.target.value }));
                  clearError("scheduled_start_date");
                }}
                required
                aria-invalid={!!validationErrors.scheduled_start_date}
                min={new Date().toISOString().slice(0, 16)}
              />
              {validationErrors.scheduled_start_date && (
                <p className="text-sm text-destructive">{validationErrors.scheduled_start_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="scheduled_end_date">End Date</Label>
              <Input
                id="scheduled_end_date"
                type="datetime-local"
                value={formData.scheduled_end_date}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, scheduled_end_date: e.target.value }));
                  clearError("scheduled_end_date");
                }}
                min={formData.scheduled_start_date || undefined}
                aria-invalid={!!validationErrors.scheduled_end_date}
              />
              {validationErrors.scheduled_end_date && (
                <p className="text-sm text-destructive">{validationErrors.scheduled_end_date}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger aria-label="Maintenance priority">
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
                <SelectTrigger aria-label="Maintenance impact level">
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createMaintenance.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMaintenance.isPending}>
              {createMaintenance.isPending ? "Scheduling..." : "Schedule Maintenance"}
            </Button>
          </div>
        </form>
    </ModalFrame>
  );
};
