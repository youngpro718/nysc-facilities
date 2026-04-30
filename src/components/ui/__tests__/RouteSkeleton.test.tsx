import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RouteSkeleton } from '../RouteSkeleton';

describe('RouteSkeleton', () => {
  it('renders a labeled status region', () => {
    const { getByRole } = render(<RouteSkeleton />);
    const region = getByRole('status');
    expect(region).toHaveAttribute('aria-label', 'Loading page');
    expect(region.getAttribute('data-testid')).toBe('route-skeleton');
  });

  it('uses skeleton placeholders, not a generic spinner', () => {
    const { container } = render(<RouteSkeleton />);
    expect(container.querySelector('.animate-spin')).toBeNull();
    // Tailwind Skeleton primitive uses animate-pulse
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders header, stat cards, and a content list', () => {
    const { container } = render(<RouteSkeleton />);
    // 2 header lines + 4 stat cards + 4 list rows = 10 placeholders
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(10);
  });
});
