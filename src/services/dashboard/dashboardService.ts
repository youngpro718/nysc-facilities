/**
 * Dashboard Service
 * 
 * Handles all data operations for dashboard
 * This is the ONLY place where Supabase queries for dashboard should exist.
 * 
 * @module services/dashboard/dashboardService
 */

import { db, handleSupabaseError } from '../core/supabaseClient';

/**
 * Dashboard Service
 * All methods return Promises and throw errors on failure
 */
export const dashboardService = {
  /**
   * Get dashboard statistics
   * @returns Promise<any> - Dashboard stats
   */
  async getDashboardStats(): Promise<any> {
    try {
      // Use RPC function if available, otherwise aggregate manually
      const { data, error } = await db.rpc('get_dashboard_stats');

      if (error) {
        // Fallback to manual aggregation
        return await this.getDashboardStatsManual();
      }

      return data || {};
    } catch (error) {
      console.error('[dashboardService.getDashboardStats]:', error);
      throw error;
    }
  },

  /**
   * Get dashboard statistics manually (fallback)
   * @returns Promise<any> - Dashboard stats
   */
  async getDashboardStatsManual(): Promise<any> {
    try {
      const [rooms, issues, keys, personnel] = await Promise.all([
        db.from('rooms').select('id', { count: 'exact', head: true }),
        db.from('issues').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        db.from('keys').select('id', { count: 'exact', head: true }),
        db.from('occupants').select('id', { count: 'exact', head: true }),
      ]);

      return {
        total_rooms: rooms.count || 0,
        open_issues: issues.count || 0,
        total_keys: keys.count || 0,
        total_personnel: personnel.count || 0,
      };
    } catch (error) {
      console.error('[dashboardService.getDashboardStatsManual]:', error);
      throw error;
    }
  },

  /**
   * Get building summary
   * @returns Promise<any[]> - Array of buildings with stats
   */
  async getBuildingSummary(): Promise<any[]> {
    try {
      const { data, error } = await db
        .from('buildings')
        .select(`
          *,
          floors:floors(count),
          rooms:rooms(count)
        `)
        .is('deleted_at', null);

      if (error) handleSupabaseError(error, 'Failed to fetch building summary');
      return data || [];
    } catch (error) {
      console.error('[dashboardService.getBuildingSummary]:', error);
      throw error;
    }
  },

  /**
   * Get recent activity
   * @param limit - Number of recent items to fetch
   * @returns Promise<any[]> - Array of recent activities
   */
  async getRecentActivity(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await db
        .from('issues')
        .select(`
          id,
          title,
          status,
          priority,
          created_at,
          room:rooms(room_number)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) handleSupabaseError(error, 'Failed to fetch recent activity');
      return data || [];
    } catch (error) {
      console.error('[dashboardService.getRecentActivity]:', error);
      throw error;
    }
  },

  /**
   * Get module status
   * @param userId - User ID
   * @returns Promise<any> - Module status
   */
  async getModuleStatus(userId: string): Promise<any> {
    try {
      const { data, error } = await db
        .from('profiles')
        .select('enabled_modules')
        .eq('id', userId)
        .single();

      if (error) handleSupabaseError(error, 'Failed to fetch module status');
      
      return {
        enabled_modules: data?.enabled_modules || [],
      };
    } catch (error) {
      console.error('[dashboardService.getModuleStatus]:', error);
      throw error;
    }
  },
};
