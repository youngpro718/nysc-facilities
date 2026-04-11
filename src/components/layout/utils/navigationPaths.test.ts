import { describe, expect, it } from 'vitest';
import { getNavigationPath } from './navigationPaths';

describe('navigationPaths', () => {
  it('routes non-admin supply requests to the existing my-supply-requests page', () => {
    expect(getNavigationPath('Supply Requests', false)).toBe('/my-supply-requests');
  });

  it('keeps admin supply requests on the admin management page', () => {
    expect(getNavigationPath('Supply Requests', true)).toBe('/admin/supply-requests');
  });
});
