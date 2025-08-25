import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Settings, History, Lightbulb } from "lucide-react";
import { format, differenceInDays, isAfter, isWithinInterval, subDays } from "date-fns";
import { EnhancedRoom } from "../../types/EnhancedRoomTypes";

interface RoomHistoryTimelineProps {
  room: EnhancedRoom;
}

interface HistoryEvent {
  date: string;
  type: 'issue_created' | 'issue_resolved' | 'quick_fix' | 'temp_fix' | 'ongoing_issue';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolutionSpeed?: 'quick' | 'normal' | 'slow' | 'ongoing';
  category: 'lighting' | 'maintenance' | 'safety' | 'access' | 'other';
}

export function RoomHistoryTimeline({ room }: RoomHistoryTimelineProps) {
  // Mock data based on room's history stats - in real implementation this would come from issues/events
  const generateHistoryEvents = (): HistoryEvent[] => {
    const events: HistoryEvent[] = [];
    const today = new Date();
    
    // Generate events based on room stats
    if (room.history_stats?.total_issues > 0) {
      // Recent lighting issues
      events.push({
        date: format(subDays(today, 5), 'yyyy-MM-dd'),
        type: 'issue_resolved',
        title: 'Lighting Issue Resolved',
        description: 'Fluorescent ballast replaced in main area - quick fix',
        severity: 'medium',
        resolutionSpeed: 'quick',
        category: 'lighting'
      });
      
      if (room.history_stats.total_issues > 2) {
        events.push({
          date: format(subDays(today, 15), 'yyyy-MM-dd'),
          type: 'temp_fix',
          title: 'HVAC Temporary Fix',
          description: 'Temperature control adjusted - ongoing monitoring required',
          severity: 'medium',
          resolutionSpeed: 'ongoing',
          category: 'maintenance'
        });
      }
      
      if (room.history_stats.total_issues > 5) {
        events.push({
          date: format(subDays(today, 30), 'yyyy-MM-dd'),
          type: 'issue_created',
          title: 'Door Handle Issue',
          description: 'Door handle becoming loose - scheduled for maintenance',
          severity: 'low',
          resolutionSpeed: 'normal',
          category: 'maintenance'
        });
      }
    }
    
    // Room function changes
    if (room.function_change_date) {
      events.push({
        date: room.function_change_date,
        type: 'quick_fix',
        title: 'Room Function Updated',
        description: `Room repurposed to ${room.current_function || room.room_type}`,
        severity: 'low',
        resolutionSpeed: 'quick',
        category: 'other'
      });
    }
    
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const events = generateHistoryEvents();
  
  const getResolutionBadge = (speed?: string) => {
    switch (speed) {
      case 'quick':
        return <Badge variant="default" className="bg-success text-success-foreground text-xs">Quick Fix</Badge>;
      case 'normal':
        return <Badge variant="secondary" className="text-xs">Resolved</Badge>;
      case 'slow':
        return <Badge variant="outline" className="text-xs border-warning text-warning-foreground">Slow Resolution</Badge>;
      case 'ongoing':
        return <Badge variant="destructive" className="text-xs">Ongoing</Badge>;
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
        return 'border-destructive bg-destructive/10';
      case 'high':
        return 'border-warning bg-warning/10';
      case 'medium':
        return 'border-info bg-info/10';
      default:
        return 'border-muted bg-muted/30';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No recent issues - room running smoothly</p>
      </div>
    );
  }

  // Generate summary insights
  const quickFixes = events.filter(e => e.resolutionSpeed === 'quick').length;
  const ongoingIssues = events.filter(e => e.resolutionSpeed === 'ongoing').length;
  const recentIssues = events.filter(e => 
    isAfter(new Date(e.date), subDays(new Date(), 30))
  ).length;

  return (
    <div className="space-y-4">
      {/* Summary insights */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-muted/30 rounded-md">
          <div className="text-sm font-bold text-success">{quickFixes}</div>
          <div className="text-xs text-muted-foreground">Quick Fixes</div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded-md">
          <div className="text-sm font-bold text-warning">{ongoingIssues}</div>
          <div className="text-xs text-muted-foreground">Ongoing</div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded-md">
          <div className="text-sm font-bold text-foreground">{recentIssues}</div>
          <div className="text-xs text-muted-foreground">This Month</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {events.slice(0, 6).map((event, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-md border-l-4 transition-colors ${getSeverityColor(event.severity)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                  {getCategoryIcon(event.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-sm font-medium text-foreground truncate">
                      {event.title}
                    </h5>
                    {getResolutionBadge(event.resolutionSpeed)}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
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
        
        {events.length > 6 && (
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              + {events.length - 6} more historical events
            </p>
          </div>
        )}
      </div>
    </div>
  );
}