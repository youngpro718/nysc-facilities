/**
 * Reload Debugger - Tracks what's causing app reloads/re-renders
 * Add this to help identify the source of constant reloading
 */

// Track query invalidations
let invalidationLog: { timestamp: number; queryKey: string; source: string }[] = [];

export function logInvalidation(queryKey: string, source: string) {
  const entry = {
    timestamp: Date.now(),
    queryKey,
    source,
  };
  invalidationLog.push(entry);
  
  // Keep only last 100 entries
  if (invalidationLog.length > 100) {
    invalidationLog = invalidationLog.slice(-100);
  }
  
  console.log(`[INVALIDATION] ${source} -> ${queryKey}`);
  
  // Check for rapid invalidations (more than 5 in 10 seconds)
  const recentInvalidations = invalidationLog.filter(
    (e) => Date.now() - e.timestamp < 10000
  );
  
  if (recentInvalidations.length > 5) {
    console.warn(
      `[RELOAD DEBUG] ⚠️ RAPID INVALIDATIONS DETECTED (${recentInvalidations.length} in 10s):`,
      recentInvalidations.map((e) => `${e.source}: ${e.queryKey}`).join(', ')
    );
  }
}

// Track realtime events
let realtimeLog: { timestamp: number; channel: string; event: string; table: string }[] = [];

export function logRealtimeEvent(channel: string, event: string, table: string) {
  const entry = {
    timestamp: Date.now(),
    channel,
    event,
    table,
  };
  realtimeLog.push(entry);
  
  // Keep only last 100 entries
  if (realtimeLog.length > 100) {
    realtimeLog = realtimeLog.slice(-100);
  }
  
  console.log(`[REALTIME] ${channel} -> ${table}.${event}`);
  
  // Check for rapid events (more than 10 in 10 seconds)
  const recentEvents = realtimeLog.filter(
    (e) => Date.now() - e.timestamp < 10000
  );
  
  if (recentEvents.length > 10) {
    console.warn(
      `[RELOAD DEBUG] ⚠️ RAPID REALTIME EVENTS (${recentEvents.length} in 10s):`,
      recentEvents.map((e) => `${e.channel}: ${e.table}.${e.event}`).join(', ')
    );
  }
}

// Track auth state changes
let authLog: { timestamp: number; event: string }[] = [];

export function logAuthEvent(event: string) {
  const entry = {
    timestamp: Date.now(),
    event,
  };
  authLog.push(entry);
  
  // Keep only last 50 entries
  if (authLog.length > 50) {
    authLog = authLog.slice(-50);
  }
  
  console.log(`[AUTH] ${event}`);
  
  // Check for rapid auth events (more than 3 in 30 seconds)
  const recentEvents = authLog.filter(
    (e) => Date.now() - e.timestamp < 30000
  );
  
  if (recentEvents.length > 3) {
    console.warn(
      `[RELOAD DEBUG] ⚠️ RAPID AUTH EVENTS (${recentEvents.length} in 30s):`,
      recentEvents.map((e) => e.event).join(', ')
    );
  }
}

// Track component mounts/unmounts
let mountLog: { timestamp: number; component: string; action: 'mount' | 'unmount' }[] = [];

export function logMount(component: string) {
  mountLog.push({ timestamp: Date.now(), component, action: 'mount' });
  if (mountLog.length > 200) mountLog = mountLog.slice(-200);
}

export function logUnmount(component: string) {
  mountLog.push({ timestamp: Date.now(), component, action: 'unmount' });
  if (mountLog.length > 200) mountLog = mountLog.slice(-200);
}

// Get debug summary
export function getDebugSummary() {
  const now = Date.now();
  const last30s = {
    invalidations: invalidationLog.filter((e) => now - e.timestamp < 30000),
    realtimeEvents: realtimeLog.filter((e) => now - e.timestamp < 30000),
    authEvents: authLog.filter((e) => now - e.timestamp < 30000),
    mounts: mountLog.filter((e) => now - e.timestamp < 30000),
  };
  
  console.log('=== RELOAD DEBUG SUMMARY (last 30s) ===');
  console.log(`Invalidations: ${last30s.invalidations.length}`);
  console.log(`Realtime Events: ${last30s.realtimeEvents.length}`);
  console.log(`Auth Events: ${last30s.authEvents.length}`);
  console.log(`Component Mounts: ${last30s.mounts.filter((m) => m.action === 'mount').length}`);
  console.log(`Component Unmounts: ${last30s.mounts.filter((m) => m.action === 'unmount').length}`);
  
  // Find most frequent invalidation sources
  const sourceCounts: Record<string, number> = {};
  last30s.invalidations.forEach((e) => {
    sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
  });
  
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (topSources.length > 0) {
    console.log('Top invalidation sources:', topSources);
  }
  
  return last30s;
}

