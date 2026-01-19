/**
 * useStaffTasks Hook
 * 
 * Manages staff task CRUD operations and state
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { 
  StaffTask, 
  StaffTaskHistory, 
  CreateTaskInput, 
  RequestTaskInput,
  TaskStatus 
} from '@/types/staffTasks';

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
    },
    onError: (error: any) => {
      toast.error('Failed to create task', { description: error.message });
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
    onError: (error: any) => {
      toast.error('Failed to submit request', { description: error.message });
    },
  });

  // Approve a task request
  const approveTask = useMutation({
    mutationFn: async ({ taskId, assignTo }: { taskId: string; assignTo?: string }) => {
      const { data, error } = await supabase
        .from('staff_tasks')
        .update({
          status: 'approved',
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
          assigned_to: assignTo || null,
        })
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
    onError: (error: any) => {
      toast.error('Failed to approve task', { description: error.message });
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
    onError: (error: any) => {
      toast.error('Failed to reject task', { description: error.message });
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
    onError: (error: any) => {
      toast.error('Failed to claim task', { description: error.message });
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
    onError: (error: any) => {
      toast.error('Failed to start task', { description: error.message });
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
      return data;
    },
    onSuccess: () => {
      toast.success('Task completed');
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] });
    },
    onError: (error: any) => {
      toast.error('Failed to complete task', { description: error.message });
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
    },
    onError: (error: any) => {
      toast.error('Failed to cancel task', { description: error.message });
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
    startTask,
    completeTask,
    cancelTask,
  };
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
          performer:profiles!staff_task_history_performed_by_fkey(full_name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as StaffTaskHistory[];
    },
    enabled: !!taskId,
  });
}
