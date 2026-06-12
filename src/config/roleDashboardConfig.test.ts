import { describe, expect, it } from 'vitest';
import { getRoleDashboardConfig } from '@/config/roleDashboardConfig';

describe('role dashboard config', () => {
  it('keeps purchasing anchored to supply room and inventory actions', () => {
    const config = getRoleDashboardConfig('purchasing');

    expect(config?.primaryAction.path).toBe('/supply-room');
    expect(config?.secondaryAction?.path).toBe('/inventory');
    expect(config?.quickActions.some(action => action.path === '/purchasing-dashboard')).toBe(false);
  });

  it('keeps court roles on their intended operational landing pages', () => {
    expect(getRoleDashboardConfig('court_liaison')?.primaryAction.path).toBe('/term-sheet');
    expect(getRoleDashboardConfig('court_officer')?.primaryAction.path).toBe('/keys');
  });

  it('no longer exposes a card-grid dashboard config for court_aide (Work Center replaces it)', () => {
    expect(getRoleDashboardConfig('court_aide')).toBeNull();
  });
});
