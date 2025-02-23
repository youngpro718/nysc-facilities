
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserProfile, UserAssignment, UserIssue } from "@/types/dashboard";

export const useDashboardData = () => {
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Get current user
  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');
      return user;
    },
    retry: 1,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch user profile with caching
  const { data: profile = {} } = useQuery<UserProfile>({
    queryKey: ['userProfile', userData?.id],
    queryFn: async () => {
      if (!userData?.id) throw new Error('No user ID available');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userData?.id,
    staleTime: 300000,
  });

  // Fetch assigned rooms with caching
  const { data: assignedRooms = [] } = useQuery<UserAssignment[]>({
    queryKey: ['assignedRooms', userData?.id],
    queryFn: async () => {
      if (!userData?.id) throw new Error('No user ID available');
      const { data, error } = await supabase
        .from('occupant_room_assignments')
        .select(`
          id,
          assigned_at,
          is_primary,
          room_id,
          rooms (
            id,
            name,
            room_number,
            floor_id,
            floors (
              id,
              name,
              building_id,
              buildings (
                id,
                name
              )
            )
          )
        `)
        .eq('occupant_id', userData.id);

      if (error) throw error;
      
      return data.map(assignment => ({
        id: assignment.id,
        room_id: assignment.room_id,
        room_name: assignment.rooms?.name,
        room_number: assignment.rooms?.room_number,
        floor_id: assignment.rooms?.floor_id,
        building_id: assignment.rooms?.floors?.building_id,
        building_name: assignment.rooms?.floors?.buildings?.name,
        floor_name: assignment.rooms?.floors?.name,
        assigned_at: assignment.assigned_at,
        is_primary: assignment.is_primary
      }));
    },
    enabled: !!userData?.id,
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch user's issues with caching
  const { data: userIssues = [], refetch: refetchIssues } = useQuery<UserIssue[]>({
    queryKey: ['userIssues', userData?.id],
    queryFn: async () => {
      if (!userData?.id) throw new Error('No user ID available');
      const { data, error } = await supabase
        .from('issues')
        .select(`
          id,
          title,
          description,
          status,
          created_at,
          priority,
          building_id,
          seen,
          photos,
          rooms (
            id,
            name,
            room_number
          ),
          buildings (
            name
          ),
          floors (
            name
          )
        `)
        .eq('created_by', userData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userData?.id,
    staleTime: 30000, // Cache for 30 seconds
  });

  const handleMarkAsSeen = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ seen: true })
        .eq('id', id);

      if (error) throw error;

      // Optimistically update the cache
      queryClient.setQueryData(['userIssues', userData?.id], (old: UserIssue[] | undefined) =>
        old?.map(issue =>
          issue.id === id ? { ...issue, seen: true } : issue
        )
      );
    } catch (error) {
      console.error('Error marking issue as seen:', error);
      toast.error('Failed to mark issue as seen');
    }
  }, [queryClient, userData?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userData?.id) return;

    const issuesSubscription = supabase
      .channel('issues_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `created_by=eq.${userData.id}`
        },
        () => {
          refetchIssues();
        }
      )
      .subscribe();

    return () => {
      issuesSubscription.unsubscribe();
    };
  }, [userData?.id, refetchIssues]);

  return {
    profile,
    assignedRooms,
    userIssues,
    handleMarkAsSeen,
    error,
  };
};
