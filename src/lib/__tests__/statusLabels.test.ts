import { describe, it, expect } from 'vitest';
import {
  getFriendlySupplyStatus,
  getFriendlyIssueStatus,
  getFriendlyKeyStatus,
  toneClasses,
} from '../statusLabels';

describe('statusLabels', () => {
  it('maps known supply statuses to friendly labels', () => {
    expect(getFriendlySupplyStatus('submitted').label).toBe('Sent');
    expect(getFriendlySupplyStatus('picking').tone).toBe('progress');
    expect(getFriendlySupplyStatus('ready').tone).toBe('ready');
    expect(getFriendlySupplyStatus('fulfilled').tone).toBe('done');
    expect(getFriendlySupplyStatus('rejected').tone).toBe('attention');
  });

  it('maps known issue statuses', () => {
    expect(getFriendlyIssueStatus('open').label).toBe('Reported');
    expect(getFriendlyIssueStatus('in_progress').tone).toBe('progress');
    expect(getFriendlyIssueStatus('resolved').tone).toBe('done');
  });

  it('maps known key statuses', () => {
    expect(getFriendlyKeyStatus('pending').tone).toBe('pending');
    expect(getFriendlyKeyStatus('ready').label).toBe('Ready to pick up');
  });

  it('falls back gracefully for unknown statuses', () => {
    const r = getFriendlySupplyStatus('weird_state');
    expect(r.label).toBe('Weird State');
    expect(r.tone).toBeDefined();
  });

  it('handles null/undefined safely', () => {
    expect(getFriendlySupplyStatus(null).label).toBeTruthy();
    expect(getFriendlyIssueStatus(undefined).label).toBeTruthy();
    expect(getFriendlyKeyStatus('').label).toBeTruthy();
  });

  it('toneClasses returns a non-empty class string for every tone', () => {
    const tones = ['pending', 'progress', 'ready', 'done', 'attention', 'cancelled'] as const;
    for (const t of tones) {
      expect(toneClasses(t).length).toBeGreaterThan(0);
    }
  });
});
