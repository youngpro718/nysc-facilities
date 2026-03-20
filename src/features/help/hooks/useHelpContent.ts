import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface HelpContent {
  id: string;
  content_key: string;
  title: string;
  content: string;
  category: 'feature' | 'role' | 'workflow' | 'troubleshooting';
  role_specific: string | null;
  related_feature: string | null;
  search_keywords: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
}

export function useHelpContent(category?: string, roleSpecific?: string) {
  return useQuery({
    queryKey: ['help-content', category, roleSpecific],
    queryFn: async () => {
      let query = supabase
        .from('help_content')
        .select('*')
        .order('title', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      if (roleSpecific) {
        query = query.or(`role_specific.eq.${roleSpecific},role_specific.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[useHelpContent] Failed to fetch help content:', error);
        throw error;
      }

      return data as HelpContent[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSearchHelpContent(searchQuery: string) {
  return useQuery({
    queryKey: ['help-content-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) {
        return [];
      }

      // Search in title, content, and keywords
      const { data, error } = await supabase
        .from('help_content')
        .select('*')
        .or(
          `title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,search_keywords.cs.{${searchQuery}}`
        )
        .order('view_count', { ascending: false })
        .limit(20);

      if (error) {
        logger.error('[useSearchHelpContent] Failed to search help content:', error);
        throw error;
      }

      return data as HelpContent[];
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export async function trackHelpView(contentKey: string) {
  try {
    const { error } = await supabase.rpc('track_help_view', {
      p_content_key: contentKey,
    });

    if (error) {
      logger.error('[trackHelpView] Failed to track view:', error);
    }
  } catch (err) {
    logger.error('[trackHelpView] Error:', err);
  }
}
