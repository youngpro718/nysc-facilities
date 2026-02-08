/**
 * KeyRequestDialog - Modal wrapper for key request form
 * 
 * Used by logged-in users from the dashboard to submit key requests
 * without navigating to a separate page.
 */

import { useState } from "react";
import { getErrorMessage } from "@/lib/errorUtils";
import { logger } from '@/lib/logger';
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Key } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoomAssignments } from "@/hooks/useUserRoomAssignments";
import { submitKeyRequest } from "@/services/keyRequestService";

interface KeyRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface KeyRequestFormData {
  reason: string;
  request_type: 'spare' | 'replacement' | 'new' | 'temporary';
  room_id?: string;
  room_other?: string;
  quantity: number;
  emergency_contact?: string;
  email_notifications_enabled: boolean;
}

export function KeyRequestDialog({ open, onOpenChange, onSuccess }: KeyRequestDialogProps) {
  const { user } = useAuth();
  const { data: roomAssignments = [] } = useUserRoomAssignments(user?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<KeyRequestFormData>({
    reason: "",
    request_type: "new",
    room_id: "",
    room_other: "",
    quantity: 1,
    emergency_contact: "",
    email_notifications_enabled: true,
  });

  const [showOtherRoom, setShowOtherRoom] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error("You must be logged in to submit a key request");
      return;
    }

    if (!formData.reason.trim()) {
      toast.error("Please provide a reason for your request");
      return;
    }

    if (!formData.room_id && !formData.room_other) {
      toast.error("Please select or enter a room");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitKeyRequest({
        reason: formData.reason,
        user_id: user.id,
        request_type: formData.request_type,
        room_id: formData.room_id || undefined,
        room_other: formData.room_other || null,
        quantity: formData.quantity,
        emergency_contact: formData.emergency_contact || null,
        email_notifications_enabled: formData.email_notifications_enabled,
      });

      toast.success("Key request submitted successfully!", {
        description: "You'll be notified when your request is processed.",
      });

      // Reset form
      setFormData({
        reason: "",
        request_type: "new",
        room_id: "",
        room_other: "",
        quantity: 1,
        emergency_contact: "",
        email_notifications_enabled: true,
      });
      setShowOtherRoom(false);
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      logger.error("Error submitting key request:", error);
      toast.error("Failed to submit request", {
        description: getErrorMessage(error) || "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoomChange = (value: string) => {
    if (value === "other") {
      setShowOtherRoom(true);
      setFormData(prev => ({ ...prev, room_id: "", room_other: "" }));
    } else {
      setShowOtherRoom(false);
      setFormData(prev => ({ ...prev, room_id: value, room_other: "" }));
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <ResponsiveDialog 
      open={open} 
      onOpenChange={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          <span>Request a Key</span>
        </div>
      }
      description="Submit a request for key access to a room or area."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Request Type */}
        <div className="space-y-2">
          <Label>Request Type</Label>
          <RadioGroup 
            value={formData.request_type} 
            onValueChange={(value: 'spare' | 'replacement' | 'new' | 'temporary') => 
              setFormData(prev => ({ ...prev, request_type: value }))
            }
            className="grid grid-cols-2 gap-2"
          >
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="text-sm font-normal cursor-pointer">New Access</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <RadioGroupItem value="spare" id="spare" />
              <Label htmlFor="spare" className="text-sm font-normal cursor-pointer">Spare Key</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <RadioGroupItem value="replacement" id="replacement" />
              <Label htmlFor="replacement" className="text-sm font-normal cursor-pointer">Replacement</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 border rounded-md">
              <RadioGroupItem value="temporary" id="temporary" />
              <Label htmlFor="temporary" className="text-sm font-normal cursor-pointer">Temporary</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Room Selection */}
        <div className="space-y-2">
          <Label>Room <span className="text-destructive">*</span></Label>
          <Select onValueChange={handleRoomChange} value={showOtherRoom ? "other" : formData.room_id}>
            <SelectTrigger>
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {roomAssignments.map((assignment) => (
                <SelectItem key={assignment.id} value={assignment.room_id}>
                  {assignment.rooms.room_number} - {assignment.rooms.name}
                  {assignment.is_primary && " (Primary)"}
                </SelectItem>
              ))}
              <SelectItem value="other">Other Room</SelectItem>
            </SelectContent>
          </Select>
          
          {showOtherRoom && (
            <Input
              placeholder="Enter room number or name"
              value={formData.room_other}
              onChange={(e) => setFormData(prev => ({ ...prev, room_other: e.target.value }))}
              required
            />
          )}
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Select 
            value={formData.quantity.toString()} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, quantity: parseInt(value) }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(num => (
                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <Label>Reason for Request <span className="text-destructive">*</span></Label>
          <Textarea
            placeholder="Please explain why you need this key access..."
            value={formData.reason}
            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            required
            rows={3}
          />
        </div>

        {/* Emergency Contact */}
        <div className="space-y-2">
          <Label>Emergency Contact (Optional)</Label>
          <Input
            placeholder="Phone number or email"
            value={formData.emergency_contact}
            onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
          />
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between py-2">
          <Label className="font-normal">Receive email notifications</Label>
          <Switch
            checked={formData.email_notifications_enabled}
            onCheckedChange={(checked) => 
              setFormData(prev => ({ ...prev, email_notifications_enabled: checked }))
            }
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
