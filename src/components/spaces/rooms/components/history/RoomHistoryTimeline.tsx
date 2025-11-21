import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Settings, History, Lightbulb, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { format, differenceInDays, isAfter, isWithinInterval, subDays } from "date-fns";
import { EnhancedRoom } from "../../types/EnhancedRoomTypes";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

interface RoomHistoryTimelineProps {
  room: EnhancedRoom;
}

interface HistoryEvent {
  id: string;
  date: string;
  type: 'issue_created' | 'issue_resolved' | 'quick_fix' | 'temp_fix' | 'ongoing_issue';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolutionSpeed?: 'quick' | 'normal' | 'slow' | 'ongoing';
  category: 'lighting' | 'maintenance' | 'safety' | 'access' | 'other';
  status: string;
}

export function RoomHistoryTimeline({ room }: RoomHistoryTimelineProps) {
  const [realEvents, setRealEvents] = useState<HistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Fetch real data from database
  useEffect(() => {
    const fetchRoomHistory = async () => {
      setIsLoading(true);
      try {
        // Fetch ALL issues for this room, regardless of status
        const { data: roomIssues, error } = await supabase
          .from('issues')
          .select('*')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Convert issues to history events
        const events: HistoryEvent[] = (roomIssues || []).map((issue: any) => {
          const resolutionSpeed = issue.status === 'resolved' || issue.status === 'closed'
            ? getResolutionSpeed(issue.created_at, issue.updated_at)
            : 'ongoing';
            
          return {
            id: issue.id,
            date: issue.created_at || new Date().toISOString(),
            type: (issue.status === 'resolved' || issue.status === 'closed') ? 'issue_resolved' : 'issue_created',
            title: issue.title || 'Issue',
            description: issue.description || 'No description available',
            severity: (issue.priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
            resolutionSpeed,
            category: getCategoryFromIssue(issue),
            status: issue.status
          };
        });

        // Add room function changes from previous_functions
        if (room.previous_functions && Array.isArray(room.previous_functions)) {
          room.previous_functions.forEach((func: any) => {
            events.push({
              id: `func-${func.date}`,
              date: func.date || room.function_change_date || new Date().toISOString(),
              type: 'quick_fix',
              title: 'Room Function Changed',
              description: `Room repurposed from ${func.type?.replace(/_/g, ' ')} - ${func.reason || 'No reason provided'}`,
              severity: 'low',
              resolutionSpeed: func.temporary ? 'ongoing' : 'quick',
              category: 'other',
              status: 'completed'
            });
          });
        }

        setRealEvents(events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error('Error fetching room history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomHistory();
  }, [room.id]);

  const getResolutionSpeed = (createdAt: string, updatedAt: string): 'quick' | 'normal' | 'slow' | 'ongoing' => {
    const created = new Date(createdAt);
    const updated = new Date(updatedAt);
    const diffHours = differenceInDays(updated, created) * 24;
    
    if (diffHours <= 24) return 'quick';
    if (diffHours <= 72) return 'normal';
    return 'slow';
  };

  const getCategoryFromIssue = (issue: any): 'lighting' | 'maintenance' | 'safety' | 'access' | 'other' => {
    const title = (issue.title || '').toLowerCase();
    const description = (issue.description || '').toLowerCase();
    
    if (title.includes('light') || description.includes('light') || title.includes('bulb')) return 'lighting';
    if (title.includes('door') || description.includes('access') || title.includes('key')) return 'access';
    if (title.includes('safety') || issue.priority === 'critical') return 'safety';
    if (title.includes('maintenance') || title.includes('repair')) return 'maintenance';
    return 'other';
  };

  const getResolutionBadge = (speed?: string) => {
    switch (speed) {
      case 'quick':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-[10px] px-1 py-0">Quick Fix</Badge>;
      case 'normal':
        return <Badge variant="secondary" className="text-[10px] px-1 py-0">Resolved</Badge>;
      case 'slow':
        return <Badge variant="outline" className="text-[10px] px-1 py-0 border-yellow-500 text-yellow-600">Slow Resolution</Badge>;
      case 'ongoing':
        return <Badge variant="destructive" className="text-[10px] px-1 py-0">Ongoing</Badge>;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lighting':
        return <Lightbulb className="h-3 w-3" />;
      case 'maintenance':
        return <Settings className="h-3 w-3" />;
      case 'safety':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <History className="h-3 w-3" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'border-l-gray-300 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (isLoading) {
    return <div className="text-center py-4 text-xs text-muted-foreground">Loading history...</div>;
  }

  if (realEvents.length === 0) {
    return (
      <div className="text-center py-6 bg-muted/10 rounded-lg border border-dashed">
        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-80" />
        <p className="text-sm font-medium text-foreground">No Recorded Issues</p>
        <p className="text-xs text-muted-foreground">This room has a clean history.</p>
      </div>
    );
  }

  // Generate summary insights
  const quickFixes = realEvents.filter(e => e.resolutionSpeed === 'quick').length;
  const ongoingIssues = realEvents.filter(e => e.resolutionSpeed === 'ongoing').length;
  const recentIssues = realEvents.filter(e => 
    isAfter(new Date(e.date), subDays(new Date(), 30))
  ).length;

  const displayedEvents = showAll ? realEvents : realEvents.slice(0, 5);

  const handleEventClick = (event: HistoryEvent) => {
    if (event.type === 'quick_fix' && event.id.startsWith('func-')) {
      // Room function changes aren't issues, so no detail view
      return;
    }
    // Navigate to operations page with issue_id to open the dialog
    navigate(`/operations?tab=issues&issue_id=${event.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Summary insights */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-muted/30 rounded-md border">
          <div className="text-sm font-bold text-green-600">{quickFixes}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Quick Fixes</div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded-md border">
          <div className="text-sm font-bold text-orange-600">{ongoingIssues}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Ongoing</div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded-md border">
          <div className="text-sm font-bold text-blue-600">{recentIssues}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">This Month</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3 relative">
        {displayedEvents.map((event, index) => (
          <div 
            key={event.id} 
            className={`p-3 rounded-r-md border-l-4 transition-all hover:bg-muted/50 cursor-pointer group ${getSeverityColor(event.severity)}`}
            onClick={() => handleEventClick(event)}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                  {getCategoryIcon(event.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h5 className="text-sm font-medium text-foreground truncate max-w-[150px] group-hover:text-primary transition-colors">
                      {event.title}
                    </h5>
                    {getResolutionBadge(event.resolutionSpeed)}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity ml-auto" />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(event.date), 'MMM d, yyyy')}
                    <span className="text-muted-foreground/60">
                      • {differenceInDays(new Date(), new Date(event.date))} days ago
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {realEvents.length > 5 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs text-muted-foreground hover:text-foreground h-8 mt-2"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                View {realEvents.length - 5} More Events
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}