
import { supabase } from "@/integrations/supabase/client";

export interface Relocation {
  id: string;
  original_room_id: string;
  temporary_room_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  relocation_type: 'emergency' | 'maintenance' | 'other' | 'construction';
  special_instructions?: string;
  metadata?: any;
}

export interface CreateRelocationData {
  original_room_id: string;
  temporary_room_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  relocation_type: 'emergency' | 'maintenance' | 'other' | 'construction';
  notes?: string;
  special_instructions?: string;
}

export interface RelocationUpdate {
  temporary_room_id?: string;
  end_date?: string;
  reason?: string;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  special_instructions?: string;
}

export class RelocationService {
  static async getRelocations(): Promise<Relocation[]> {
    const { data, error } = await supabase
      .from('room_relocations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Relocation[];
  }

  static async listRelocations(): Promise<Relocation[]> {
    return this.getRelocations();
  }

  static async getRelocation(id: string): Promise<Relocation> {
    const { data, error } = await supabase
      .from('room_relocations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Relocation;
  }

  static async createRelocation(relocationData: CreateRelocationData): Promise<Relocation> {
    const { data, error } = await supabase
      .from('room_relocations')
      .insert({
        ...relocationData,
        status: 'scheduled' as const
      })
      .select()
      .single();

    if (error) throw error;
    return data as Relocation;
  }

  static async updateRelocation(id: string, updates: RelocationUpdate): Promise<Relocation> {
    const { data, error } = await supabase
      .from('room_relocations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Relocation;
  }

  static async deleteRelocation(id: string): Promise<void> {
    const { error } = await supabase
      .from('room_relocations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
