import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface LightingFixtureWithTicket {
  id: string;
  name: string;
  position: string | null;
  status: string;
  reported_out_date: string | null;
  ballast_issue: boolean;
  replaced_date: string | null;
  issue_id: string | null;
  outage_duration_days: number | null;
  // Ticket info when linked
  ticket?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    created_at: string;
    days_since_submitted: number;
  } | null;
}

export function useLightingWithTickets(roomId: string | null) {
  return useQuery({
    queryKey: ['lighting-with-tickets', roomId],
    queryFn: async (): Promise<LightingFixtureWithTicket[]> => {
      if (!roomId) return [];

      // Get fixtures with their linked issues
      const { data: fixtures, error } = await supabase
        .from('lighting_fixtures')
        .select(`
          id,
          name,
          position,
          status,
          reported_out_date,
          ballast_issue,
          replaced_date,
          issue_id
        `)
        .eq('space_type', 'room')
        .eq('space_id', roomId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Get issue details for fixtures that have linked issues
      const issueIds = (fixtures || [])
        .map(f => f.issue_id)
        .filter((id): id is string => id !== null);

      let issuesMap: Record<string, unknown> = {};
      if (issueIds.length > 0) {
        const { data: issues } = await supabase
          .from('issues')
          .select('id, title, status, priority, created_at')
          .in('id', issueIds);

        issuesMap = (issues || []).reduce((acc, issue) => {
          acc[issue.id] = issue;
          return acc;
        }, {} as Record<string, unknown>);
      }

      // Transform data
      return (fixtures || []).map((fixture) => {
        const outageDays = fixture.reported_out_date
          ? Math.floor((Date.now() - new Date(fixture.reported_out_date).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        const issue = fixture.issue_id ? issuesMap[fixture.issue_id] : null;
        const ticketDays = issue?.created_at
          ? Math.floor((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          id: fixture.id,
          name: fixture.name,
          position: fixture.position,
          status: fixture.status,
          reported_out_date: fixture.reported_out_date,
          ballast_issue: fixture.ballast_issue || false,
          replaced_date: fixture.replaced_date,
          issue_id: fixture.issue_id,
          outage_duration_days: outageDays,
          ticket: issue ? {
            id: issue.id,
            title: issue.title,
            status: issue.status,
            priority: issue.priority,
            created_at: issue.created_at,
            days_since_submitted: ticketDays || 0,
          } : null,
        };
      });
    },
    enabled: !!roomId,
    staleTime: 30_000,
  });
}
