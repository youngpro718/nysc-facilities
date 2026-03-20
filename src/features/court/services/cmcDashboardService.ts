/**
 * CMC Dashboard Service
 * 
 * Centralized service for CMC dashboard metrics and data
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface CourtroomHealth {
  operational: number;
  maintenance: number;
  inactive: number;
  total: number;
  healthPercent: number;
}

export interface CourtTerm {
  id: string;
  term_name: string;
  start_date: string;
  end_date: string;
}

export interface CMCMetrics {
  courtroomHealth: CourtroomHealth;
  todaySessions: number;
  activeTerms: CourtTerm[];
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Fetch courtroom health metrics
 */
export async function getCourtroomHealth(): Promise<CourtroomHealth> {
  try {
    const { data, error } = await supabase
      .from('court_rooms')
      .select('id, operational_status');
    
    if (error) throw error;

    const rooms = data || [];
    const operational = rooms.filter(
      r => r.operational_status === 'active' || r.operational_status === 'operational'
    ).length;
    const maintenance = rooms.filter(r => r.operational_status === 'maintenance').length;
    const inactive = rooms.filter(
      r => r.operational_status === 'inactive' || r.operational_status === 'closed'
    ).length;
    const total = rooms.length || 1;

    return {
      operational,
      maintenance,
      inactive,
      total,
      healthPercent: Math.round((operational / total) * 100),
    };
  } catch (error) {
    logger.error('Failed to fetch courtroom health:', error);
    throw error;
  }
}

/**
 * Fetch active court terms
 */
export async function getActiveTerms(limit: number = 10): Promise<CourtTerm[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('court_terms')
      .select('id, term_name, start_date, end_date')
      .gte('end_date', today)
      .order('start_date', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Failed to fetch active terms:', error);
    throw error;
  }
}

/**
 * Fetch today's session count
 */
export async function getTodaySessionsCount(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { count, error } = await supabase
      .from('court_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('session_date', today);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    logger.error('Failed to fetch today sessions count:', error);
    throw error;
  }
}

/**
 * Fetch all CMC metrics in parallel
 */
export async function getCMCMetrics(termsLimit: number = 10): Promise<CMCMetrics> {
  try {
    const [courtroomHealth, todaySessions, activeTerms] = await Promise.all([
      getCourtroomHealth(),
      getTodaySessionsCount(),
      getActiveTerms(termsLimit),
    ]);

    return {
      courtroomHealth,
      todaySessions,
      activeTerms,
    };
  } catch (error) {
    logger.error('Failed to fetch CMC metrics:', error);
    throw error;
  }
}
