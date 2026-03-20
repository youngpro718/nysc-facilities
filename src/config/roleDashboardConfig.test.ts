import { describe, expect, it } from 'vitest';
import { getRoleDashboardConfig } from '@/config/roleDashboardConfig';

describe('role dashboard config', () => {
  it('keeps purchasing anchored to inventory and supply room actions', () => {
    const config = getRoleDashboardConfig('purchasing');

    expect(config?.primaryAction.path).toBe('/inventory');
    expect(config?.secondaryAction?.path).toBe('/supply-room');
    expect(config?.quickActions.some(action => action.path === '/purchasing-dashboard')).toBe(false);
  });

  it('keeps court roles on their intended operational landing pages', () => {
    expect(getRoleDashboardConfig('cmc')?.primaryAction.path).toBe('/court-operations');
    expect(getRoleDashboardConfig('court_officer')?.primaryAction.path).toBe('/keys');
    expect(getRoleDashboardConfig('court_aide')?.primaryAction.path).toBe('/tasks');
  });
});
