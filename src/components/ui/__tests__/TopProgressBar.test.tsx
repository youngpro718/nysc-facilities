import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

// Override the global react-query mock with hookable values for these tests.
let fetchingValue = 0;
let mutatingValue = 0;
vi.mock('@tanstack/react-query', () => ({
  useIsFetching: () => fetchingValue,
  useIsMutating: () => mutatingValue,
}));

import { TopProgressBar } from '../TopProgressBar';

const Nav = ({ to }: { to: string }) => {
  const navigate = useNavigate();
  return (
    <button data-testid={`go-${to}`} onClick={() => navigate(to)}>
      go {to}
    </button>
  );
};

const renderBar = (initial = '/') =>
  render(
    <MemoryRouter initialEntries={[initial]}>
      <TopProgressBar />
      <Routes>
        <Route
          path="*"
          element={
            <>
              <Nav to="/a" />
              <Nav to="/b" />
              <Nav to="/c" />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

const getBar = () => document.querySelector('[data-testid="top-progress-bar"]') as HTMLElement;
const getFill = () => getBar().firstElementChild as HTMLElement;
const widthPct = () => parseFloat(getFill().style.width || '0');

describe('TopProgressBar', () => {
  beforeEach(() => {
    fetchingValue = 0;
    mutatingValue = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders an aria-hidden bar element', () => {
    renderBar();
    expect(getBar()).toBeInTheDocument();
    expect(getBar().getAttribute('aria-hidden')).toBe('true');
  });

  it('jumps to >=25% on route change and becomes visible', () => {
    renderBar();
    act(() => {
      screen.getByTestId('go-/a').click();
    });
    expect(widthPct()).toBeGreaterThanOrEqual(25);
    expect(getBar().className).toContain('opacity-100');
  });

  it('trickles upward while fetching but never reaches 100', () => {
    fetchingValue = 1; // active from the very first render
    renderBar();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(widthPct()).toBeLessThanOrEqual(90);
    expect(widthPct()).toBeGreaterThan(25);
  });

  it('hides shortly after activity ends', () => {
    renderBar();
    act(() => {
      fetchingValue = 1;
      screen.getByTestId('go-/a').click();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      fetchingValue = 0;
      // trigger effect by navigating
      screen.getByTestId('go-/b').click();
    });
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(getBar().className).toContain('opacity-0');
    expect(widthPct()).toBe(0);
  });

  it('does not regress backward on rapid route changes', () => {
    renderBar();
    act(() => {
      fetchingValue = 1;
      screen.getByTestId('go-/a').click();
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    const before = widthPct();
    act(() => {
      screen.getByTestId('go-/b').click();
    });
    expect(widthPct()).toBeGreaterThanOrEqual(before);
  });

  it('safety timeout force-hides after 30s of stuck visible state', () => {
    renderBar();
    act(() => {
      screen.getByTestId('go-/a').click();
    });
    // fetching never starts; the route-change burst armed the safety timer.
    act(() => {
      vi.advanceTimersByTime(31_000);
    });
    expect(getBar().className).toContain('opacity-0');
  });

  it('cleans up timers on unmount without throwing', () => {
    const { unmount } = renderBar();
    act(() => {
      fetchingValue = 1;
      screen.getByTestId('go-/a').click();
    });
    expect(() => unmount()).not.toThrow();
  });
});
