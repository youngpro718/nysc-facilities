import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Zap,
  SkipForward,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useStartWalkthrough,
  useRecordFixtureScan,
  useCompleteWalkthrough,
  useFloorFixtures,
  useWalkthroughSession,
  useWalkthroughHistory,
} from '@/features/lighting/hooks/useLightingData';
import type { FixtureScanAction } from '@/features/lighting/services/lightingService';

interface WalkthroughFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hallwayId?: string;
  floorId?: string;
}

type WalkthroughStep = 'setup' | 'scanning' | 'summary';

export function WalkthroughFlow({ open, onOpenChange, hallwayId, floorId }: WalkthroughFlowProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<WalkthroughStep>('setup');
  const [selectedFloorId, setSelectedFloorId] = useState(floorId || '');
  const [selectedHallwayId, setSelectedHallwayId] = useState(hallwayId || '');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentFixtureIndex, setCurrentFixtureIndex] = useState(0);
  const [requiresElectrician, setRequiresElectrician] = useState(false);
  const [showElectricianPrompt, setShowElectricianPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<FixtureScanAction | null>(null);

  const startMutation = useStartWalkthrough();
  const scanMutation = useRecordFixtureScan();
  const completeMutation = useCompleteWalkthrough();

  // Fetch floors
  const { data: floors = [] } = useQuery({
    queryKey: ['floors-for-walkthrough'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select('id, floor_number, building_id')
        .order('floor_number');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch hallways for selected floor
  const { data: hallways = [] } = useQuery({
    queryKey: ['hallways-for-floor', selectedFloorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hallways')
        .select('id, name')
        .eq('floor_id', selectedFloorId)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedFloorId && open,
  });

  // Fetch fixtures for walkthrough
  const { data: fixtures = [] } = useFloorFixtures(selectedFloorId);

  // Fetch active session
  const { data: session, refetch: refetchSession } = useWalkthroughSession(sessionId || '');

  // Fetch walkthrough history for hallway
  const { data: history = [] } = useWalkthroughHistory(selectedHallwayId, 1);
  const lastWalkthrough = history[0];

  // Filter fixtures by hallway if selected
  const walkthroughFixtures = selectedHallwayId
    ? fixtures.filter(f => f.space_id === selectedHallwayId && f.space_type === 'hallway')
    : fixtures;

  const currentFixture = walkthroughFixtures[currentFixtureIndex];
  const progress = walkthroughFixtures.length > 0
    ? ((currentFixtureIndex + 1) / walkthroughFixtures.length) * 100
    : 0;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setStep('setup');
      setSessionId(null);
      setCurrentFixtureIndex(0);
      setRequiresElectrician(false);
      setShowElectricianPrompt(false);
      setPendingAction(null);
    }
  }, [open]);

  const handleStartWalkthrough = async () => {
    if (!selectedFloorId || !user?.id) {
      toast.error('Please select a floor');
      return;
    }

    try {
      const session = await startMutation.mutateAsync({
        floor_id: selectedFloorId,
        hallway_id: selectedHallwayId || undefined,
        started_by: user.id,
      });

      setSessionId(session.id);
      setStep('scanning');
      toast.success('Walkthrough started');
    } catch (error) {
      toast.error('Failed to start walkthrough');
    }
  };

  const handleScanAction = async (action: FixtureScanAction) => {
    // Check if this action needs electrician confirmation
    if (action === 'ballast_issue' || action === 'power_issue') {
      setPendingAction(action);
      setShowElectricianPrompt(true);
      return;
    }

    await recordScan(action, false);
  };

  const handleElectricianConfirm = async (needsElectrician: boolean) => {
    if (!pendingAction) return;
    
    setRequiresElectrician(needsElectrician);
    await recordScan(pendingAction, needsElectrician);
    setShowElectricianPrompt(false);
    setPendingAction(null);
  };

  const recordScan = async (action: FixtureScanAction, needsElectrician: boolean) => {
    if (!sessionId || !currentFixture || !user?.id) return;

    try {
      await scanMutation.mutateAsync({
        walkthrough_id: sessionId,
        fixture_id: currentFixture.id,
        action_taken: action,
        scanned_by: user.id,
        scan_location: currentFixture.room_number || undefined,
      });

      // Move to next fixture or complete
      if (currentFixtureIndex < walkthroughFixtures.length - 1) {
        setCurrentFixtureIndex(prev => prev + 1);
        setRequiresElectrician(false);
      } else {
        // All fixtures scanned - complete walkthrough
        await handleComplete();
      }

      await refetchSession();
    } catch (error) {
      toast.error('Failed to record scan');
    }
  };

  const handleComplete = async () => {
    if (!sessionId) return;

    try {
      await completeMutation.mutateAsync(sessionId);
      setStep('summary');
      toast.success('Walkthrough completed');
    } catch (error) {
      toast.error('Failed to complete walkthrough');
    }
  };

  const handleClose = () => {
    if (step === 'scanning' && sessionId) {
      // Warn user about incomplete walkthrough
      if (confirm('Walkthrough is in progress. Progress will be saved. Close anyway?')) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] sm:h-auto sm:max-w-2xl sm:mx-auto"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Lighting Walkthrough
          </SheetTitle>
          <SheetDescription>
            {step === 'setup' && 'Select floor and hallway to begin'}
            {step === 'scanning' && 'Tap each fixture status as you walk'}
            {step === 'summary' && 'Walkthrough complete'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Setup Step */}
          {step === 'setup' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Select value={selectedFloorId} onValueChange={setSelectedFloorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {floors.map((floor: any) => (
                        <SelectItem key={floor.id} value={floor.id}>
                          Floor {floor.floor_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFloorId && hallways.length > 0 && (
                  <div className="space-y-2">
                    <Label>Hallway (Optional)</Label>
                    <Select value={selectedHallwayId} onValueChange={setSelectedHallwayId}>
                      <SelectTrigger>
                        <SelectValue placeholder="All hallways" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All hallways</SelectItem>
                        {hallways.map((hallway: any) => (
                          <SelectItem key={hallway.id} value={hallway.id}>
                            {hallway.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {selectedFloorId && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Fixtures to check:</span>
                        <Badge variant="secondary">{walkthroughFixtures.length}</Badge>
                      </div>
                      {lastWalkthrough && (
                        <div className="text-sm text-muted-foreground">
                          Last walkthrough: {format(new Date(lastWalkthrough.started_at), 'PPp')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleStartWalkthrough}
                disabled={!selectedFloorId || walkthroughFixtures.length === 0 || startMutation.isPending}
                className="w-full"
                size="lg"
              >
                {startMutation.isPending ? 'Starting...' : 'Start Walkthrough'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Scanning Step */}
          {step === 'scanning' && currentFixture && (
            <div className="space-y-6">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Fixture {currentFixtureIndex + 1} of {walkthroughFixtures.length}
                  </span>
                  <span className="text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Current Fixture Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <h4 className="font-semibold">{currentFixture.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {currentFixture.room_number || 'Unknown location'}
                        </div>
                      </div>
                    </div>
                    {currentFixture.emergency_circuit && (
                      <Badge variant="outline" className="border-amber-500 text-amber-600">
                        Emergency Circuit
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Electrician Prompt */}
              {showElectricianPrompt && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <p className="text-sm font-medium">Requires licensed electrician?</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleElectricianConfirm(true)}
                          variant="destructive"
                          className="flex-1"
                        >
                          Yes
                        </Button>
                        <Button
                          onClick={() => handleElectricianConfirm(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          No
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {!showElectricianPrompt && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleScanAction('functional')}
                    disabled={scanMutation.isPending}
                    variant="outline"
                    size="lg"
                    className="h-20 flex-col gap-2 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30"
                  >
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium">Functional</span>
                  </Button>

                  <Button
                    onClick={() => handleScanAction('bulb_out')}
                    disabled={scanMutation.isPending}
                    variant="outline"
                    size="lg"
                    className="h-20 flex-col gap-2 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/30"
                  >
                    <Lightbulb className="h-6 w-6 text-orange-600" />
                    <span className="text-sm font-medium">Bulb Out</span>
                  </Button>

                  <Button
                    onClick={() => handleScanAction('ballast_issue')}
                    disabled={scanMutation.isPending}
                    variant="outline"
                    size="lg"
                    className="h-20 flex-col gap-2 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                  >
                    <Zap className="h-6 w-6 text-red-600" />
                    <span className="text-sm font-medium">Ballast Issue</span>
                  </Button>

                  <Button
                    onClick={() => handleScanAction('flickering')}
                    disabled={scanMutation.isPending}
                    variant="outline"
                    size="lg"
                    className="h-20 flex-col gap-2 border-yellow-200 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-950/30"
                  >
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                    <span className="text-sm font-medium">Flickering</span>
                  </Button>

                  <Button
                    onClick={() => handleScanAction('skip')}
                    disabled={scanMutation.isPending}
                    variant="ghost"
                    size="lg"
                    className="h-20 flex-col gap-2 col-span-2"
                  >
                    <SkipForward className="h-6 w-6" />
                    <span className="text-sm font-medium">Skip</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Summary Step */}
          {step === 'summary' && session && (
            <div className="space-y-6">
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Walkthrough Complete</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(), 'PPp')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Checked</p>
                      <p className="text-2xl font-bold">{session.fixtures_checked}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Issues Found</p>
                      <p className="text-2xl font-bold text-orange-600">{session.issues_found}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Ballast Issues</p>
                      <p className="text-xl font-bold text-red-600">{session.ballast_issues_found}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
