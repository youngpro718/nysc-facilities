/**
 * Supply Order ETA Prediction Utilities
 * Calculates estimated fulfillment times based on historical data
 */

import { supabase } from '@/lib/supabase';

interface FulfillmentStats {
  averageMinutes: number;
  medianMinutes: number;
  sampleSize: number;
}

// Cache for fulfillment stats
let cachedStats: FulfillmentStats | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch historical fulfillment statistics
 */
export async function getFulfillmentStats(): Promise<FulfillmentStats> {
  const now = Date.now();
  
  // Return cached stats if fresh
  if (cachedStats && now - cacheTimestamp < CACHE_DURATION) {
    return cachedStats;
  }

  try {
    const { data, error } = await supabase
      .from('supply_requests')
      .select('created_at, work_completed_at')
      .eq('status', 'completed')
      .not('work_completed_at', 'is', null)
      .order('work_completed_at', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) {
      // Default estimates when no historical data
      return { averageMinutes: 30, medianMinutes: 25, sampleSize: 0 };
    }

    const durations = data
      .map(r => {
        const start = new Date(r.created_at).getTime();
        const end = new Date(r.work_completed_at).getTime();
        return (end - start) / 60000; // minutes
      })
      .filter(d => d > 0 && d < 480); // Filter outliers (>8 hours)

    if (durations.length === 0) {
      return { averageMinutes: 30, medianMinutes: 25, sampleSize: 0 };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const average = durations.reduce((a, b) => a + b, 0) / durations.length;
    const median = sorted[Math.floor(sorted.length / 2)];

    cachedStats = {
      averageMinutes: Math.round(average),
      medianMinutes: Math.round(median),
      sampleSize: durations.length,
    };
    cacheTimestamp = now;

    return cachedStats;
  } catch {
    return { averageMinutes: 30, medianMinutes: 25, sampleSize: 0 };
  }
}

/**
 * Calculate ETA for an order based on status and historical data
 */
export function calculateETA(
  order: {
    status: string;
    created_at: string;
    work_started_at?: string | null;
    priority?: string;
  },
  stats: FulfillmentStats
): {
  estimatedMinutes: number;
  confidence: 'high' | 'medium' | 'low';
  label: string;
} {
  const baseTime = stats.sampleSize > 10 ? stats.medianMinutes : stats.averageMinutes;
  
  // Priority multipliers
  const priorityMultiplier: Record<string, number> = {
    urgent: 0.5,
    high: 0.7,
    medium: 1.0,
    low: 1.3,
  };
  const multiplier = priorityMultiplier[order.priority || 'medium'] || 1.0;

  // Status-based adjustments
  let remainingMinutes: number;
  let confidence: 'high' | 'medium' | 'low';

  switch (order.status) {
    case 'submitted':
      remainingMinutes = baseTime * multiplier;
      confidence = stats.sampleSize > 20 ? 'medium' : 'low';
      break;
    case 'received':
      remainingMinutes = baseTime * 0.9 * multiplier;
      confidence = 'medium';
      break;
    case 'picking':
      // If we know when picking started, estimate remaining time
      if (order.work_started_at) {
        const pickingStarted = new Date(order.work_started_at).getTime();
        const elapsed = (Date.now() - pickingStarted) / 60000;
        remainingMinutes = Math.max(5, (baseTime * 0.4) - elapsed);
      } else {
        remainingMinutes = baseTime * 0.3;
      }
      confidence = 'high';
      break;
    case 'ready':
      remainingMinutes = 0; // Ready for pickup
      confidence = 'high';
      break;
    default:
      remainingMinutes = baseTime * multiplier;
      confidence = 'low';
  }

  // Format label
  const roundedMinutes = Math.max(5, Math.round(remainingMinutes / 5) * 5); // Round to 5 min
  let label: string;
  
  if (roundedMinutes <= 0 || order.status === 'ready') {
    label = 'Ready now';
  } else if (roundedMinutes < 60) {
    label = `~${roundedMinutes} min`;
  } else {
    const hours = Math.round(roundedMinutes / 60 * 10) / 10;
    label = `~${hours}h`;
  }

  return {
    estimatedMinutes: roundedMinutes,
    confidence,
    label,
  };
}

/**
 * Get ETA display color based on confidence
 */
export function getETAColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return 'text-green-600 dark:text-green-400';
    case 'medium':
      return 'text-amber-600 dark:text-amber-400';
    case 'low':
      return 'text-muted-foreground';
  }
}
