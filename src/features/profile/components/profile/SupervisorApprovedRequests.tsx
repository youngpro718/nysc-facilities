import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@features/auth/hooks/useAuth';

interface Row {
  id: string;
  title: string;
  display_id: string | null;
  status: string;
  created_at: string;
  approved_via_code_at: string | null;
  requester: { first_name: string | null; last_name: string | null; email: string } | null;
}

/**
 * Shown on the Profile page for users flagged as supervisors. Lists the most
 * recent supply requests approved via THIS user's supervisor code, so they
 * always know which orders their code has authorized.
 */
export function SupervisorApprovedRequests() {
  const { user } = useAuth();

  const { data: isSupervisor } = useQuery({
    queryKey: ['is-supervisor', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_supervisor')
        .eq('id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.is_supervisor === true;
    },
  });

  const { data: rows = [], isLoading } = useQuery<Row[]>({
    queryKey: ['supervisor-approved-requests', user?.id],
    enabled: !!user?.id && isSupervisor === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supply_requests')
        .select(
          'id, title, display_id, status, created_at, approved_via_code_at, requester:profiles!requester_id(first_name, last_name, email)',
        )
        .eq('approved_by_supervisor_id', user!.id)
        .order('approved_via_code_at', { ascending: false, nullsFirst: false })
        .limit(25);
      if (error) throw error;
      return (data as any) as Row[];
    },
  });

  if (!isSupervisor) return null;

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-6 space-y-3">
      <div>
        <h2 className="text-base sm:text-lg font-semibold tracking-tight">
          Requests approved with your code
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Every supply order that someone submitted using your 4-digit
          supervisor code shows up here.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No one has used your code yet.
        </p>
      ) : (
        <ul className="divide-y">
          {rows.map((r) => {
            const who = r.requester
              ? `${r.requester.first_name ?? ''} ${r.requester.last_name ?? ''}`.trim() ||
                r.requester.email
              : 'Someone';
            const when = r.approved_via_code_at || r.created_at;
            return (
              <li key={r.id} className="py-2 flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {who} · {r.display_id ?? r.id.slice(0, 8)} · {r.status}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {new Date(when).toLocaleString()}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
