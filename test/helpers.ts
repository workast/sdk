import { vi } from 'vitest';
import { Workast } from '../src/index.js';

export const DEFAULT_BASE_URL = 'https://api.workast.com';
export const API_KEY = 'test-api-key';

export type MockFetch = ReturnType<typeof vi.fn<typeof fetch>>;

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const createdTask = {
  id: 'task-1',
  text: 'Hello',
  list: { id: 'list-1' },
};

export function mockFetch(status = 201, body: unknown = createdTask): MockFetch {
  return vi.fn<typeof fetch>(async () => {
    if (status === 204) {
      return new Response(null, { status });
    }
    return jsonResponse(status, body);
  });
}

export function makeClient(options: {
  apiKey?: string;
  token?: string;
  getToken?: () => string | Promise<string>;
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
  fetch?: typeof fetch;
} = {}): {
  client: Workast;
  fetch: MockFetch;
} {
  const fetchFn = (options.fetch as MockFetch | undefined) ?? mockFetch();
  const hasAuth = options.apiKey != null || options.token != null || options.getToken != null;
  const client = new Workast({
    ...(hasAuth ? {} : { apiKey: API_KEY }),
    ...options,
    fetch: fetchFn,
  });
  return { client, fetch: fetchFn };
}

export function getRequest(fetchMock: MockFetch, index = -1) {
  const { calls } = fetchMock.mock;
  const call = index < 0 ? calls[calls.length + index] : calls[index];
  if (!call) {
    throw new Error('fetch was not called');
  }
  const [input, init] = call;
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
  return {
    url,
    method: init?.method ?? 'GET',
    headers: new Headers(init?.headers),
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
    signal: init?.signal,
  };
}
