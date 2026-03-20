import { describe, expect, it } from 'vitest';
import { getDashboardForRole } from '@/routes/roleBasedRouting';
import { getNavigationRoutes } from '@/components/layout/config/navigation';
import type { RolePermissions } from '@features/auth/hooks/useRolePermissions';

const emptyPermissions: RolePermissions = {
  spaces: null,
  issues: null,
  occupants: null,
  inventory: null,
  supply_requests: null,
  supply_orders: null,
  keys: null,
  maintenance: null,
  court_operations: null,
  operations: null,
  dashboard: null,
  lighting: null,
};

describe('purchasing route mapping', () => {
  it('routes purchasing to the real inventory landing page', () => {
    expect(getDashboardForRole('purchasing')).toBe('/inventory');
  });

  it('does not expose the deprecated purchasing dashboard path', () => {
    const routes = getNavigationRoutes(emptyPermissions, 'purchasing');

    expect(routes).toContain('/inventory');
    expect(routes).not.toContain('/purchasing-dashboard');
  });
});
