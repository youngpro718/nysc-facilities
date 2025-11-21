import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronDown, 
  ChevronUp,
  X, 
  CheckCircle2, 
  AlertCircle, 
  Wrench,
  Calendar,
  Zap
} from "lucide-react";
import { LightingFixture } from "@/types/lighting";
import { QuickAction } from "@/types/walkthrough";
import { performQuickAction } from "@/services/walkthroughService";
import { getFixtureLocationText, getFixtureFullLocationText } from "../utils/location";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface QuickMarkFixtureCardProps {
  fixture: LightingFixture;
}

export function QuickMarkFixtureCard({ fixture }: QuickMarkFixtureCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const handleQuickAction = async (action: QuickAction) => {
    setIsProcessing(true);
    try {
      const result = await performQuickAction(fixture.id, action, notes);
      
      if (result.success) {
        toast.success(result.message);
        setNotes("");
        setExpanded(false);
        
        // Refresh fixture data
        queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to perform action");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = () => {
    switch (fixture.status) {
      case 'functional':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'non_functional':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'maintenance_needed':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = () => {
    switch (fixture.status) {
      case 'functional':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'non_functional':
        return <X className="h-4 w-4" />;
      case 'maintenance_needed':
        return <Wrench className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getOutageDuration = () => {
    if (fixture.status === 'non_functional' && fixture.reported_out_date) {
      try {
        return formatDistanceToNow(new Date(fixture.reported_out_date), { addSuffix: true });
      } catch {
        return null;
      }
    }
    return null;
  };

  const getPrimaryAction = () => {
    if (fixture.status === 'non_functional') {
      return {
        label: 'Mark Functional',
        action: 'mark_functional' as QuickAction,
        variant: 'default' as const,
        className: 'bg-green-600 hover:bg-green-700 text-white'
      };
    }
    return {
      label: 'Mark OUT',
      action: 'mark_out' as QuickAction,
      variant: 'destructive' as const,
      className: ''
    };
  };

  const primaryAction = getPrimaryAction();
  const outageDuration = getOutageDuration();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        {/* Main Card - Always Visible */}
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-3">
            {/* Status Indicator */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor()} border`}>
              {getStatusIcon()}
            </div>

            {/* Fixture Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm leading-tight">
                  {fixture.name}
                </h3>
                {expanded ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">
                {getFixtureLocationText(fixture)}
              </p>

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">
                  {fixture.technology || 'Unknown'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {fixture.bulb_count} bulb{fixture.bulb_count !== 1 ? 's' : ''}
                </Badge>
                {fixture.ballast_issue && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Ballast
                  </Badge>
                )}
                {outageDuration && (
                  <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                    OUT {outageDuration}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Button - Always Visible */}
          <div className="mt-3">
            <Button
              size="sm"
              variant={primaryAction.variant}
              className={`w-full ${primaryAction.className}`}
              onClick={(e) => {
                e.stopPropagation();
                handleQuickAction(primaryAction.action);
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : primaryAction.label}
            </Button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="border-t bg-muted/30 p-4 space-y-4">
            {/* Full Location */}
            <div className="text-xs space-y-1">
              <span className="font-medium text-muted-foreground">Full Location:</span>
              <p className="text-foreground">{getFixtureFullLocationText(fixture)}</p>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Position:</span>
                <p className="font-medium capitalize">{fixture.position}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium capitalize">{fixture.type}</p>
              </div>
            </div>

            {/* Status History */}
            {fixture.reported_out_date && (
              <div className="text-xs space-y-1">
                <span className="font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last Reported OUT:
                </span>
                <p className="text-foreground">
                  {new Date(fixture.reported_out_date).toLocaleString()}
                </p>
              </div>
            )}

            {/* Notes Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Add Note (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this fixture..."
                rows={3}
                className="text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* All Actions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">All Actions:</p>
              
              {fixture.status !== 'non_functional' && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAction('mark_out');
                  }}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Mark as OUT
                </Button>
              )}

              {fixture.status === 'non_functional' && !fixture.ballast_issue && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start border-orange-300 text-orange-600 hover:bg-orange-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAction('ballast_issue');
                  }}
                  disabled={isProcessing}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Flag Ballast Issue
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickAction('maintenance_needed');
                }}
                disabled={isProcessing}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Maintenance Needed
              </Button>

              {fixture.status !== 'functional' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-start border-green-300 text-green-600 hover:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickAction('mark_functional');
                  }}
                  disabled={isProcessing}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Functional
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
