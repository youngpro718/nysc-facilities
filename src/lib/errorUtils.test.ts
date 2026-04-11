import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '@/lib/errorUtils';

describe('getErrorMessage', () => {
  it('normalizes network fetch failures into actionable copy', () => {
    expect(getErrorMessage(new Error('Failed to fetch'))).toBe(
      'Unable to reach the server. Please check your internet connection and try again.'
    );
    expect(getErrorMessage('Network Error')).toBe(
      'Unable to reach the server. Please check your internet connection and try again.'
    );
  });

  it('preserves non-network errors and unknown values', () => {
    expect(getErrorMessage(new Error('Invalid login credentials'))).toBe('Invalid login credentials');
    expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
  });
});
