/**
 * Operations Service
 * 
 * Handles all data operations for operations hub (issues, maintenance, requests)
 * This is the ONLY place where Supabase queries for operations should exist.
 * 
 * @module services/operations/operationsService
 */

import { db, handleSupabaseError, validateData } from '../core/supabaseClient';

/**
 * Operations Service
 * All methods return Promises and throw errors on failure
 */
export const operationsService = {
  /**
   * Get all issues with optional filters
   * @param filters - Optional filters for issues
   * @returns Promise<any[]> - Array of issues
   */
  async getIssues(filters?: any): Promise<any[]> {
    try {
      let query = db
        .from('issues')
        .select(`
          *,
          building:buildings(id, name),
          floor:floors(id, floor_number),
          room:rooms(id, room_number, room_name),
          reported_by_user:profiles!issues_reported_by_fkey(id, first_name, last_name),
          assigned_to_user:profiles!issues_assigned_to_fkey(id, first_name, last_name)
        `);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.buildingId) {
        query = query.eq('building_id', filters.buildingId);
      }
      if (filters?.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'Failed to fetch issues');
      return data || [];
    } catch (error) {
      console.error('[operationsService.getIssues]:', error);
      throw error;
    }
  },

  /**
   * Get single issue by ID
   * @param id - Issue ID
   * @returns Promise<any> - Issue data
   */
  async getIssueById(id: string): Promise<any> {
    try {
      const { data, error } = await db
        .from('issues')
        .select(`
          *,
          building:buildings(id, name),
          floor:floors(id, floor_number),
          room:rooms(id, room_number, room_name),
          reported_by_user:profiles!issues_reported_by_fkey(id, first_name, last_name, email),
          assigned_to_user:profiles!issues_assigned_to_fkey(id, first_name, last_name, email)
        `)
        .eq('id', id)
        .single();

      if (error) handleSupabaseError(error, 'Failed to fetch issue');
      return validateData(data, 'Issue not found');
    } catch (error) {
      console.error('[operationsService.getIssueById]:', error);
      throw error;
    }
  },

  /**
   * Create new issue
   * @param issueData - Issue data
   * @returns Promise<any> - Created issue
   */
  async createIssue(issueData: any): Promise<any> {
    try {
      const { data, error } = await db
        .from('issues')
        .insert(issueData)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Failed to create issue');
      return validateData(data, 'Failed to create issue');
    } catch (error) {
      console.error('[operationsService.createIssue]:', error);
      throw error;
    }
  },

  /**
   * Update existing issue
   * @param id - Issue ID
   * @param updates - Issue updates
   * @returns Promise<any> - Updated issue
   */
  async updateIssue(id: string, updates: any): Promise<any> {
    try {
      const { data, error } = await db
        .from('issues')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Failed to update issue');
      return validateData(data, 'Failed to update issue');
    } catch (error) {
      console.error('[operationsService.updateIssue]:', error);
      throw error;
    }
  },

  /**
   * Resolve issue
   * @param id - Issue ID
   * @param resolution - Resolution data
   * @returns Promise<any> - Resolved issue
   */
  async resolveIssue(id: string, resolution: any): Promise<any> {
    try {
      const { data, error } = await db
        .from('issues')
        .update({
          status: 'resolved',
          resolved_date: new Date().toISOString(),
          resolution_type: resolution.type,
          resolution_notes: resolution.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Failed to resolve issue');
      return validateData(data, 'Failed to resolve issue');
    } catch (error) {
      console.error('[operationsService.resolveIssue]:', error);
      throw error;
    }
  },

  /**
   * Assign issue to user
   * @param id - Issue ID
   * @param userId - User ID to assign to
   * @returns Promise<any> - Updated issue
   */
  async assignIssue(id: string, userId: string): Promise<any> {
    try {
      const { data, error } = await db
        .from('issues')
        .update({
          assigned_to: userId,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Failed to assign issue');
      return validateData(data, 'Failed to assign issue');
    } catch (error) {
      console.error('[operationsService.assignIssue]:', error);
      throw error;
    }
  },

  /**
   * Update room status with audit logging
   * Complete Ops v1 flow: read → update → audit → return
   * @param roomId - Room ID
   * @param newStatus - New status
   * @param notes - Optional notes for audit trail
   * @param userId - User ID making the change
   * @returns Promise<any> - Updated room
   */
  async updateRoomStatus(
    roomId: string,
    newStatus: string,
    notes?: string,
    userId?: string
  ): Promise<any> {
    try {
      // Step 1: Read current room state
      const { data: currentRoom, error: readError } = await db
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (readError) handleSupabaseError(readError, 'Failed to read room');
      if (!currentRoom) throw new Error('Room not found');

      const oldStatus = currentRoom.status;

      // Step 2: Update room status
      const { data: updatedRoom, error: updateError } = await db
        .from('rooms')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('id', roomId)
        .select(`
          *,
          building:buildings(id, name),
          floor:floors(id, floor_number, name)
        `)
        .single();

      if (updateError) {
        // Check for permission error
        if (updateError.code === 'PGRST301' || updateError.code === '42501') {
          throw new Error('Permission denied: You do not have access to update this room');
        }
        handleSupabaseError(updateError, 'Failed to update room status');
      }

      // Step 3: Write audit log
      const { error: auditError } = await db
        .from('audit_logs')
        .insert({
          table_name: 'rooms',
          record_id: roomId,
          operation: 'UPDATE',
          old_values: { status: oldStatus },
          new_values: { status: newStatus },
          changed_fields: ['status'],
          action_description: notes || `Status changed from ${oldStatus} to ${newStatus}`,
          user_id: userId,
          created_at: new Date().toISOString(),
        });

      if (auditError) {
        console.error('[operationsService.updateRoomStatus] Audit log failed:', auditError);
        // Don't fail the operation if audit log fails, but log it
      }

      // Step 4: Return updated room
      return validateData(updatedRoom, 'Failed to update room status');
    } catch (error) {
      console.error('[operationsService.updateRoomStatus]:', error);
      throw error;
    }
  },

  /**
   * Get audit trail for a record
   * @param tableName - Table name
   * @param recordId - Record ID
   * @param limit - Number of entries to fetch
   * @returns Promise<any[]> - Audit trail entries
   */
  async getAuditTrail(
    tableName: string,
    recordId: string,
    limit: number = 20
  ): Promise<any[]> {
    try {
      const { data, error } = await db
        .from('audit_logs')
        .select(`
          *,
          user:profiles(id, email, first_name, last_name)
        `)
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) handleSupabaseError(error, 'Failed to fetch audit trail');
      return data || [];
    } catch (error) {
      console.error('[operationsService.getAuditTrail]:', error);
      throw error;
    }
  },

  /**
   * Get key requests with optional filters
   * @param filters - Optional filters
   * @returns Promise<any[]> - Array of key requests
   */
  async getKeyRequests(filters?: any): Promise<any[]> {
    try {
      let query = db
        .from('key_requests')
        .select(`
          *,
          requester:profiles!key_requests_requester_id_fkey(id, first_name, last_name),
          key:keys(id, key_number, description),
          room:rooms(id, room_number, room_name)
        `);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'Failed to fetch key requests');
      return data || [];
    } catch (error) {
      console.error('[operationsService.getKeyRequests]:', error);
      throw error;
    }
  },

  /**
   * Get supply requests with optional filters
   * @param filters - Optional filters
   * @returns Promise<any[]> - Array of supply requests
   */
  async getSupplyRequests(filters?: any): Promise<any[]> {
    try {
      let query = db
        .from('supply_requests')
        .select(`
          *,
          requester:profiles(id, first_name, last_name, department)
        `);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) handleSupabaseError(error, 'Failed to fetch supply requests');
      return data || [];
    } catch (error) {
      console.error('[operationsService.getSupplyRequests]:', error);
      throw error;
    }
  },
};
