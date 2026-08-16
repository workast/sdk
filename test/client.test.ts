import { afterEach, describe, expect, it, vi } from 'vitest';
import { Workast } from '../src/index.js';
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

  it('throws when { apiKey } is used in a browser', () => {
    vi.stubGlobal('window', {});
    expect(() => new Workast({ apiKey: API_KEY })).toThrow();
    expect(() => new Workast(API_KEY)).toThrow();
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
