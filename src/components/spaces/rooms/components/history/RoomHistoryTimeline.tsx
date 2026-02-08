import React, { useEffect, useState, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, Settings, History, Lightbulb, ChevronDown, ChevronUp, ExternalLink, Filter, Shield, TrendingUp } from "lucide-react";
import { format, differenceInDays, isAfter, subDays, subMonths, subYears } from "date-fns";
import { EnhancedRoom } from "../../types/EnhancedRoomTypes";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type TimeFilter = '30d' | '90d' | '1y' | 'all';

export function RoomHistoryTimeline({ room }: RoomHistoryTimelineProps) {
  const navigate = useNavigate();
  const [realEvents, setRealEvents] = useState<HistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Fetch real data from database
  useEffect(() => {
    const fetchRoomHistory = async () => {
      setIsLoading(true);
      try {
        const { data: roomIssues, error } = await supabase
          .from('issues')
          .select('*')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const events: HistoryEvent[] = (roomIssues || []).map((issue: Record<string, unknown>) => {
          const id = String(issue.id || '');
          const createdAt = String(issue.created_at || new Date().toISOString());
          const updatedAt = String(issue.updated_at || createdAt);
          const status = String(issue.status || 'open');
          const title = String(issue.title || 'Issue');
          const description = String(issue.description || 'No description available');
          const priority = String(issue.priority || 'medium');
          const resolutionSpeed = (status === 'resolved' || status === 'closed')
            ? getResolutionSpeed(createdAt, updatedAt)
            : 'ongoing';
            
          return {
            id,
            date: createdAt,
            type: (status === 'resolved' || status === 'closed') ? 'issue_resolved' as const : 'issue_created' as const,
            title,
            description,
            severity: priority as 'low' | 'medium' | 'high' | 'critical',
            resolutionSpeed,
            category: getCategoryFromIssue(issue),
            status
          };
        });

        if (room.previous_functions && Array.isArray(room.previous_functions)) {
          room.previous_functions.forEach((func: Record<string, unknown>, idx: number) => {
            events.push({
              id: `func-${idx}-${String(func.date || 'unknown')}`,
              date: String(func.date || room.function_change_date || new Date().toISOString()),
              type: 'quick_fix',
              title: 'Room Function Changed',
              description: `Room repurposed from ${String(func.type || '').replace(/_/g, ' ')} - ${String(func.reason || 'No reason provided')}`,
              severity: 'low',
              resolutionSpeed: func.temporary ? 'ongoing' : 'quick',
              category: 'other',
              status: 'completed'
            });
          });
        }

        setRealEvents(events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        logger.error('Error fetching room history:', error);
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

  const getCategoryFromIssue = (issue: Record<string, unknown>): 'lighting' | 'maintenance' | 'safety' | 'access' | 'other' => {
    const title = String(issue.title || '').toLowerCase();
    const description = String(issue.description || '').toLowerCase();
    
    if (title.includes('light') || description.includes('light') || title.includes('bulb')) return 'lighting';
    if (title.includes('door') || description.includes('access') || title.includes('key')) return 'access';
    if (title.includes('safety') || issue.priority === 'critical') return 'safety';
    if (title.includes('maintenance') || title.includes('repair')) return 'maintenance';
    return 'other';
  };

  // Filter events by time
  const filteredEvents = useMemo(() => {
    if (timeFilter === 'all') return realEvents;
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeFilter) {
      case '30d':
        cutoffDate = subDays(now, 30);
        break;
      case '90d':
        cutoffDate = subDays(now, 90);
        break;
      case '1y':
        cutoffDate = subYears(now, 1);
        break;
      default:
        return realEvents;
    }
    
    return realEvents.filter(e => isAfter(new Date(e.date), cutoffDate));
  }, [realEvents, timeFilter]);

  // Calculate category stats for year
  const categoryStats = useMemo(() => {
    const yearAgo = subYears(new Date(), 1);
    const yearEvents = realEvents.filter(e => isAfter(new Date(e.date), yearAgo));
    
    const stats = {
      lighting: yearEvents.filter(e => e.category === 'lighting').length,
      maintenance: yearEvents.filter(e => e.category === 'maintenance').length,
      safety: yearEvents.filter(e => e.category === 'safety').length,
      access: yearEvents.filter(e => e.category === 'access').length,
      other: yearEvents.filter(e => e.category === 'other').length,
    };
    
    // Identify chronic issues (same category > 3 times this year)
    const chronicCategories = Object.entries(stats)
      .filter(([_, count]) => count >= 3)
      .map(([cat]) => cat);
    
    return { stats, chronicCategories };
  }, [realEvents]);

  const getResolutionBadge = (speed?: string) => {
    switch (speed) {
      case 'quick':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs px-1 py-0">Quick Fix</Badge>;
      case 'normal':
        return <Badge variant="secondary" className="text-xs px-1 py-0">Resolved</Badge>;
      case 'slow':
        return <Badge variant="outline" className="text-xs px-1 py-0 border-yellow-500 text-yellow-600 dark:text-yellow-400">Slow Resolution</Badge>;
      case 'ongoing':
        return <Badge variant="destructive" className="text-xs px-1 py-0">Ongoing</Badge>;
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
      case 'access':
        return <Shield className="h-3 w-3" />;
      default:
        return <History className="h-3 w-3" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/30 dark:bg-red-950/20';
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/30 dark:bg-orange-950/20';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:bg-blue-950/20';
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

  const quickFixes = filteredEvents.filter(e => e.resolutionSpeed === 'quick').length;
  const ongoingIssues = filteredEvents.filter(e => e.resolutionSpeed === 'ongoing').length;
  const recentIssues = filteredEvents.filter(e => 
    isAfter(new Date(e.date), subDays(new Date(), 30))
  ).length;

  const displayedEvents = showAll ? filteredEvents : filteredEvents.slice(0, 5);

  const handleEventClick = (event: HistoryEvent) => {
    if (event.type === 'quick_fix' && event.id.startsWith('func-')) {
      return;
    }
    navigate(`/operations?tab=issues&issue_id=${event.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Time Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" />
          <span>Filter by time</span>
        </div>
        <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d" className="text-xs">Last 30 days</SelectItem>
            <SelectItem value="90d" className="text-xs">Last 90 days</SelectItem>
            <SelectItem value="1y" className="text-xs">Last year</SelectItem>
            <SelectItem value="all" className="text-xs">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Summary (Issues by Type This Year) */}
      {categoryStats.chronicCategories.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-2 rounded-md">
          <div className="flex items-center gap-2 text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
            <span className="font-medium text-amber-700 dark:text-amber-400">Chronic Issues Detected</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {categoryStats.chronicCategories.map((cat) => (
              <Badge key={cat} variant="outline" className="text-xs capitalize border-amber-400 text-amber-700 dark:text-amber-400">
                {cat}: {categoryStats.stats[cat as keyof typeof categoryStats.stats]} this year
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Summary insights */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-muted/30 rounded-md border">
          <div className="text-sm font-bold text-green-600 dark:text-green-400">{quickFixes}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Quick Fixes</div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded-md border">
          <div className="text-sm font-bold text-orange-600 dark:text-orange-400">{ongoingIssues}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Ongoing</div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded-md border">
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{recentIssues}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">This Month</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(categoryStats.stats)
          .filter(([_, count]) => count > 0)
          .map(([cat, count]) => (
            <Badge key={cat} variant="secondary" className="text-xs capitalize gap-1">
              {getCategoryIcon(cat)}
              {cat}: {count}
            </Badge>
          ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3 relative">
        {displayedEvents.length === 0 ? (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No events in this time period
          </div>
        ) : (
          displayedEvents.map((event) => (
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
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
          ))
        )}
        
        {filteredEvents.length > 5 && (
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
                View {filteredEvents.length - 5} More Events
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
