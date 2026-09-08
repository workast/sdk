import { errorFromResponse, TimeoutError } from './errors.js';

export interface RequestOptions {
  headers?: Record<string, string>;
  query?: URLSearchParams;
  timeout?: number;
}

export interface RequestContext {
  baseUrl: string;
  headers: Record<string, string>;
  fetch: typeof fetch;
  timeout: number;
  resolveAuth(): Promise<string>;
}

export function withoutAuthorization(
  headers: Record<string, string> = {},
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== 'authorization') {
      next[key] = value;
    }
  }
  return next;
}

function isAbortError(err: unknown): boolean {
  return Boolean(
    err
    && typeof err === 'object'
    && 'name' in err
    && (err.name === 'TimeoutError' || err.name === 'AbortError')
  );
}

export async function request<T>(
  ctx: RequestContext,
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const token = await ctx.resolveAuth();
  const headers: Record<string, string> = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...ctx.headers,
    ...withoutAuthorization(options?.headers),
    Authorization: `Bearer ${token}`,
  };

  let url = `${ctx.baseUrl.replace(/\/$/, '')}${path}`;
  const qs = options?.query?.toString();
  if (qs) {
    url += `?${qs}`;
  }

  const timeout = options?.timeout ?? ctx.timeout;
  const signal = timeout > 0 ? AbortSignal.timeout(timeout) : undefined;

  try {
    const response = await ctx.fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch (err) {
        if (isAbortError(err)) {
          throw err;
        }
        errorBody = undefined;
      }
      throw errorFromResponse(response.status, errorBody);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  } catch (err) {
    if (signal && isAbortError(err)) {
      throw new TimeoutError(timeout);
    }
    throw err;
  }
}
