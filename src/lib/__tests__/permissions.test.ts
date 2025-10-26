/**
 * Permissions Tests
 * 
 * Tests for RBAC permission system
 */

import { hasPermission, hasAnyPermission, hasAllPermissions, USER_ROLES } from '../permissions';

describe('Permissions RBAC', () => {
  describe('hasPermission', () => {
    it('administrator can update facility status', () => {
      const result = hasPermission(USER_ROLES.ADMIN, 'facility.update_status');
      expect(result).toBe(true);
    });

    it('facilities_staff can update facility status', () => {
      const result = hasPermission(USER_ROLES.FACILITIES_STAFF, 'facility.update_status');
      expect(result).toBe(true);
    });

    it('staff cannot update facility status', () => {
      const result = hasPermission(USER_ROLES.STAFF, 'facility.update_status');
      expect(result).toBe(false);
    });

    it('user cannot update facility status', () => {
      const result = hasPermission(USER_ROLES.USER, 'facility.update_status');
      expect(result).toBe(false);
    });

    it('only administrator can delete facilities', () => {
      expect(hasPermission(USER_ROLES.ADMIN, 'facility.delete')).toBe(true);
      expect(hasPermission(USER_ROLES.MANAGER, 'facility.delete')).toBe(false);
      expect(hasPermission(USER_ROLES.FACILITIES_STAFF, 'facility.delete')).toBe(false);
    });

    it('administrator, manager, and facilities_staff can view audit trail', () => {
      expect(hasPermission(USER_ROLES.ADMIN, 'audit.view')).toBe(true);
      expect(hasPermission(USER_ROLES.MANAGER, 'audit.view')).toBe(true);
      expect(hasPermission(USER_ROLES.FACILITIES_STAFF, 'audit.view')).toBe(true);
      expect(hasPermission(USER_ROLES.STAFF, 'audit.view')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true if user has at least one permission', () => {
      const result = hasAnyPermission(USER_ROLES.STAFF, [
        'facility.delete', // staff doesn't have
        'facility.view',   // staff has this
      ]);
      expect(result).toBe(true);
    });

    it('returns false if user has none of the permissions', () => {
      const result = hasAnyPermission(USER_ROLES.USER, [
        'facility.delete',
        'facility.edit',
        'admin.users',
      ]);
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true if user has all permissions', () => {
      const result = hasAllPermissions(USER_ROLES.ADMIN, [
        'facility.view',
        'facility.update_status',
        'facility.edit',
      ]);
      expect(result).toBe(true);
    });

    it('returns false if user is missing any permission', () => {
      const result = hasAllPermissions(USER_ROLES.STAFF, [
        'facility.view',        // staff has
        'facility.update_status', // staff doesn't have
      ]);
      expect(result).toBe(false);
    });
  });
});
