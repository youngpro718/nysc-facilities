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

  it('maps Postgres error codes to friendly copy', () => {
    expect(getErrorMessage({ code: '23505', message: 'duplicate key value violates unique constraint "rooms_pkey"' }))
      .toBe('That item already exists.');
    expect(getErrorMessage({ code: '23503', message: 'violates foreign key constraint' }))
      .toBe('This record is still referenced elsewhere and cannot be changed or removed.');
    expect(getErrorMessage({ code: '42501', message: 'permission denied for table rooms' }))
      .toBe('You do not have permission to perform this action.');
    expect(getErrorMessage({ code: 'PGRST116', message: 'no rows returned' }))
      .toBe('No matching record was found.');
  });

  it('translates raw Postgres text when no code is present', () => {
    expect(getErrorMessage(new Error('duplicate key value violates unique constraint "rooms_pkey"')))
      .toBe('That item already exists.');
    expect(getErrorMessage(new Error('new row violates row-level security policy')))
      .toBe('You do not have permission to perform this action.');
  });

  it('falls through to the raw message when no rule matches', () => {
    expect(getErrorMessage({ code: 'XX999', message: 'internal error' })).toBe('internal error');
  });
});
