import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight,
  Zap,
  Check
} from 'lucide-react';
import { LightingFixture, LightStatus } from '@/types/lighting';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { RouteProgressIndicator } from './RouteProgressIndicator';
import { useHallwayLandmarks, useHallwayDetails } from '@/hooks/useHallwayLandmarks';
import { AdjacentRoomsPanel } from './AdjacentRoomsPanel';
import { useHallwayRooms } from '@/hooks/useHallwayRooms';
import { QuickRoomAssignment } from './QuickRoomAssignment';

interface WalkthroughModeProps {
  hallwayId: string;
  fixtures: LightingFixture[];
  onComplete: () => void;
  onCancel: () => void;
}

interface FixtureUpdate {
  status: LightStatus;
  ballast_issue: boolean;
}

export function WalkthroughMode({ hallwayId, fixtures, onComplete, onCancel }: WalkthroughModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [updates, setUpdates] = useState<{ [key: string]: FixtureUpdate }>({});
  const queryClient = useQueryClient();

  // Fetch landmarks and hallway details
  const { data: landmarks = [] } = useHallwayLandmarks(hallwayId);
  const { data: hallwayDetails } = useHallwayDetails(hallwayId);
  const { data: hallwayRooms = [], isLoading: isLoadingRooms } = useHallwayRooms(hallwayId);

  const currentFixture = fixtures[currentIndex];
  const progress = ((currentIndex + 1) / fixtures.length) * 100;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ fixtureId, status, ballast_issue }: { fixtureId: string; status: LightStatus; ballast_issue: boolean }) => {
      const { error } = await supabase
        .from('lighting_fixtures')
        .update({ 
          status,
          ballast_issue,
          reported_out_date: status === 'non_functional' ? new Date().toISOString() : null
        })
        .eq('id', fixtureId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      setUpdates(prev => ({ 
        ...prev, 
        [variables.fixtureId]: { 
          status: variables.status,
          ballast_issue: variables.ballast_issue 
        }
      }));
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      queryClient.invalidateQueries({ queryKey: ['hallway-fixtures', hallwayId] });
    },
    onError: (error) => {
      toast.error('Failed to update fixture status');
      logger.error('Failed to update fixture status:', error);
    }
  });

  const handleStatusUpdate = (status: LightStatus, ballast_issue = false) => {
    updateStatusMutation.mutate({ 
      fixtureId: currentFixture.id, 
      status,
      ballast_issue
    });

    // Auto-advance to next fixture
    setTimeout(() => {
      if (currentIndex < fixtures.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    }, 300);
  };

  const handleComplete = () => {
    const issuesFound = Object.values(updates).filter(u => u.status !== 'functional').length;
    toast.success(`Walkthrough complete! ${issuesFound} issue${issuesFound !== 1 ? 's' : ''} found`);
    onComplete();
  };

  const getFixtureCode = () => {
    if (currentFixture.sequence_number) {
      return `#${String(currentFixture.sequence_number).padStart(2, '0')}`;
    }
    return currentFixture.name;
  };

  const currentUpdate = updates[currentFixture.id];
  const currentStatus = currentUpdate?.status || currentFixture.status;
  const hasBallastIssue = currentUpdate?.ballast_issue ?? currentFixture.ballast_issue;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel Walkthrough
        </Button>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} of {fixtures.length} fixtures
        </div>
      </div>

      {/* Route Progress Indicator */}
      <RouteProgressIndicator
        landmarks={landmarks}
        hallwayRooms={hallwayRooms}
        currentFixtureSequence={currentFixture.sequence_number || currentIndex + 1}
        totalFixtures={fixtures.length}
        startReference={hallwayDetails?.start_reference}
        endReference={hallwayDetails?.end_reference}
      />

      {/* Progress Bar */}
      <div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Main Fixture Card */}
      <Card className="border-2">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Fixture Code */}
            <div>
              <div className="text-5xl font-bold mb-2">{getFixtureCode()}</div>
              <div className="text-lg text-muted-foreground">{currentFixture.name}</div>
              {currentFixture.room_number && (
                <div className="text-sm text-muted-foreground">
                  Room {currentFixture.room_number}
                </div>
              )}
            </div>

            {/* Current Status Badge */}
            <div className="flex justify-center">
              <Badge 
                variant={currentStatus === 'functional' ? 'outline' : 'destructive'}
                className="text-sm py-1 px-3"
              >
                Current: {currentStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Quick Mark Buttons */}
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-24 flex flex-col gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                onClick={() => handleStatusUpdate('functional')}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="h-8 w-8" />
                <span className="font-semibold">Functional</span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-24 flex flex-col gap-2 bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                onClick={() => handleStatusUpdate('non_functional')}
                disabled={updateStatusMutation.isPending}
              >
                <XCircle className="h-8 w-8" />
                <span className="font-semibold">Out</span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-24 flex flex-col gap-2 bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700"
                onClick={() => handleStatusUpdate('maintenance_needed', true)}
                disabled={updateStatusMutation.isPending}
              >
                <Zap className="h-8 w-8" />
                <span className="font-semibold">Ballast Issue</span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="h-24 flex flex-col gap-2 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                onClick={() => handleStatusUpdate('maintenance_needed')}
                disabled={updateStatusMutation.isPending}
              >
                <AlertTriangle className="h-8 w-8" />
                <span className="font-semibold">Maintenance</span>
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentIndex === fixtures.length - 1 ? (
                <Button onClick={handleComplete} size="lg">
                  <Check className="h-4 w-4 mr-2" />
                  Complete Walkthrough
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                >
                  Skip
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {Object.keys(updates).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-around text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(updates).filter(u => u.status === 'functional').length}
                </div>
                <div className="text-muted-foreground">Functional</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(updates).filter(u => u.status === 'non_functional').length}
                </div>
                <div className="text-muted-foreground">Out</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.values(updates).filter(u => u.ballast_issue).length}
                </div>
                <div className="text-muted-foreground">Ballast</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjacent Rooms Panel */}
      <AdjacentRoomsPanel 
        hallwayRooms={hallwayRooms} 
        currentFixtureSequence={currentFixture.sequence_number || currentIndex + 1}
        totalFixtures={fixtures.length}
        isLoading={isLoadingRooms} 
      />

      {/* Quick Room Assignment Floating Button */}
      {hallwayDetails?.floor_id && (
        <QuickRoomAssignment
          hallwayId={hallwayId}
          floorId={hallwayDetails.floor_id}
          currentProgress={progress / 100}
          assignedRoomIds={hallwayRooms.map(r => r.room_id)}
        />
      )}
    </div>
  );
}
