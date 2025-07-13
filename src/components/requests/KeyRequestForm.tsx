import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoomAssignments } from "@/hooks/useUserRoomAssignments";

interface KeyRequestFormData {
  reason: string;
  request_type: 'spare' | 'replacement' | 'new';
  room_id?: string;
  room_other?: string;
  quantity: number;
  emergency_contact?: string;
  email_notifications_enabled: boolean;
}

interface KeyRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: KeyRequestFormData) => void;
}

export const KeyRequestForm: React.FC<KeyRequestFormProps> = ({ open, onClose, onSubmit }) => {
  const { user } = useAuth();
  const { data: roomAssignments = [] } = useUserRoomAssignments(user?.id);
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>Request a Key</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Request Type */}
            <div className="space-y-2">
              <Label>Request Type</Label>
              <RadioGroup 
                value={formData.request_type} 
                onValueChange={(value: 'spare' | 'replacement' | 'new') => 
                  setFormData(prev => ({ ...prev, request_type: value }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new">New Access</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spare" id="spare" />
                  <Label htmlFor="spare">Spare Key</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replacement" id="replacement" />
                  <Label htmlFor="replacement">Replacement Key</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Room Selection */}
            <div className="space-y-2">
              <Label>Room</Label>
              <Select onValueChange={handleRoomChange}>
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
              <Label>Reason for Request</Label>
              <Textarea
                placeholder="Please explain why you need this key access..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                required
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
            <div className="flex items-center justify-between">
              <Label>Receive email notifications</Label>
              <Switch
                checked={formData.email_notifications_enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, email_notifications_enabled: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Submit Request</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