// Persist to localStorage so we can see what happened before a reload
function persistLogs() {
  try {
    const data = {
      timestamp: Date.now(),
      invalidations: invalidationLog.slice(-50),
      realtime: realtimeLog.slice(-50),
      auth: authLog.slice(-20),
    };
    localStorage.setItem('__reloadDebugLogs', JSON.stringify(data));
  } catch (e) {
    // Ignore storage errors
  }
}

// Get logs from before the last reload
function getPreReloadLogs() {
  try {
    const data = localStorage.getItem('__reloadDebugLogs');
    if (data) {
      const parsed = JSON.parse(data);
      const ageSeconds = Math.round((Date.now() - parsed.timestamp) / 1000);
      console.log(`=== PRE-RELOAD LOGS (from ${ageSeconds}s ago) ===`);
      console.log('Invalidations:', parsed.invalidations?.length || 0);
      console.log('Realtime events:', parsed.realtime?.length || 0);
      console.log('Auth events:', parsed.auth?.length || 0);
      
      if (parsed.invalidations?.length > 0) {
        console.log('Last invalidations:', parsed.invalidations.slice(-10));
      }
      if (parsed.realtime?.length > 0) {
        console.log('Last realtime events:', parsed.realtime.slice(-10));
      }
      if (parsed.auth?.length > 0) {
        console.log('Last auth events:', parsed.auth);
      }
      return parsed;
    }
  } catch (e) {
    console.log('No pre-reload logs found');
  }
  return null;
}

// Save logs periodically
if (typeof window !== 'undefined') {
  setInterval(persistLogs, 2000);
  
  // Also save on beforeunload
  window.addEventListener('beforeunload', () => {
    persistLogs();
    console.log('[RELOAD DEBUG] Page unloading - logs saved');
  });
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__reloadDebug = {
    getDebugSummary,
    invalidationLog: () => invalidationLog,
    realtimeLog: () => realtimeLog,
    authLog: () => authLog,
    mountLog: () => mountLog,
    getPreReloadLogs,
  };
  
  console.log('[RELOAD DEBUG] Debug tools available at window.__reloadDebug');
  console.log('  - __reloadDebug.getDebugSummary() - Get summary of last 30s');
  console.log('  - __reloadDebug.invalidationLog() - See all invalidations');
  console.log('  - __reloadDebug.realtimeLog() - See all realtime events');
  console.log('  - __reloadDebug.getPreReloadLogs() - See logs from BEFORE last reload');
  
  // Automatically show pre-reload logs on startup
  setTimeout(() => {
    const preLogs = getPreReloadLogs();
    if (preLogs && Date.now() - preLogs.timestamp < 120000) { // Within last 2 minutes
      console.warn('[RELOAD DEBUG] ⚠️ Recent reload detected! Check pre-reload logs above.');
    }
  }, 1000);
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    console.log(`[RELOAD DEBUG] Visibility changed: ${document.visibilityState}`);
  });
  
  // Track navigation events
  window.addEventListener('popstate', (e) => {
    console.error(`[RELOAD DEBUG] 🔴 POPSTATE (back/forward navigation):`, e.state);
  });
  
  // Track any programmatic navigation
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    console.log(`[RELOAD DEBUG] pushState:`, args[2]);
    return originalPushState.apply(this, args);
  };
  
  history.replaceState = function(...args) {
    console.log(`[RELOAD DEBUG] replaceState:`, args[2]);
    return originalReplaceState.apply(this, args);
  };
  
  // Track location changes
  let lastHref = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastHref) {
      console.error(`[RELOAD DEBUG] 🔴 URL CHANGED: ${lastHref} -> ${window.location.href}`);
      lastHref = window.location.href;
    }
  }, 100);
  
  // Log the current time every 10 seconds so we can see when reload happens
  setInterval(() => {
    console.log(`[RELOAD DEBUG] Heartbeat - app running for ${Math.round((Date.now() - performance.timing.navigationStart) / 1000)}s`);
  }, 10000);
  
  // Track WebSocket connections (Vite HMR)
  const originalWebSocket = window.WebSocket;
  window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
    console.log(`[RELOAD DEBUG] WebSocket connecting to: ${url}`);
    const ws = new originalWebSocket(url, protocols);
    
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'full-reload' || data.type === 'reload') {
          console.error(`[RELOAD DEBUG] 🔴 HMR FULL RELOAD TRIGGERED!`, data);
        } else if (data.type === 'update') {
          console.log(`[RELOAD DEBUG] HMR update:`, data);
        }
      } catch (e) {
        // Not JSON, ignore
      }
    });
    
    ws.addEventListener('close', () => {
      console.warn(`[RELOAD DEBUG] WebSocket closed: ${url}`);
    });
    
    return ws;
  } as any;
  (window.WebSocket as any).prototype = originalWebSocket.prototype;
  (window.WebSocket as any).CONNECTING = originalWebSocket.CONNECTING;
  (window.WebSocket as any).OPEN = originalWebSocket.OPEN;
  (window.WebSocket as any).CLOSING = originalWebSocket.CLOSING;
  (window.WebSocket as any).CLOSED = originalWebSocket.CLOSED;
}
