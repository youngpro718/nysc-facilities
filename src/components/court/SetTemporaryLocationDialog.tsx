import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";

interface SetTemporaryLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courtroomId: string | null;
}

export const SetTemporaryLocationDialog = ({ 
  open, 
  onOpenChange, 
  courtroomId 
}: SetTemporaryLocationDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    temporary_location: "",
    notes: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [courtroomInfo, setCourtroomInfo] = useState<any>(null);

  useEffect(() => {
    if (courtroomId && open) {
      fetchCourtroomInfo();
    }
  }, [courtroomId, open]);

  const fetchCourtroomInfo = async () => {
    if (!courtroomId) return;
    
    try {
      const { data, error } = await supabase
        .from("court_rooms")
        .select("*, rooms(name)")
        .eq("id", courtroomId)
        .single();
      
      if (error) throw error;
      setCourtroomInfo(data);
      
      // Pre-fill existing temporary location if any
      if (data.temporary_location) {
        setFormData({
          temporary_location: data.temporary_location,
          notes: data.notes || "",
        });
      }
    } catch (error) {
      console.error("Error fetching courtroom info:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courtroomId) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from("court_rooms")
        .update({
          temporary_location: formData.temporary_location,
          notes: formData.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courtroomId);

      if (error) throw error;

      toast({
        title: "Temporary Location Set",
        description: "The temporary location has been set successfully.",
      });

      setFormData({
        temporary_location: "",
        notes: "",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set temporary location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearLocation = async () => {
    if (!courtroomId) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from("court_rooms")
        .update({
          temporary_location: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courtroomId);

      if (error) throw error;

      toast({
        title: "Temporary Location Cleared",
        description: "The temporary location has been removed.",
      });

      setFormData({
        temporary_location: "",
        notes: "",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear temporary location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Set Temporary Location
          </DialogTitle>
        </DialogHeader>

        {courtroomInfo && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <div className="font-medium">
              Courtroom {courtroomInfo.courtroom_number || courtroomInfo.room_number}
            </div>
            <div className="text-sm text-muted-foreground">
              {courtroomInfo.rooms?.name || courtroomInfo.room_number}
            </div>
            {courtroomInfo.maintenance_status !== "operational" && (
              <div className="text-sm text-orange-600 mt-1">
                Currently under maintenance
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="temporary_location">Temporary Location *</Label>
            <Input
              id="temporary_location"
              value={formData.temporary_location}
              onChange={(e) => setFormData(prev => ({ ...prev, temporary_location: e.target.value }))}
              placeholder="e.g., Conference Room B, Building 2"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional information about the temporary location"
            />
          </div>

          <div className="flex justify-between gap-2 pt-4">
            <div>
              {courtroomInfo?.temporary_location && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClearLocation}
                  disabled={isUpdating}
                >
                  Clear Location
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Set Location"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};