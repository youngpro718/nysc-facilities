import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  userId: string;
  initialValue?: boolean;
  disabled?: boolean;
}

/**
 * Admin-only toggle for the "Supervisor" flag on a user's profile. When
 * enabled, that user's 4-digit supply order code is treated as a supervisor
 * approval code by the supplies cart (item- and category-flagged items get
 * approved instantly when someone enters this person's code, and the trigger
 * fires a notification to them). A code is auto-generated on first toggle via
 * the ensure_supervisor_code trigger.
 */
export function SupervisorToggle({ userId, initialValue, disabled }: Props) {
  const qc = useQueryClient();
  const key = ['profile-is-supervisor', userId];

  const { data } = useQuery({
    queryKey: key,
    initialData: initialValue,
    enabled: initialValue === undefined,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_supervisor')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data?.is_supervisor === true;
    },
  });

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_supervisor: next })
        .eq('id', userId);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      qc.setQueryData(key, next);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(next ? 'Marked as supervisor' : 'Supervisor flag removed');
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Could not update supervisor flag');
    },
  });

  return (
    <div className="flex items-center gap-2">
      <Shield className={`h-3.5 w-3.5 ${data ? 'text-amber-500' : 'text-muted-foreground'}`} />
      <Label htmlFor={`sup-${userId}`} className="text-xs font-medium">
        Supervisor
      </Label>
      <Switch
        id={`sup-${userId}`}
        checked={!!data}
        disabled={disabled || mutation.isPending}
        onCheckedChange={(v) => mutation.mutate(v)}
      />
    </div>
  );
}
