/**
 * Operations Service Tests
 * 
 * Tests for the complete Ops v1 flow:
 * read room → update status → write audit_log → refresh view
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { operationsService } from '../operationsService';
import { db } from '../../core/supabaseClient';

// Mock Supabase client
vi.mock('../../core/supabaseClient', () => ({
  db: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
  handleSupabaseError: vi.fn((error, context) => {
    throw new Error(`${context}: ${error.message}`);
  }),
  validateData: vi.fn((data, context) => {
    if (!data) throw new Error(context);
    return data;
  }),
}));

describe('operationsService.updateRoomStatus', () => {
  const mockRoomId = 'room-123';
  const mockUserId = 'user-456';
  const oldStatus = 'available';
  const newStatus = 'maintenance';
  const notes = 'Scheduled HVAC maintenance';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full flow: read → update → audit → return', async () => {
    // Mock Step 1: Read current room
    const mockCurrentRoom = {
      id: mockRoomId,
      status: oldStatus,
      room_number: '101',
    };

    // Mock Step 2: Update room
    const mockUpdatedRoom = {
      id: mockRoomId,
      status: newStatus,
      room_number: '101',
      updated_at: new Date().toISOString(),
      building: { id: 'b1', name: 'Building A' },
      floor: { id: 'f1', floor_number: 1, name: 'First Floor' },
    };

    // Mock Step 3: Audit log insert
    const mockAuditInsert = { data: null, error: null };

    // Setup mocks
    const selectMock = vi.fn()
      .mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCurrentRoom,
            error: null,
          }),
        }),
      })
      .mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedRoom,
            error: null,
          }),
        }),
      });

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: selectMock,
      }),
    });

    const insertMock = vi.fn().mockResolvedValue(mockAuditInsert);

    (db.from as any)
      .mockReturnValueOnce({ select: selectMock }) // Read
      .mockReturnValueOnce({ update: updateMock }) // Update
      .mockReturnValueOnce({ insert: insertMock }); // Audit

    // Execute
    const result = await operationsService.updateRoomStatus(
      mockRoomId,
      newStatus,
      notes,
      mockUserId
    );

    // Assertions
    // Step 1: Read was called
    expect(db.from).toHaveBeenCalledWith('rooms');
    expect(selectMock).toHaveBeenCalled();

    // Step 2: Update was called with correct data
    expect(updateMock).toHaveBeenCalledWith({
      status: newStatus,
      updated_at: expect.any(String),
      updated_by: mockUserId,
    });

    // Step 3: Audit log was written
    expect(insertMock).toHaveBeenCalledWith({
      table_name: 'rooms',
      record_id: mockRoomId,
      operation: 'UPDATE',
      old_values: { status: oldStatus },
      new_values: { status: newStatus },
      changed_fields: ['status'],
      action_description: notes,
      user_id: mockUserId,
      created_at: expect.any(String),
    });

    // Step 4: Returns updated room
    expect(result).toEqual(mockUpdatedRoom);
  });

  it('should throw error if room not found', async () => {
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    });

    (db.from as any).mockReturnValue({ select: selectMock });

    await expect(
      operationsService.updateRoomStatus(mockRoomId, newStatus, notes, mockUserId)
    ).rejects.toThrow('Room not found');
  });

  it('should throw permission error with specific message', async () => {
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: mockRoomId, status: oldStatus },
          error: null,
        }),
      }),
    });

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST301', message: 'Permission denied' },
            }),
          }),
        }),
      }),
    });

    (db.from as any)
      .mockReturnValueOnce({ select: selectMock })
      .mockReturnValueOnce({ update: updateMock });

    await expect(
      operationsService.updateRoomStatus(mockRoomId, newStatus, notes, mockUserId)
    ).rejects.toThrow('Permission denied: You do not have access to update this room');
  });

  it('should not fail if audit log fails (logs error instead)', async () => {
    const mockCurrentRoom = { id: mockRoomId, status: oldStatus };
    const mockUpdatedRoom = { id: mockRoomId, status: newStatus };

    const selectMock = vi.fn()
      .mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCurrentRoom,
            error: null,
          }),
        }),
      })
      .mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedRoom,
            error: null,
          }),
        }),
      });

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: selectMock,
      }),
    });

    const insertMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Audit log failed' },
    });

    (db.from as any)
      .mockReturnValueOnce({ select: selectMock })
      .mockReturnValueOnce({ update: updateMock })
      .mockReturnValueOnce({ insert: insertMock });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await operationsService.updateRoomStatus(
      mockRoomId,
      newStatus,
      notes,
      mockUserId
    );

    // Should still return updated room
    expect(result).toEqual(mockUpdatedRoom);
    
    // Should log error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Audit log failed'),
      expect.any(Object)
    );

    consoleErrorSpy.mockRestore();
  });
});

describe('operationsService.getAuditTrail', () => {
  it('should fetch audit trail with user information', async () => {
    const mockAuditEntries = [
      {
        id: 'audit-1',
        table_name: 'rooms',
        record_id: 'room-123',
        operation: 'UPDATE',
        old_values: { status: 'available' },
        new_values: { status: 'maintenance' },
        user: {
          id: 'user-1',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'facilities_staff',
        },
        created_at: new Date().toISOString(),
      },
    ];

    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockAuditEntries,
              error: null,
            }),
          }),
        }),
      }),
    });

    (db.from as any).mockReturnValue({ select: selectMock });

    const result = await operationsService.getAuditTrail('rooms', 'room-123', 20);

    expect(db.from).toHaveBeenCalledWith('audit_logs');
    expect(result).toEqual(mockAuditEntries);
  });

  it('should throw error on fetch failure', async () => {
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      }),
    });

    (db.from as any).mockReturnValue({ select: selectMock });

    await expect(
      operationsService.getAuditTrail('rooms', 'room-123')
    ).rejects.toThrow();
  });
});
