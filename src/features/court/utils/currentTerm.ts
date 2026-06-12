import { supabase } from '@/lib/supabase';

/**
 * Resolve the id of the "current" court term: the term whose date range covers
 * today, falling back to the most recent term. Queries that read or write
 * court_assignments outside the Term Sheet board must scope to this term —
 * since terms became historical (one set of assignments per term), unscoped
 * room lookups can match rows from past terms.
 */
export async function getCurrentTermId(): Promise<string | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('court_terms')
    .select('id, start_date, end_date')
    .order('start_date', { ascending: false });
  if (error || !data || data.length === 0) return null;
  const covering = data.find(t => t.start_date && t.end_date && t.start_date <= today && t.end_date >= today);
  return covering?.id ?? data[0].id ?? null;
}
