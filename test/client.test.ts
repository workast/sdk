import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimeoutError, Workast } from '../src/index.js';
import { API_KEY, DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from './helpers.js';

const listId = 'list-1';
const body = { text: 'Ship v3' };

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(globalThis, 'window');
});

describe('Workast constructor auth', () => {
  it('sends Authorization Bearer from { apiKey }', async () => {
    const { client, fetch } = makeClient({ apiKey: API_KEY });
    await client.tasks.create(listId, body);
    expect(getRequest(fetch).headers.get('Authorization')).toBe(`Bearer ${API_KEY}`);
  });

  it('sends Authorization Bearer from string shorthand', async () => {
    const fetch = mockFetch();
    vi.stubGlobal('fetch', fetch);
    const client = new Workast(API_KEY);
    await client.tasks.create(listId, body);
    expect(getRequest(fetch).headers.get('Authorization')).toBe(`Bearer ${API_KEY}`);
  });

  it('sends Authorization Bearer from { token }', async () => {
    const { client, fetch } = makeClient({ token: 'oauth-token' });
    await client.tasks.create(listId, body);
    expect(getRequest(fetch).headers.get('Authorization')).toBe('Bearer oauth-token');
  });

  it('awaits getToken per request and sends it as Bearer', async () => {
    const getToken = vi.fn()
      .mockResolvedValueOnce('token-one')
      .mockResolvedValueOnce('token-two');
    const { client, fetch } = makeClient({ getToken });

    await client.tasks.create(listId, body);
    await client.tasks.create(listId, body);

    expect(getToken).toHaveBeenCalledTimes(2);
    expect(getRequest(fetch, 0).headers.get('Authorization')).toBe('Bearer token-one');
    expect(getRequest(fetch, 1).headers.get('Authorization')).toBe('Bearer token-two');
  });

  it('throws when auth is missing', () => {
    expect(() => new Workast({} as ConstructorParameters<typeof Workast>[0])).toThrow();
  });

  it('{ apiKey } in a browser throws unless dangerouslyAllowBrowser is true', () => {
    vi.stubGlobal('window', {});
    expect(() => new Workast({ apiKey: API_KEY })).toThrow(/Workast\.public/);
    expect(() => new Workast({ apiKey: API_KEY })).toThrow(/dangerouslyAllowBrowser/);
    expect(() => new Workast(API_KEY)).toThrow(/Workast\.public/);
    expect(() => new Workast(API_KEY)).toThrow(/dangerouslyAllowBrowser/);
    expect(() => new Workast({ apiKey: API_KEY, dangerouslyAllowBrowser: true })).not.toThrow();
  });

  it('does not throw when { token } is used in a browser', () => {
    vi.stubGlobal('window', {});
    expect(() => new Workast({ token: 'oauth-token' })).not.toThrow();
  });
});

describe('Workast headers', () => {
  it('sends headers from the constructor on the request', async () => {
    const { client, fetch } = makeClient({
      headers: { 'X-Workspace': 'acme', 'W-TEAM-ID': 'team-1' },
    });
    await client.tasks.create(listId, body);
    const { headers } = getRequest(fetch);
    expect(headers.get('X-Workspace')).toBe('acme');
    expect(headers.get('W-TEAM-ID')).toBe('team-1');
  });

  it('withHeaders returns a clone that sends merged headers; original is unchanged', async () => {
    const { client, fetch } = makeClient({ headers: { 'X-A': '1' } });
    const clone = client.withHeaders({ 'X-B': '2' });

    await clone.tasks.create(listId, body);
    const cloneHeaders = getRequest(fetch, 0).headers;
    expect(cloneHeaders.get('X-A')).toBe('1');
    expect(cloneHeaders.get('X-B')).toBe('2');

    await client.tasks.create(listId, body);
    const originalHeaders = getRequest(fetch, 1).headers;
    expect(originalHeaders.get('X-A')).toBe('1');
    expect(originalHeaders.get('X-B')).toBeNull();
  });

  it('setHeaders mutates subsequent requests on the same instance', async () => {
    const { client, fetch } = makeClient();
    await client.tasks.create(listId, body);
    expect(getRequest(fetch, 0).headers.get('X-Mutated')).toBeNull();

    client.setHeaders({ 'X-Mutated': 'yes' });
    await client.tasks.create(listId, body);
    expect(getRequest(fetch, 1).headers.get('X-Mutated')).toBe('yes');
  });

  it('does not let constructor headers override Authorization', async () => {
    const { client, fetch } = makeClient({
      apiKey: API_KEY,
      headers: { Authorization: 'Bearer hacked' },
    });
    await client.tasks.create(listId, body);
    expect(getRequest(fetch).headers.get('Authorization')).toBe(`Bearer ${API_KEY}`);
  });

  it('does not let withHeaders override Authorization', async () => {
    const { client, fetch } = makeClient({ apiKey: API_KEY });
    const clone = client.withHeaders({ Authorization: 'Bearer hacked' });
    await clone.tasks.create(listId, body);
    expect(getRequest(fetch).headers.get('Authorization')).toBe(`Bearer ${API_KEY}`);
  });

  it('does not let setHeaders override Authorization', async () => {
    const { client, fetch } = makeClient({ apiKey: API_KEY });
    client.setHeaders({ Authorization: 'Bearer hacked' });
    await client.tasks.create(listId, body);
    expect(getRequest(fetch).headers.get('Authorization')).toBe(`Bearer ${API_KEY}`);
  });
});

