// Staff Tasks — CRUD operations for staff task management
/**
 * useStaffTasks Hook
 * 
 * Manages staff task CRUD operations and state
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/core/supabaseClient';
import { useAuth } from '@features/auth/hooks/useAuth';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errorUtils';
import type { 
  StaffTask, 
  StaffTaskHistory, 
  CreateTaskInput, 
  RequestTaskInput,
  TaskStatus 
} from '@features/tasks/types/staffTasks';

export function useStaffTasks(options?: { 
  status?: TaskStatus | TaskStatus[];
  userId?: string;
  onlyMyTasks?: boolean;
  onlyRequests?: boolean;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tasks
  const tasksQuery = useQuery({
    queryKey: ['staff-tasks', options],
    queryFn: async () => {
      let query = supabase
        .from('staff_tasks')
        .select(`
          *,
          requester:profiles!staff_tasks_requested_by_profiles_fkey(full_name, email),
          creator:profiles!staff_tasks_created_by_profiles_fkey(full_name),
          assignee:profiles!staff_tasks_assigned_to_profiles_fkey(full_name),
          claimer:profiles!staff_tasks_claimed_by_profiles_fkey(full_name),
          approver:profiles!staff_tasks_approved_by_profiles_fkey(full_name),
          inventory_item:inventory_items(name, sku),
          from_room:rooms!staff_tasks_from_room_id_fkey(room_number, name),
          to_room:rooms!staff_tasks_to_room_id_fkey(room_number, name)
        `)
        .order('created_at', { ascending: false });

      // Filter by status
      if (options?.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      // Filter by user
      if (options?.userId) {
        query = query.eq('requested_by', options.userId);
      }

      // Only my tasks (claimed by me or assigned to me)
      if (options?.onlyMyTasks && user?.id) {
        query = query.or(`claimed_by.eq.${user.id},assigned_to.eq.${user.id}`);
      }

      // Only requests (pending approval)
      if (options?.onlyRequests) {
        query = query.eq('is_request', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as StaffTask[];
    },
    enabled: !!user,
  });

  // Create a direct task (manager/admin)
  const createTask = useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase
        .from('staff_tasks')
        .insert({
          ...input,
          created_by: user!.id,
          is_request: false,
          status: 'approved', // Direct tasks are pre-approved
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['room-planned-tasks'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to create task', { description: getErrorMessage(error) });
    },
  });

  // Submit a task request (regular user)
  const requestTask = useMutation({
    mutationFn: async (input: RequestTaskInput) => {
      const { data, error } = await supabase
        .from('staff_tasks')
        .insert({
          ...input,
          created_by: user!.id,
          requested_by: user!.id,
          is_request: true,
          status: 'pending_approval',
          priority: 'medium',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Task request submitted');
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to submit request', { description: getErrorMessage(error) });
    },
  });

  // Approve a task request. Approval is a pure, after-the-fact review — it
  // must never regress a task that has already moved past pending_approval
  // (e.g. an aide claimed it directly before anyone reviewed it). The
  // approved_by/approved_at stamp is always recorded; the status only flips
  // to 'approved' if the task is still sitting unclaimed in pending_approval.
  const approveTask = useMutation({
    mutationFn: async ({ taskId, assignTo }: { taskId: string; assignTo?: string }) => {
      const { data: current, error: fetchError } = await supabase
        .from('staff_tasks')
        .select('status, claimed_by')
        .eq('id', taskId)
        .single();

      if (fetchError) throw fetchError;

      const now = new Date().toISOString();
      const updatePayload: Record<string, unknown> = {
        approved_by: user!.id,
        approved_at: now,
      };

      const stillUnclaimed = current.status === 'pending_approval' && !current.claimed_by;
      if (stillUnclaimed) {
        updatePayload.status = 'approved';
        if (assignTo !== undefined) updatePayload.assigned_to = assignTo || null;
      }

      const { data, error } = await supabase
        .from('staff_tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Task approved');
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to approve task', { description: getErrorMessage(error) });
    },
  });

  // Reject a task request
  const rejectTask = useMutation({
    mutationFn: async ({ taskId, reason }: { taskId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Task rejected');
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to reject task', { description: getErrorMessage(error) });
    },
  });

  // Claim a task
  const claimTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'claimed',
          claimed_by: user!.id,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Task claimed');
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to claim task', { description: getErrorMessage(error) });
    },
  });

  // Release a claim — returns a claimed/in_progress task back to the
  // Available pool without approving/rejecting it. Used by the claimant to
  // back out of work they picked up.
  const releaseClaim = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'approved',
          claimed_by: null,
          claimed_at: null,
          started_at: null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Claim released');
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to release claim', { description: getErrorMessage(error) });
    },
  });

  // Delete a task permanently (admin/facilities manager only — RLS enforced)
  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('staff_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Task deleted');
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['room-planned-tasks'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete task', { description: getErrorMessage(error) });
    },
  });

  // Start a task
  const startTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Task started');
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to start task', { description: getErrorMessage(error) });
    },
  });

  // Complete a task
  const completeTask = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_notes: notes || null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // If this is a move_item task, update the inventory item's location
      const { data: taskData } = await supabase
        .from('staff_tasks')
        .select('task_type, inventory_item_id, to_room_id')
        .eq('id', taskId)
        .single();

      if (taskData?.task_type === 'move_item' && taskData?.inventory_item_id && taskData?.to_room_id) {
        await supabase
          .from('inventory_items')
          .update({
            storage_room_id: taskData.to_room_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', taskData.inventory_item_id);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Task completed');
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['room-planned-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to complete task', { description: getErrorMessage(error) });
    },
  });

  // Cancel a task
  const cancelTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'cancelled',
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Task cancelled');
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['room-planned-tasks'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to cancel task', { description: getErrorMessage(error) });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    refetch: tasksQuery.refetch,
    
    // Mutations
    createTask,
    requestTask,
    approveTask,
    rejectTask,
    claimTask,
    releaseClaim,
    deleteTask,
    startTask,
    completeTask,
    cancelTask,
  };
}

/**
 * Cancel a task request as its own requester (used from My Requests).
 * RLS already lets the creator (`created_by = auth.uid()`) update the row at
 * any status, so we scope the update client-side to the still-cancellable
 * window — unclaimed and pending_approval/approved — and treat zero rows
 * updated (e.g. someone claimed it in the meantime) as a failure.
 */
export async function cancelStaffTaskRequest(taskId: string): Promise<void> {
  const { data, error } = await supabase
    .from('staff_tasks')
    .update({ status: 'cancelled' })
    .eq('id', taskId)
    .is('claimed_by', null)
    .in('status', ['pending_approval', 'approved'])
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('This request can no longer be cancelled.');
  }
}

// Hook for task history
export function useTaskHistory(taskId: string) {
  return useQuery({
    queryKey: ['staff-task-history', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_task_history')
        .select(`
          *,
          performer:profiles!staff_task_history_performed_by_profiles_fkey(full_name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StaffTaskHistory[];
    },
    enabled: !!taskId,
  });
}
