import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from 'sonner';
import { requestSubmittedToast, requestFailedToast, formatShortId } from '../requestToast';

beforeEach(() => {
  (toast.success as any).mockClear();
  (toast.error as any).mockClear();
});

describe('formatShortId', () => {
  it('uppercases the first 8 chars with a leading #', () => {
    expect(formatShortId('abc123de-foo-bar')).toBe('#ABC123DE');
  });

  it('handles short ids gracefully', () => {
    expect(formatShortId('abc')).toBe('#ABC');
  });
});

describe('requestSubmittedToast', () => {
  it('fires sonner success with the short id for a supply order', () => {
    requestSubmittedToast({ id: 'abc123de-foo', type: 'supply', needsApproval: false });
    expect(toast.success).toHaveBeenCalled();
    const call = (toast.success as any).mock.calls.at(-1)!;
    expect(call[0]).toContain('#ABC123DE');
    expect(call[0]).toMatch(/Order/);
    expect(call[0]).toMatch(/submitted/);
  });

  it('uses approval wording when needsApproval is true', () => {
    requestSubmittedToast({ id: 'abc123de-foo', type: 'supply', needsApproval: true });
    const call = (toast.success as any).mock.calls.at(-1)!;
    expect(call[0]).toMatch(/sent for approval/i);
  });

  it('uses "Request" noun for type=request', () => {
    requestSubmittedToast({ id: 'abc123de-foo', type: 'request' });
    const call = (toast.success as any).mock.calls.at(-1)!;
    expect(call[0]).toMatch(/Request/);
    expect(call[0]).not.toMatch(/Order/);
  });

  it('attaches a View action with a 6-second duration', () => {
    requestSubmittedToast({ id: 'abc123de-foo', type: 'request' });
    const opts = (toast.success as any).mock.calls.at(-1)![1];
    expect(opts.duration).toBe(6000);
    expect(opts.action.label).toBe('View');
    expect(typeof opts.action.onClick).toBe('function');
  });
});

describe('requestFailedToast', () => {
  it('fires sonner error with the message', () => {
    requestFailedToast('boom');
    expect(toast.error).toHaveBeenCalledWith('boom');
  });
});