describe('Workast baseUrl', () => {
  it('uses the default API host when baseUrl is omitted', async () => {
    const { client, fetch } = makeClient();
    await client.tasks.create(listId, body);
    expect(getRequest(fetch).url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/task`);
  });
});

describe('Workast timeout', () => {
  function hungUntilAbort(): ReturnType<typeof mockFetch> {
    return vi.fn(async (_input, init) => {
      const signal = init?.signal;
      if (!signal) {
        return new Promise(() => {});
      }
      if (signal.aborted) {
        throw signal.reason;
      }
      await new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason));
      });
    });
  }

  it('passes AbortSignal.timeout(30000) as the fetch signal by default', async () => {
    const { client, fetch } = makeClient();
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    await client.tasks.create(listId, body);
    expect(timeoutSpy).toHaveBeenCalledWith(30_000);
    expect(getRequest(fetch).signal).toBe(timeoutSpy.mock.results[0].value);
    timeoutSpy.mockRestore();
  });

  it('rejects with TimeoutError when the constructor timeout elapses', async () => {
    const { client } = makeClient({ timeout: 50, fetch: hungUntilAbort() });
    await expect(client.tasks.create(listId, body)).rejects.toBeInstanceOf(TimeoutError);
  });

  it('does not call AbortSignal.timeout or pass a signal when timeout is 0', async () => {
    const { client, fetch } = makeClient({ timeout: 0 });
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    await client.tasks.create(listId, body);
    expect(timeoutSpy).not.toHaveBeenCalled();
    expect(getRequest(fetch).signal).toBeUndefined();
    timeoutSpy.mockRestore();
  });

  it('uses AbortSignal.timeout(30000) with the string shorthand constructor', async () => {
    vi.stubGlobal('fetch', mockFetch());
    const client = new Workast(API_KEY);
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    await client.tasks.create(listId, body);
    expect(timeoutSpy).toHaveBeenCalledWith(30_000);
    timeoutSpy.mockRestore();
  });

  it('withHeaders clone still times out using the constructor timeout', async () => {
    const { client } = makeClient({ timeout: 50, fetch: hungUntilAbort() });
    const clone = client.withHeaders({ 'X-A': '1' });
    await expect(clone.tasks.create(listId, body)).rejects.toBeInstanceOf(TimeoutError);
  });

  it('lets per-request options.timeout override the client timeout', async () => {
    const { client: defaultClient } = makeClient({ fetch: hungUntilAbort() });
    await expect(defaultClient.tasks.create(listId, body, { timeout: 50 }))
      .rejects.toBeInstanceOf(TimeoutError);

    const { client, fetch } = makeClient({ timeout: 50 });
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    await client.tasks.create(listId, body, { timeout: 0 });
    expect(timeoutSpy).not.toHaveBeenCalled();
    expect(getRequest(fetch).signal).toBeUndefined();
    timeoutSpy.mockRestore();
  });

  it('rejects with TimeoutError when the response body is still reading after abort', async () => {
    const fetch = vi.fn(async (_input, init) => ({
      ok: true,
      status: 201,
      async text() {
        const signal = init?.signal;
        if (!signal) {
          return new Promise(() => {});
        }
        if (signal.aborted) {
          throw signal.reason;
        }
        await new Promise<never>((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason));
        });
      },
    }));
    const { client } = makeClient({ timeout: 50, fetch });
    await expect(client.tasks.create(listId, body)).rejects.toBeInstanceOf(TimeoutError);
  });
});
