import { describe, expect, it } from 'vitest';
import { getSupplySlaLevel } from '@/lib/supplySla';

const now = new Date('2026-06-20T12:00:00Z');

describe('supply SLA', () => {
  it('warns after five days and escalates after thirty days', () => {
    expect(getSupplySlaLevel('picking', '2026-06-14T12:00:00Z', now)).toBe('warning');
    expect(getSupplySlaLevel('picking', '2026-05-20T12:00:00Z', now)).toBe('critical');
  });

  it('does not alert on closed orders', () => {
    expect(getSupplySlaLevel('completed', '2026-01-01T12:00:00Z', now)).toBe('ok');
  });
});

