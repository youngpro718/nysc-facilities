import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Users, 
  UserX, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Building2,
  Wrench
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface TodaysStatusProps {
  onNavigateToTab?: (tab: string) => void;
}

export function TodaysStatusDashboard({ onNavigateToTab }: TodaysStatusProps) {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch today's absences
  const { data: absences } = useQuery({
    queryKey: ['todays-absences', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_absences')
        .select(`
          *,
          staff:staff_id (display_name, role)
        `)
        .lte('starts_on', today)
        .gte('ends_on', today);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch active conflicts
  const { data: conflicts } = useQuery({
    queryKey: ['active-conflicts'],
    queryFn: async () => {
      // This would call your conflict detection service
      // For now, returning mock structure
      return {
        hasConflicts: false,
        conflicts: [],
        warnings: []
      };
    },
  });

  // Fetch room shutdowns
  const { data: shutdowns } = useQuery({
    queryKey: ['active-shutdowns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('room_shutdowns')
        .select('*, court_rooms(room_number)')
        .in('status', ['in_progress', 'scheduled']);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch today's sessions count
  const { data: sessionsCount } = useQuery({
    queryKey: ['todays-sessions-count', today],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('court_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('session_date', today);
      
      if (error) throw error;
      return count || 0;
    },
  });

  const judgesOut = absences?.filter(a => a.staff?.role === 'judge').length || 0;
  const clerksOut = absences?.filter(a => a.staff?.role === 'clerk').length || 0;
  const needsCoverage = absences?.filter(a => !a.coverage_assigned).length || 0;
  const activeShutdowns = shutdowns?.length || 0;
  const totalIssues = judgesOut + clerksOut + activeShutdowns + (conflicts?.conflicts.length || 0);

  const handleNavigate = (tab: string) => {
    if (onNavigateToTab) {
      onNavigateToTab(tab);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Today's Status</h2>
        <p className="text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Alert Banner if issues */}
      {totalIssues > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Attention Required</AlertTitle>
          <AlertDescription>
            {totalIssues} {totalIssues === 1 ? 'issue needs' : 'issues need'} your attention today.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sessions Today */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Sessions Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{sessionsCount}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs mt-1"
              onClick={() => handleNavigate('daily-sessions')}
            >
              View all sessions <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Staff Absences */}
        <Card className={needsCoverage > 0 ? 'border-amber-500' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-500" />
              Staff Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{judgesOut + clerksOut}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {judgesOut} judges • {clerksOut} clerks
            </div>
            {needsCoverage > 0 && (
              <Badge variant="destructive" className="mt-2">
                {needsCoverage} need coverage
              </Badge>
            )}
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs mt-1"
              onClick={() => handleNavigate('management')}
            >
              Manage absences <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Room Shutdowns */}
        <Card className={activeShutdowns > 0 ? 'border-orange-500' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-500" />
              Room Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeShutdowns}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Rooms unavailable
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs mt-1"
              onClick={() => handleNavigate('assignments')}
            >
              View assignments <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Conflicts */}
        <Card className={conflicts?.hasConflicts ? 'border-red-500' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {conflicts?.hasConflicts ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              Conflicts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {conflicts?.conflicts.length || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {conflicts?.hasConflicts ? 'Detected' : 'None detected'}
            </div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs mt-1"
              onClick={() => handleNavigate('management')}
            >
              View details <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Actions Needed */}
      {(needsCoverage > 0 || activeShutdowns > 0 || conflicts?.hasConflicts) && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Urgent Actions Needed
            </CardTitle>
            <CardDescription>
              These items require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Coverage Needed */}
            {needsCoverage > 0 && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>Coverage Assignments</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{needsCoverage} staff absences need coverage assigned</span>
                  <Button 
                    size="sm" 
                    onClick={() => handleNavigate('management')}
                  >
                    Assign Coverage
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Room Shutdowns */}
            {activeShutdowns > 0 && (
              <Alert>
                <Wrench className="h-4 w-4" />
                <AlertTitle>Room Unavailable</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{activeShutdowns} {activeShutdowns === 1 ? 'room is' : 'rooms are'} shut down or in maintenance</span>
                  <Button 
                    size="sm" 
                    onClick={() => handleNavigate('assignments')}
                  >
                    View Rooms
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Conflicts */}
            {conflicts?.hasConflicts && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Scheduling Conflicts</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{conflicts.conflicts.length} conflicts detected in assignments</span>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleNavigate('management')}
                  >
                    Resolve
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Clear Message */}
      {totalIssues === 0 && (
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="py-8">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Systems Operational</h3>
              <p className="text-muted-foreground">
                No urgent issues detected. All assignments are in order.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => handleNavigate('daily-sessions')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Today's Sessions
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => handleNavigate('assignments')}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Assignments
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => handleNavigate('management')}
            >
              <UserX className="h-4 w-4 mr-2" />
              Record Absence
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
