import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Relocation = Database['public']['Tables']['relocations']['Row'];
export type RelocationInsert = Database['public']['Tables']['relocations']['Insert'];
export type RelocationUpdate = Database['public']['Tables']['relocations']['Update'];

export type Renovation = Database['public']['Tables']['renovations']['Row'];
export type RenovationInsert = Database['public']['Tables']['renovations']['Insert'];
export type RenovationUpdate = Database['public']['Tables']['renovations']['Update'];

export const RelocationService = {
  async listRelocations() {
    const { data, error } = await supabase.from('room_relocations').select('*');
    if (error) throw error;
    return data as Relocation[];
  },
  async getRelocation(id: string) {
    const { data, error } = await supabase.from('room_relocations').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Relocation;
  },
  async createRelocation(payload: RelocationInsert) {
    const { data, error } = await supabase.from('room_relocations').insert(payload).select().single();
    if (error) throw error;
    return data as Relocation;
  },
  async updateRelocation(id: string, payload: RelocationUpdate) {
    const { data, error } = await supabase.from('room_relocations').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Relocation;
  },
  async deleteRelocation(id: string) {
    const { error } = await supabase.from('room_relocations').delete().eq('id', id);
    if (error) throw error;
  },
};

export const RenovationService = {
  async listRenovations() {
    const { data, error } = await supabase.from('renovations').select('*');
    if (error) throw error;
    return data as Renovation[];
  },
  async getRenovation(id: string) {
    const { data, error } = await supabase.from('renovations').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Renovation;
  },
  async createRenovation(payload: RenovationInsert) {
    const { data, error } = await supabase.from('renovations').insert(payload).select().single();
    if (error) throw error;
    return data as Renovation;
  },
  async updateRenovation(id: string, payload: RenovationUpdate) {
    const { data, error } = await supabase.from('renovations').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Renovation;
  },
  async deleteRenovation(id: string) {
    const { error } = await supabase.from('renovations').delete().eq('id', id);
    if (error) throw error;
  },
};
