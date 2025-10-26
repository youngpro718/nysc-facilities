/**
 * Facilities Service Tests
 * 
 * Tests for the facilities service layer
 * Validates service-layer pattern implementation
 * 
 * @module services/facilities/__tests__/facilitiesService.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { facilitiesService } from '../facilitiesService';
import { db } from '../../core/supabaseClient';

// Mock Supabase client
vi.mock('../../core/supabaseClient', () => ({
  db: {
    from: vi.fn(),
  },
  handleSupabaseError: vi.fn((error, context) => {
    throw new Error(`${context}: ${error.message}`);
  }),
  validateData: vi.fn((data, context) => {
    if (!data) throw new Error(context);
    return data;
  }),
}));

describe('facilitiesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRooms', () => {
    it('should fetch all rooms without filters', async () => {
      const mockRooms = [
        {
          id: '1',
          room_number: '101',
          room_name: 'Conference Room A',
          status: 'available',
          building: { id: 'b1', name: 'Building A' },
          floor: { id: 'f1', floor_number: 1, name: 'First Floor' },
        },
      ];

      const selectMock = vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockRooms,
            error: null,
          }),
        }),
      });

      (db.from as any).mockReturnValue({ select: selectMock });

      const result = await facilitiesService.getRooms();

      expect(db.from).toHaveBeenCalledWith('rooms');
      expect(result).toEqual(mockRooms);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        buildingId: 'b1',
        status: 'available',
        search: 'conf',
      };

      const selectMock = vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      (db.from as any).mockReturnValue({ select: selectMock });

      await facilitiesService.getRooms(filters);

      expect(selectMock).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      const selectMock = vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      (db.from as any).mockReturnValue({ select: selectMock });

      await expect(facilitiesService.getRooms()).rejects.toThrow();
    });
  });

  describe('getRoomById', () => {
    it('should fetch single room by ID', async () => {
      const mockRoom = {
        id: '1',
        room_number: '101',
        building: { id: 'b1', name: 'Building A' },
      };

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockRoom,
              error: null,
            }),
          }),
        }),
      });

      (db.from as any).mockReturnValue({ select: selectMock });

      const result = await facilitiesService.getRoomById('1');

      expect(db.from).toHaveBeenCalledWith('rooms');
      expect(result).toEqual(mockRoom);
    });

    it('should throw error if room not found', async () => {
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      (db.from as any).mockReturnValue({ select: selectMock });

      await expect(facilitiesService.getRoomById('999')).rejects.toThrow('Room not found');
    });
  });

  describe('getBuildings', () => {
    it('should fetch all buildings', async () => {
      const mockBuildings = [
        { id: 'b1', name: 'Building A' },
        { id: 'b2', name: 'Building B' },
      ];

      const selectMock = vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockBuildings,
            error: null,
          }),
        }),
      });

      (db.from as any).mockReturnValue({ select: selectMock });

      const result = await facilitiesService.getBuildings();

      expect(db.from).toHaveBeenCalledWith('buildings');
      expect(result).toEqual(mockBuildings);
    });
  });

  describe('getFloors', () => {
    it('should fetch all floors', async () => {
      const mockFloors = [
        { id: 'f1', floor_number: 1, name: 'First Floor' },
        { id: 'f2', floor_number: 2, name: 'Second Floor' },
      ];

      const selectMock = vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockFloors,
            error: null,
          }),
        }),
      });

      (db.from as any).mockReturnValue({ select: selectMock });

      const result = await facilitiesService.getFloors();

      expect(result).toEqual(mockFloors);
    });

    it('should filter floors by building ID', async () => {
      const selectMock = vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      (db.from as any).mockReturnValue({ select: selectMock });

      await facilitiesService.getFloors('b1');

      expect(selectMock).toHaveBeenCalled();
    });
  });

  describe('createRoom', () => {
    it('should create new room', async () => {
      const roomData = {
        room_number: '101',
        room_name: 'New Room',
        building_id: 'b1',
        floor_id: 'f1',
      };

      const mockCreatedRoom = { id: '1', ...roomData };

      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCreatedRoom,
            error: null,
          }),
        }),
      });

      (db.from as any).mockReturnValue({ insert: insertMock });

      const result = await facilitiesService.createRoom(roomData);

      expect(db.from).toHaveBeenCalledWith('rooms');
      expect(insertMock).toHaveBeenCalledWith(roomData);
      expect(result).toEqual(mockCreatedRoom);
    });
  });

  describe('updateRoom', () => {
    it('should update existing room', async () => {
      const updates = { room_name: 'Updated Room' };
      const mockUpdatedRoom = { id: '1', ...updates };

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUpdatedRoom,
              error: null,
            }),
          }),
        }),
      });

      (db.from as any).mockReturnValue({ update: updateMock });

      const result = await facilitiesService.updateRoom('1', updates);

      expect(db.from).toHaveBeenCalledWith('rooms');
      expect(result).toEqual(mockUpdatedRoom);
    });
  });

  describe('deleteRoom', () => {
    it('should soft delete room', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      (db.from as any).mockReturnValue({ update: updateMock });

      await facilitiesService.deleteRoom('1');

      expect(db.from).toHaveBeenCalledWith('rooms');
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(String) })
      );
    });
  });
});
