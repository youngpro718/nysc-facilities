import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Read from env (Vite)
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable.');
}
if (!anonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable.');
}

export const supabase = createClient(url, anonKey);

type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, err: unknown) => void;
};

const DEFAULT_RETRY = {
  retries: 3,
  baseDelayMs: 300,
  maxDelayMs: 5000,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getHttpStatus(err: unknown): number | undefined {
  const e = err as any;
  if (typeof e?.status === 'number') return e.status;
  if (typeof e?.response?.status === 'number') return e.response.status;
  if (typeof e?.httpStatusCode === 'number') return e.httpStatusCode;
  return undefined;
}

function isNetworkLikeError(err: unknown): boolean {
  if (err instanceof TypeError) return true; // browser network failure
  const e = err as any;
  const msg = (e?.message || '').toString().toLowerCase();
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) return true;

  const code = (e?.code || '').toString().toUpperCase();
  if (['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'EHOSTUNREACH'].includes(code)) return true;

  return false;
}

function isRetriable(err: unknown): boolean {
  if (isNetworkLikeError(err)) return true;

  const status = getHttpStatus(err);
  if (status == null) return false;
  return [408, 425, 429, 500, 502, 503, 504].includes(status);
}

async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  const retries = options?.retries ?? DEFAULT_RETRY.retries;
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_RETRY.baseDelayMs;
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_RETRY.maxDelayMs;
  const deadline = options?.timeoutMs ? Date.now() + options.timeoutMs : undefined;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      attempt++;

      // Secure logging
      const status = getHttpStatus(err);
      const code = (err as any)?.code;
      const safeMeta = { status, code, attempt };
      if (import.meta.env.MODE === 'production') {
        logger.warn('supabase retry: attempt failed', safeMeta);
      } else {
        logger.warn('supabase retry: attempt failed (dev detail)', { ...safeMeta, err });
      }

      if (attempt > retries || !isRetriable(err)) {
        throw err;
      }
      if (deadline && Date.now() >= deadline) {
        throw err;
      }

      const jitter = Math.random() * 100;
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1)) + jitter;
      if (deadline) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw err;
        await sleep(Math.min(delay, remaining));
      } else {
        await sleep(delay);
      }

      options?.onRetry?.(attempt, err);
    }
  }
}

export const supabaseWithRetry = {
  async query<T>(fn: () => Promise<T>, opts?: RetryOptions) {
    return withRetry(fn, opts);
  },
};