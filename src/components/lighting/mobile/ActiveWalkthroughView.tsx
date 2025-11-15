import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Wrench,
  Flag,
  MessageSquare
} from "lucide-react";
import { getHallwayFixtures, performQuickAction, updateWalkthroughProgress, completeWalkthrough } from "@/services/walkthroughService";
import { LightingFixture } from "@/types/lighting";
import { QuickAction } from "@/types/walkthrough";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActiveWalkthroughViewProps {
  sessionId: string;
  hallwayId: string;
  floorId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function ActiveWalkthroughView({
  sessionId,
  hallwayId,
  floorId,
  onComplete,
  onCancel
}: ActiveWalkthroughViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkedFixtures, setCheckedFixtures] = useState<Set<string>>(new Set());
  const [issuesFound, setIssuesFound] = useState(0);
  const [ballastIssues, setBallastIssues] = useState(0);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  
  const queryClient = useQueryClient();

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['walkthrough-fixtures', hallwayId],
    queryFn: () => getHallwayFixtures(hallwayId),
    refetchInterval: false
  });

  const currentFixture = fixtures?.[currentIndex];
  const totalFixtures = fixtures?.length || 0;
  const progress = totalFixtures > 0 ? (checkedFixtures.size / totalFixtures) * 100 : 0;

  useEffect(() => {
    if (checkedFixtures.size > 0) {
      updateWalkthroughProgress(sessionId, checkedFixtures.size, issuesFound, ballastIssues);
    }
  }, [checkedFixtures.size, issuesFound, ballastIssues, sessionId]);

  const handleQuickAction = async (action: QuickAction) => {
    if (!currentFixture) return;

    const result = await performQuickAction(currentFixture.id, action, notes);
    
    if (result.success) {
      toast.success(result.message);
      
      // Mark as checked
      setCheckedFixtures(prev => new Set([...prev, currentFixture.id]));
      
      // Update counters
      if (action === 'mark_out') {
        setIssuesFound(prev => prev + 1);
      } else if (action === 'ballast_issue') {
        setBallastIssues(prev => prev + 1);
      }
      
      // Clear notes
      setNotes("");
      setShowNotes(false);
      
      // Invalidate fixture data
      queryClient.invalidateQueries({ queryKey: ['walkthrough-fixtures', hallwayId] });
      
      // Move to next fixture
      if (currentIndex < totalFixtures - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Last fixture, show completion dialog
        setShowCompleteDialog(true);
      }
    } else {
      toast.error(result.message);
    }
  };

  const handleSkip = () => {
    if (!currentFixture) return;
    
    setCheckedFixtures(prev => new Set([...prev, currentFixture.id]));
    
    if (currentIndex < totalFixtures - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowCompleteDialog(true);
    }
  };

  const handleComplete = async () => {
    try {
      await completeWalkthrough(sessionId, completionNotes);
      toast.success("Walkthrough completed!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete walkthrough");
    }
  };

  const getFixtureCode = () => {
    if (!currentFixture) return '';
    const hallwayCode = (currentFixture as any).hallways?.code;
    if (hallwayCode && currentFixture.sequence_number) {
      return `${hallwayCode}-${String(currentFixture.sequence_number).padStart(2, '0')}`;
    }
    return currentFixture.name;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'functional':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'non_functional':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'maintenance_needed':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading || !fixtures || !currentFixture) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading fixtures...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Active Walkthrough</h2>
              <p className="text-sm text-muted-foreground">
                Fixture {currentIndex + 1} of {totalFixtures}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {checkedFixtures.size} checked · {issuesFound} issues · {ballastIssues} ballast
            </p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{getFixtureCode()}</div>
              <Badge variant="outline" className="mt-1">
                {currentFixture.position}
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex(prev => Math.min(totalFixtures - 1, prev + 1))}
              disabled={currentIndex === totalFixtures - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Status */}
          <Card className={`border-2 ${getStatusColor(currentFixture.status)}`}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status:</span>
                  <Badge variant="outline">{currentFixture.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Technology:</span>
                  <span className="text-sm">{currentFixture.technology || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bulb Count:</span>
                  <span className="text-sm">{currentFixture.bulb_count}</span>
                </div>
                {currentFixture.ballast_issue && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Known Ballast Issue
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => handleQuickAction('mark_out')}
              variant="destructive"
              className="w-full h-14 text-lg"
            >
              <X className="h-5 w-5 mr-2" />
              Mark as OUT
            </Button>

            <Button
              onClick={() => handleQuickAction('ballast_issue')}
              variant="outline"
              className="w-full h-14 text-lg border-orange-300 text-orange-600 hover:bg-orange-50"
              disabled={currentFixture.status !== 'non_functional'}
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              Ballast Issue
            </Button>

            <Button
              onClick={() => handleQuickAction('maintenance_needed')}
              variant="outline"
              className="w-full h-14 text-lg"
            >
              <Wrench className="h-5 w-5 mr-2" />
              Maintenance Needed
            </Button>

            <Button
              onClick={() => handleQuickAction('mark_functional')}
              variant="outline"
              className="w-full h-14 text-lg border-green-300 text-green-600 hover:bg-green-50"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Mark Functional
            </Button>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {showNotes ? 'Hide Notes' : 'Add Note'}
            </Button>
            
            {showNotes && (
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this fixture..."
                rows={3}
              />
            )}
          </div>

          {/* Skip Button */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleSkip}
          >
            <Flag className="h-4 w-4 mr-2" />
            Skip This Fixture
          </Button>
        </CardContent>
      </Card>

      {/* Completion Dialog */}
      <AlertDialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Walkthrough?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>You've checked all fixtures in this hallway.</p>
                <div className="grid grid-cols-3 gap-4 py-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{totalFixtures}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{issuesFound}</div>
                    <div className="text-xs text-muted-foreground">Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{ballastIssues}</div>
                    <div className="text-xs text-muted-foreground">Ballast</div>
                  </div>
                </div>
                <Textarea
                  placeholder="Optional: Add summary notes for this walkthrough..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Walkthrough</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>Complete Walkthrough</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
