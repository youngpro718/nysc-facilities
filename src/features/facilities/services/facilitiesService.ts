/**
 * Facilities Service
 * 
 * Handles all data operations for facilities (rooms, buildings, floors)
 * This is the ONLY place where Supabase queries for facilities should exist.
 * 
 * Uses Zod validation at service boundary for predictable types.
 * 
 * @module features/facilities/services/facilitiesService
 */

import { db, handleSupabaseError, validateData } from '@/services/core/supabaseClient';
import type { Room, Building, Floor, RoomFilters } from '../model';
import {
  validateRooms,
  validateRoom,
  validateBuildings,
  validateFloors,
  validateCreateRoomInput,
  validateUpdateRoomInput,
} from '../schemas';

/**
 * Facilities Service
 * All methods return Promises and throw errors on failure
 */
export const facilitiesService = {
  /**
   * Get all rooms with optional filters
   * @param filters - Optional filters for rooms
   * @returns Promise<Room[]> - Array of rooms
   */
  async getRooms(filters?: RoomFilters): Promise<Room[]> {
    try {
      let query = db
        .from('rooms')
        .select(`
          *,
          floor:floors!rooms_floor_id_fkey(
            id, 
            floor_number, 
            name,
            building:buildings!floors_building_id_fkey(id, name)
          )
        `)
        .is('deleted_at', null);

      // Apply filters
      if (filters?.buildingId) {
        // Filter by building through floors
        query = query.eq('floor.building_id', filters.buildingId);
      }
      if (filters?.floorId) {
        query = query.eq('floor_id', filters.floorId);
      }
      if (filters?.type) {
        query = query.eq('room_type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(
          `room_number.ilike.%${filters.search}%,name.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query.order('room_number');

      if (error) handleSupabaseError(error, 'Failed to fetch rooms');
      
      // Transform to add building at top level for convenience
      const rooms = (data || []).map((room: any) => ({
        ...room,
        building: room.floor?.building || null,
      }));
      
      return rooms;
    } catch (error) {
      console.error('[facilitiesService.getRooms]:', error);
      throw error;
    }
  },

  /**
   * Get single room by ID
   * @param id - Room ID
   * @returns Promise<Room> - Room data
   */
  async getRoomById(id: string): Promise<Room> {
    try {
      const { data, error } = await db
        .from('rooms')
        .select(`
          *,
          floor:floors!rooms_floor_id_fkey(
            id, 
            floor_number, 
            name,
            building:buildings!floors_building_id_fkey(id, name, address)
          ),
          occupants(id, first_name, last_name, title, email)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) handleSupabaseError(error, 'Failed to fetch room');
      
      // Transform to add building at top level
      const room = {
        ...data,
        building: data?.floor?.building || null,
      };
      
      return validateData(room, 'Room not found');
    } catch (error) {
      console.error('[facilitiesService.getRoomById]:', error);
      throw error;
    }
  },

  /**
   * Get all buildings
   * @returns Promise<Building[]> - Array of buildings
   */
  async getBuildings(): Promise<Building[]> {
    try {
      const { data, error } = await db
        .from('buildings')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (error) handleSupabaseError(error, 'Failed to fetch buildings');
      return data || [];
    } catch (error) {
      console.error('[facilitiesService.getBuildings]:', error);
      throw error;
    }
  },

  /**
   * Get floors by building ID
   * @param buildingId - Building ID
   * @returns Promise<Floor[]> - Array of floors
   */
  async getFloors(buildingId?: string): Promise<Floor[]> {
    try {
      let query = db
        .from('floors')
        .select('*')
        .is('deleted_at', null);

      if (buildingId) {
        query = query.eq('building_id', buildingId);
      }

      const { data, error } = await query.order('floor_number');

      if (error) handleSupabaseError(error, 'Failed to fetch floors');
      return data || [];
    } catch (error) {
      console.error('[facilitiesService.getFloors]:', error);
      throw error;
    }
  },

  /**
   * Create new room
   * @param roomData - Room data
   * @returns Promise<Room> - Created room
   */
  async createRoom(roomData: Partial<Room>): Promise<Room> {
    try {
      const { data, error } = await db
        .from('rooms')
        .insert(roomData)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Failed to create room');
      return validateData(data, 'Failed to create room');
    } catch (error) {
      console.error('[facilitiesService.createRoom]:', error);
      throw error;
    }
  },

  /**
   * Update existing room
   * @param id - Room ID
   * @param updates - Room updates
   * @returns Promise<Room> - Updated room
   */
  async updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
    try {
      const { data, error } = await db
        .from('rooms')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) handleSupabaseError(error, 'Failed to update room');
      return validateData(data, 'Failed to update room');
    } catch (error) {
      console.error('[facilitiesService.updateRoom]:', error);
      throw error;
    }
  },

  /**
   * Soft delete room
   * @param id - Room ID
   * @returns Promise<void>
   */
  async deleteRoom(id: string): Promise<void> {
    try {
      const { error } = await db
        .from('rooms')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) handleSupabaseError(error, 'Failed to delete room');
    } catch (error) {
      console.error('[facilitiesService.deleteRoom]:', error);
      throw error;
    }
  },
};
