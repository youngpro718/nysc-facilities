import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { History, RotateCcw, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { EnhancedRoom } from "../../types/EnhancedRoomTypes";
import { RoomTypeEnum } from "../../types/roomEnums";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface RoomRepurposingDialogProps {
  room: EnhancedRoom;
  trigger: React.ReactNode;
  onUpdate?: () => void;
}

interface RepurposingRecord {
  date: string;
  fromType: string;
  toType: string;
  reason: string;
  isTemporary: boolean;
  status: 'active' | 'reverted' | 'permanent';
}

export function RoomRepurposingDialog({ room, trigger, onUpdate }: RoomRepurposingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newRoomType, setNewRoomType] = useState<string>(room.room_type);
  const [reason, setReason] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Mock repurposing history - in real implementation this would come from database
  const [repurposingHistory] = useState<RepurposingRecord[]>([
    {
      date: '2024-01-15',
      fromType: 'office',
      toType: 'storage',
      reason: 'Temporary storage for court documents during renovation',
      isTemporary: true,
      status: 'reverted'
    },
    {
      date: '2024-03-01',
      fromType: 'storage',
      toType: 'office',
      reason: 'Renovation completed, returned to original function',
      isTemporary: false,
      status: 'active'
    }
  ]);

  const roomTypeOptions = Object.values(RoomTypeEnum).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));

  const canRevert = room.original_room_type && room.original_room_type !== room.room_type;

  const handleRepurpose = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for repurposing.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: any = {
        room_type: newRoomType as any,
        temporary_storage_use: isTemporary,
        function_change_date: new Date().toISOString(),
      };

      // Set original room type if this is the first change
      if (!room.original_room_type) {
        updates.original_room_type = room.room_type;
      }

      // Update previous functions array
      const previousFunctions = room.previous_functions || [];
      previousFunctions.push({
        type: room.room_type,
        date: new Date().toISOString(),
        reason: reason,
        temporary: isTemporary
      });
      updates.previous_functions = previousFunctions;

      const { error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', room.id);

      if (error) throw error;

      toast({
        title: "Room Repurposed",
        description: `Room successfully changed from ${room.room_type.replace(/_/g, ' ')} to ${newRoomType.replace(/_/g, ' ')}.`,
      });

      setIsOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error repurposing room:', error);
      toast({
        title: "Error",
        description: "Failed to repurpose room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevert = async () => {
    if (!room.original_room_type) return;

    setIsSubmitting(true);
    try {
      const updates = {
        room_type: room.original_room_type as any,
        temporary_storage_use: false,
        function_change_date: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', room.id);

      if (error) throw error;

      toast({
        title: "Room Reverted",
        description: `Room successfully reverted to original function: ${room.original_room_type.replace(/_/g, ' ')}.`,
      });

      setIsOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error reverting room:', error);
      toast({
        title: "Error",
        description: "Failed to revert room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-3 w-3 text-success" />;
      case 'reverted':
        return <RotateCcw className="h-3 w-3 text-info" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Room Repurposing - {room.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Current Status</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Current Function</div>
                <div className="font-medium">{room.room_type.replace(/_/g, ' ')}</div>
              </div>
              {room.original_room_type && (
                <div>
                  <div className="text-xs text-muted-foreground">Original Function</div>
                  <div className="font-medium">{room.original_room_type.replace(/_/g, ' ')}</div>
                </div>
              )}
            </div>
            
            {room.temporary_storage_use && (
              <Badge variant="outline" className="mt-2">
                <Clock className="h-3 w-3 mr-1" />
                Temporary Use
              </Badge>
            )}
          </div>

          {/* Repurposing Form */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Repurpose Room</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newType">New Room Type</Label>
                <Select value={newRoomType} onValueChange={setNewRoomType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="temporary"
                  checked={isTemporary}
                  onCheckedChange={setIsTemporary}
                />
                <Label htmlFor="temporary" className="text-sm">
                  Temporary change
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Change</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this room is being repurposed..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleRepurpose}
                disabled={isSubmitting || newRoomType === room.room_type}
                className="flex-1"
              >
                {isSubmitting ? 'Repurposing...' : 'Repurpose Room'}
              </Button>
              
              {canRevert && (
                <Button
                  variant="outline"
                  onClick={handleRevert}
                  disabled={isSubmitting}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Revert to Original
                </Button>
              )}
            </div>
          </div>

          {/* Repurposing History */}
          {repurposingHistory.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Repurposing History</h4>
              <div className="space-y-2">
                {repurposingHistory.map((record, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(record.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {record.fromType.replace(/_/g, ' ')} → {record.toType.replace(/_/g, ' ')}
                            </span>
                            {record.isTemporary && (
                              <Badge variant="outline" className="text-xs">
                                Temporary
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {record.reason}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(record.date), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}