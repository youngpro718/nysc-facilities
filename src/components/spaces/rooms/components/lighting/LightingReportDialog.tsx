// @ts-nocheck
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Zap, AlertTriangle } from "lucide-react";
import { EnhancedRoom, LightingIssueReport } from "../../types/EnhancedRoomTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LightingReportDialogProps {
  room: EnhancedRoom;
  trigger: React.ReactNode;
}

export function LightingReportDialog({ room, trigger }: LightingReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFixtureReport = async (location: string, issueType: 'light_out' | 'flickering' | 'ballast_issue') => {
    setIsSubmitting(true);
    
    try {
      // Create issue in the issues table
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      const { error } = await supabase
        .from('issues')
        .insert({
          title: `${location} Light ${issueType === 'light_out' ? 'Out' : issueType === 'flickering' ? 'Flickering' : 'Ballast Issue'}`,
          description: `Lighting issue reported for ${location} in ${room.name} (Room ${room.room_number})`,
          priority: issueType === 'light_out' ? 'high' : 'medium',
          status: 'open',
          issue_type: 'lighting',
          building_id: room.building_id,
          floor_id: room.floor_id,
          room_id: room.id,
          location_description: location,
          reported_by: userId,
          created_by: userId
        });

      if (error) throw error;

      toast({
        title: "Lighting Issue Reported",
        description: `${location} lighting issue has been reported and will be addressed.`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Error reporting lighting issue:', error);
      toast({
        title: "Error",
        description: "Failed to report lighting issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonFixtureLocations = [
    'Main Area',
    'Entry',
    'Bathroom',
    'Storage',
    'Desk Area',
    'Conference Area',
    'Witness Stand',
    'Jury Box',
    'Gallery',
    'Bench Area'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Report Lighting Issue - {room.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click on the specific location where you're experiencing a lighting issue:
          </p>
          
          {/* Current Fixture Status */}
          {room.lighting_fixtures && room.lighting_fixtures.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Current Fixture Status:</h4>
              <div className="flex flex-wrap gap-2">
                {room.lighting_fixtures.map((fixture) => (
                  <Badge
                    key={fixture.id}
                    variant={fixture.status === 'functional' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {fixture.location}: {fixture.status}
                    {fixture.outage_duration_days && fixture.outage_duration_days > 0 && (
                      <span className="ml-1">({fixture.outage_duration_days}d)</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Quick Report Buttons */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Select Location and Issue Type:</h4>
            <div className="grid grid-cols-2 gap-3">
              {commonFixtureLocations.map((location) => (
                <div key={location} className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">{location}</h5>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFixtureReport(location, 'light_out')}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Lightbulb className="h-3 w-3" />
                      Out
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFixtureReport(location, 'flickering')}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Zap className="h-3 w-3" />
                      Flickering
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFixtureReport(location, 'ballast_issue')}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 text-xs"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Ballast
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Reports are automatically timestamped and will be tracked until resolution.
              Maintenance will be notified immediately for critical lighting issues.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}