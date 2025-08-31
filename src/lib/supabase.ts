// IMPORTANT: This is the ONLY file that should import directly from integrations
// All other files should import from '@/lib/supabase'

// Direct import from the actual supabase client - avoiding circular imports
import { createClient } from '@supabase/supabase-js';
// Types will be inferred from createClient

const SUPABASE_URL = 'https://fmymhtuiqzhupjyopfvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZteW1odHVpcXpodXBqeW9wZnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDc4OTYsImV4cCI6MjA1MzgyMzg5Nn0.1OvOXiLEj3QKGjAEZCSWqw8zzewsYgfTlVDcDEdfCjE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'app-auth',
    storage: localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const supabaseWithRetry = {
  async query<T>(queryFn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error: any) {
        lastError = error;
        if (error?.message?.includes('Failed to fetch') || 
            error?.message?.includes('ERR_CONNECTION_CLOSED') ||
            error?.message?.includes('Network Error')) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
    throw lastError;
  }
};

// Export the supabase client type for use in other files
export type SupabaseClient = typeof supabase;

// Supply request service functions (implemented directly with supabase client)
export const submitSupplyRequest = async (requestData: any) => {
  const { data, error } = await supabase.from('supply_requests').insert(requestData).select().single();
  if (error) throw error;
  return data;
};

export const getSupplyRequests = async () => {
  const { data, error } = await supabase.from('supply_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const updateSupplyRequestStatus = async (id: string, status: string) => {
  const { error } = await supabase.from('supply_requests').update({ status }).eq('id', id);
  if (error) throw error;
};

export const updateSupplyRequestItems = async (id: string, items: any[]) => {
  const { error } = await supabase.from('supply_requests').update({ items }).eq('id', id);
  if (error) throw error;
};

export const startSupplyRequestWork = async (id: string) => {
  const { error } = await supabase.from('supply_requests').update({ 
    work_started_at: new Date().toISOString(),
    status: 'in_progress'
  }).eq('id', id);
  if (error) throw error;
};

export const completeSupplyRequestWork = async (id: string, notes?: string) => {
  const { error } = await supabase.from('supply_requests').update({ 
    work_completed_at: new Date().toISOString(),
    status: 'completed',
    completion_notes: notes
  }).eq('id', id);
  if (error) throw error;
};

export const getFulfillmentLog = async (requestId: string) => {
  const { data, error } = await supabase.from('fulfillment_logs').select('*').eq('request_id', requestId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getInventoryItems = async () => {
  const { data, error } = await supabase.from('inventory_items').select('*').order('name');
  if (error) throw error;
  return data;
};

// Auth service functions
export const authService = {
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  },
  signUp: async (email: string, password: string) => {
    return supabase.auth.signUp({ email, password });
  },
  signOut: async () => {
    return supabase.auth.signOut();
  }
};

import type { LightStatus } from '@/types/lighting';

// Export lighting service functions for compatibility  
export const markLightsOut = async (fixtureIds: string[], requiresElectrician: boolean = false) => {
  const updateData: any = { 
    status: 'non_functional' as LightStatus,
    reported_out_date: new Date().toISOString()
  };
  
  if (requiresElectrician) {
    updateData.requires_electrician = true;
    updateData.electrical_issues = true;
  }

  const { error } = await supabase
    .from('lighting_fixtures')
    .update(updateData)
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};

export const markLightsFixed = async (fixtureIds: string[]) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ 
      status: 'functional' as LightStatus,
      replaced_date: new Date().toISOString(),
      requires_electrician: false,
      electrical_issues: false
    })
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};

export const toggleElectricianRequired = async (fixtureIds: string[], required: boolean) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ 
      requires_electrician: required,
      electrical_issues: required 
    })
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};

export const fetchLightingFixtures = async () => {
  const { data, error } = await supabase
    .from('lighting_fixtures')
    .select(`
      *,
      lighting_zones (
        id,
        name,
        type
      ),
      spatial_assignments (
        id,
        space_id,
        space_type,
        position,
        sequence_number
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const fetchRoomLightingStats = async () => {
  const { data, error } = await supabase
    .from('unified_spaces')
    .select(`
      id,
      name,
      room_number,
      lighting_fixtures (
        id,
        status,
        electrical_issues,
        ballast_issue
      )
    `);
  
  if (error) throw error;
  return data || [];
};

export const deleteLightingFixture = async (id: string) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

export const deleteLightingFixtures = async (fixtureIds: string[]) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .delete()
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};

export const updateLightingFixturesStatus = async (fixtureIds: string[], status: LightStatus) => {
  const { error } = await supabase
    .from('lighting_fixtures')
    .update({ status })
    .in('id', fixtureIds);
  
  if (error) throw error;
  return true;
};

export const createLightingFixture = async (fixtureData: any) => {
  const { data, error } = await supabase
    .from('lighting_fixtures')
    .insert(fixtureData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createLightingZone = async (zoneData: any) => {
  const { data, error } = await supabase
    .from('lighting_zones')
    .insert(zoneData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchLightingZones = async () => {
  const { data, error } = await supabase
    .from('lighting_zones')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};

export const fetchFloorsForZones = async () => {
  const { data, error } = await supabase
    .from('floors')
    .select('id, name, floor_number')
    .order('floor_number');
  
  if (error) throw error;
  return data || [];
};