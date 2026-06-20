import { describe, it, expect } from 'vitest';
import { mergeRows } from '../useMyRequests';

describe('mergeRows', () => {
  it('returns supply orders + tasks sorted newest first', () => {
    const supplies = [
      {
        id: 's1',
        requester_id: 'u',
        delivery_location: '1602',
        status: 'submitted',
        created_at: '2026-06-18T10:00:00Z',
        description: 'Pens please',
      },
    ];
    const tasks = [
      {
        id: 't1',
        created_by: 'u',
        room_id: 'r1',
        description: 'Move desk',
        status: 'pending',
        created_at: '2026-06-19T09:00:00Z',
        task_type: 'request',
        timing_preference: 'anytime',
        requested_for_at: null,
      },
    ];
    const rows = mergeRows(supplies as any, tasks as any);
    expect(rows.map((r) => r.id)).toEqual(['t1', 's1']);
    expect(rows[0].type).toBe('request');
    expect(rows[1].type).toBe('supply');
  });

  it('renders the supply title from description when present', () => {
    const supplies = [
      {
        id: 's1',
        requester_id: 'u',
        delivery_location: '1602',
        status: 'submitted',
        created_at: '2026-06-18T10:00:00Z',
        description: 'Pens, paper',
      },
    ];
    const rows = mergeRows(supplies as any, []);
    expect(rows[0].title).toBe('Pens, paper');
  });

  it('falls back to "Supply order" when description is missing', () => {
    const supplies = [
      {
        id: 's1',
        requester_id: 'u',
        delivery_location: '1602',
        status: 'submitted',
        created_at: '2026-06-18T10:00:00Z',
      },
    ];
    const rows = mergeRows(supplies as any, []);
    expect(rows[0].title).toBe('Supply order');
  });

  it('renders the request title as the first ~60 chars of description with ellipsis', () => {
    const longDesc =
      'Lateral file cabinet on the east wall is busted — replace with another lateral by the end of the week';
    const tasks = [
      {
        id: 't1',
        created_by: 'u',
        room_id: 'r1',
        description: longDesc,
        status: 'pending',
        created_at: '2026-06-19T09:00:00Z',
        task_type: 'request',
        timing_preference: 'anytime',
        requested_for_at: null,
      },
    ];
    const rows = mergeRows([], tasks as any);
    expect(rows[0].title.length).toBeLessThanOrEqual(63);
    expect(rows[0].title.endsWith('…')).toBe(true);
  });

  it('handles empty inputs', () => {
    expect(mergeRows([], [])).toEqual([]);
  });
});
