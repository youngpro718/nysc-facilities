
import type { Json } from '@/integrations/supabase/types';

export function parseJsonField<T>(field: Json | null, defaultValue: T): T {
  if (!field) return defaultValue;
  try {
    if (typeof field === 'string') {
      return JSON.parse(field) as T;
    }
    return field as T;
  } catch {
    return defaultValue;
  }
}
