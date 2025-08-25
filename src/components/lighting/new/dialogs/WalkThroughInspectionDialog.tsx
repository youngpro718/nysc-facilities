import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLightingFixtures } from "@/hooks/useLightingFixtures";
import { CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";

interface WalkThroughInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalkThroughInspectionDialog({ open, onOpenChange }: WalkThroughInspectionDialogProps) {
  const { fixtures } = useLightingFixtures();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inspectionData, setInspectionData] = useState<Record<string, {
    status: string;
    notes: string;
    requiresElectrician: boolean;
  }>>({});

  const currentFixture = fixtures?.[currentIndex];
  const totalFixtures = fixtures?.length || 0;
  const progressPercentage = totalFixtures > 0 ? ((currentIndex + 1) / totalFixtures) * 100 : 0;

  const handleStatusUpdate = (status: string) => {
    if (!currentFixture) return;
    
    setInspectionData(prev => ({
      ...prev,
      [currentFixture.id]: {
        ...prev[currentFixture.id],
        status,
        notes: prev[currentFixture.id]?.notes || '',
        requiresElectrician: prev[currentFixture.id]?.requiresElectrician || false
      }
    }));
  };

  const handleNotesUpdate = (notes: string) => {
    if (!currentFixture) return;
    
    setInspectionData(prev => ({
      ...prev,
      [currentFixture.id]: {
        ...prev[currentFixture.id],
        notes,
        status: prev[currentFixture.id]?.status || currentFixture.status,
        requiresElectrician: prev[currentFixture.id]?.requiresElectrician || false
      }
    }));
  };

  const handleElectricianToggle = (requires: boolean) => {
    if (!currentFixture) return;
    
    setInspectionData(prev => ({
      ...prev,
      [currentFixture.id]: {
        ...prev[currentFixture.id],
        requiresElectrician: requires,
        status: prev[currentFixture.id]?.status || currentFixture.status,
        notes: prev[currentFixture.id]?.notes || ''
      }
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalFixtures - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinishInspection = () => {
    const updatedCount = Object.keys(inspectionData).length;
    toast.success(`Inspection complete! ${updatedCount} fixtures inspected`);
    onOpenChange(false);
    setCurrentIndex(0);
    setInspectionData({});
  };

  if (!currentFixture) {
    return null;
  }

  const currentData = inspectionData[currentFixture.id];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Walk-Through Inspection
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentIndex + 1} of {totalFixtures}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Current Fixture */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{currentFixture.name}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {currentFixture.space_name} • {currentFixture.room_number || 'No room'}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Status:</span>
                <Badge>{currentFixture.status.replace('_', ' ')}</Badge>
                {currentFixture.requires_electrician && (
                  <Badge variant="destructive">Electrician Required</Badge>
                )}
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Update Status:</label>
                <Select
                  value={currentData?.status || currentFixture.status}
                  onValueChange={handleStatusUpdate}
                >
                  <SelectTrigger>
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

              {/* Electrician Required */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="electrician"
                  checked={currentData?.requiresElectrician || false}
                  onChange={(e) => handleElectricianToggle(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="electrician" className="text-sm font-medium">
                  Requires Electrician
                </label>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Inspection Notes:</label>
                <Textarea
                  value={currentData?.notes || ''}
                  onChange={(e) => handleNotesUpdate(e.target.value)}
                  placeholder="Add any observations, issues, or maintenance notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentIndex === totalFixtures - 1 ? (
                <Button onClick={handleFinishInspection}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finish Inspection
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}