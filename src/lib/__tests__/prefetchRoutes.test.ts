import { describe, it, expect, beforeEach, vi } from 'vitest';

// Reset module state between tests so the internal `prefetched` Set is fresh.
async function freshModule() {
  vi.resetModules();
  return await import('../prefetchRoutes');
}

describe('prefetchRoute', () => {
  let idleCalls: Array<() => void>;

  beforeEach(() => {
    idleCalls = [];
    (window as any).requestIdleCallback = (cb: () => void) => {
      idleCalls.push(cb);
      return 0;
    };
  });

  it('does nothing for unknown paths', async () => {
    const { prefetchRoute } = await freshModule();
    expect(() => prefetchRoute('/no/such/route')).not.toThrow();
    expect(idleCalls.length).toBe(0);
  });

  it('does nothing for null/undefined/empty', async () => {
    const { prefetchRoute } = await freshModule();
    prefetchRoute(null);
    prefetchRoute(undefined);
    prefetchRoute('');
    expect(idleCalls.length).toBe(0);
  });

  it('schedules a registered loader through requestIdleCallback', async () => {
    const { prefetchRoute } = await freshModule();
    prefetchRoute('/notifications');
    expect(idleCalls.length).toBe(1);
  });

  it('dedupes repeat calls for the same path', async () => {
    const { prefetchRoute } = await freshModule();
    prefetchRoute('/notifications');
    prefetchRoute('/notifications');
    prefetchRoute('/notifications');
    expect(idleCalls.length).toBe(1);
  });

  it('normalizes trailing slash and query/hash', async () => {
    const { prefetchRoute } = await freshModule();
    prefetchRoute('/notifications/');
    prefetchRoute('/notifications?x=1');
    prefetchRoute('/notifications#top');
    expect(idleCalls.length).toBe(1);
  });

  it('falls back to setTimeout when requestIdleCallback is unavailable', async () => {
    delete (window as any).requestIdleCallback;
    vi.useFakeTimers();
    const { prefetchRoute } = await freshModule();
    prefetchRoute('/profile');
    // Loader scheduled via setTimeout(_, 0); flushing shouldn't throw.
    expect(() => vi.advanceTimersByTime(10)).not.toThrow();
    vi.useRealTimers();
  });

  it('swallows loader rejections without throwing', async () => {
    const { prefetchRoute } = await freshModule();
    prefetchRoute('/keys');
    // Run the scheduled callback; even if the dynamic import rejects, no throw.
    await expect(
      Promise.resolve().then(() => idleCalls[0]?.()),
    ).resolves.not.toThrow();
  });
});
