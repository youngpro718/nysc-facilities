import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLightingFixtures } from "@/hooks/useLightingFixtures";
import { LightStatus } from "@/types/lighting";
import { CheckCircle, AlertTriangle, Wrench } from "lucide-react";
import { toast } from "sonner";

interface BulkStatusUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkStatusUpdateDialog({ open, onOpenChange }: BulkStatusUpdateDialogProps) {
  const { fixtures, handleBulkStatusUpdate } = useLightingFixtures();
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState<LightStatus>("functional");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (selectedFixtures.length === 0) {
      toast.error("Please select at least one fixture");
      return;
    }

    setIsUpdating(true);
    try {
      await handleBulkStatusUpdate(selectedFixtures, newStatus);
      toast.success(`Updated ${selectedFixtures.length} fixtures to ${newStatus}`);
      setSelectedFixtures([]);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update fixtures");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'functional': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'non_functional': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'maintenance_needed': return <Wrench className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'functional': return 'bg-green-100 text-green-800';
      case 'non_functional': return 'bg-red-100 text-red-800';
      case 'maintenance_needed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Bulk Status Update</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">New Status:</label>
            <Select value={newStatus} onValueChange={(value: LightStatus) => setNewStatus(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="functional">✅ Functional</SelectItem>
                <SelectItem value="maintenance_needed">🔧 Maintenance Needed</SelectItem>
                <SelectItem value="non_functional">❌ Non-Functional</SelectItem>
                <SelectItem value="scheduled_replacement">📅 Scheduled Replacement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selected Count */}
          {selectedFixtures.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="text-sm text-blue-800">
                {selectedFixtures.length} fixture{selectedFixtures.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}

          {/* Fixture List */}
          <div className="h-96 border rounded-md p-4 overflow-y-auto">
            <div className="space-y-2">
              {fixtures?.map((fixture) => (
                <div key={fixture.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md">
                  <Checkbox
                    checked={selectedFixtures.includes(fixture.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFixtures(prev => [...prev, fixture.id]);
                      } else {
                        setSelectedFixtures(prev => prev.filter(id => id !== fixture.id));
                      }
                    }}
                  />
                  
                  <div className="flex items-center gap-2 flex-1">
                    {getStatusIcon(fixture.status)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{fixture.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {fixture.space_name} • {fixture.room_number || 'No room'}
                      </div>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(fixture.status)}`}>
                      {fixture.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFixtures(fixtures?.map(f => f.id) || [])}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFixtures([])}
              >
                Clear Selection
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating || selectedFixtures.length === 0}>
                {isUpdating ? 'Updating...' : `Update ${selectedFixtures.length} Fixtures`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}