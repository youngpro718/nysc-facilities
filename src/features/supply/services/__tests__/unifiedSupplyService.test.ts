import { describe, expect, it } from 'vitest';
import { canTransitionTo } from '@features/supply/services/unifiedSupplyService';
import { STATUS_TRANSITIONS, OrderStatus, requiresJustificationForItems } from '@features/supply/constants';

const allStatuses = Object.keys(STATUS_TRANSITIONS) as OrderStatus[];

describe('canTransitionTo', () => {
  it('allows the documented happy path: submitted -> received -> picking -> ready -> completed', () => {
    expect(canTransitionTo('submitted', 'received')).toBe(true);
    expect(canTransitionTo('received', 'picking')).toBe(true);
    expect(canTransitionTo('picking', 'ready')).toBe(true);
    expect(canTransitionTo('ready', 'completed')).toBe(true);
  });

  it('allows the approval path: pending_approval -> approved -> received', () => {
    expect(canTransitionTo('pending_approval', 'approved')).toBe(true);
    expect(canTransitionTo('approved', 'received')).toBe(true);
  });

  it('only allows rejection from pending_approval — nothing in the UI ever rejects a submitted or received order', () => {
    expect(canTransitionTo('pending_approval', 'rejected')).toBe(true);
    expect(canTransitionTo('submitted', 'rejected')).toBe(false);
    expect(canTransitionTo('received', 'rejected')).toBe(false);
  });

  it('allows cancellation from every open status', () => {
    const openStatuses = allStatuses.filter(
      (s) => !['completed', 'cancelled', 'rejected'].includes(s),
    );
    for (const status of openStatuses) {
      expect(canTransitionTo(status, 'cancelled')).toBe(true);
    }
  });

  it('treats completed, cancelled, and rejected as terminal', () => {
    for (const terminal of ['completed', 'cancelled', 'rejected'] as OrderStatus[]) {
      for (const target of allStatuses) {
        expect(canTransitionTo(terminal, target)).toBe(false);
      }
    }
  });

  it('rejects an unknown target status instead of throwing', () => {
    expect(canTransitionTo('submitted', 'not_a_real_status' as OrderStatus)).toBe(false);
  });
});

describe('requiresJustificationForItems', () => {
  it('is false when no item is flagged', () => {
    expect(requiresJustificationForItems([{ id: '1', name: 'Pens' }])).toBe(false);
  });

  it('is true when any item is flagged', () => {
    expect(
      requiresJustificationForItems([
        { id: '1', name: 'Pens' },
        { id: '2', name: 'Toner', requires_justification: true },
      ]),
    ).toBe(true);
  });
});
