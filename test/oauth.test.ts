import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationError, Workast } from '../src/index.js';
import {
  DEFAULT_BASE_URL,
  getRequest,
  jsonResponse,
  mockFetch,
  type MockFetch,
} from './helpers.js';

const AUTH_URL = 'https://my.workast.com';
const REDIRECT_URI = 'http://localhost:5173/';
const ORIGIN = 'http://localhost:5173';
const CLIENT_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaa';
const INSTANCE_CLIENT_ID = 'bbbbbbbbbbbbbbbbbbbbbbbbbb';
const AUTH_CODE = 'SplxlOBeZQQYbYS6WxSbIA';
const ACCESS_TOKEN = 'wat::from-auth';
const TOKEN_KEY = `workast.oauth.${CLIENT_ID}.token`;
const SCOPE_KEY = `workast.oauth.${CLIENT_ID}.scope`;

// RFC 7636 Appendix B sample (use when a test must know the challenge for a known verifier):
// verifier  dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
// challenge E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM

const webCryptoDigest = globalThis.crypto.subtle.digest.bind(globalThis.crypto.subtle);

type MemoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

type BrowserLocation = {
  href: string;
  origin: string;
  pathname: string;
  search: string;
  assign: ReturnType<typeof vi.fn>;
};

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(globalThis, 'window');
});

function createSessionStorage(): MemoryStorage {
  const data = new Map<string, string>();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key)! : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
  };
}

function createLocation(): BrowserLocation {
  return {
    origin: ORIGIN,
    pathname: '/',
    search: '',
    href: `${ORIGIN}/`,
    assign: vi.fn(),
  };
}

function createCryptoStub() {
  return {
    getRandomValues(array: Uint8Array) {
      for (let i = 0; i < array.length; i += 1) {
        array[i] = (i * 17 + 3) % 256;
      }
      return array;
    },
    subtle: {
      digest: webCryptoDigest,
    },
  };
}

function stubBrowser(overrides?: {
  sessionStorage?: MemoryStorage;
  localStorage?: MemoryStorage;
  location?: BrowserLocation;
}) {
  const sessionStorage = overrides?.sessionStorage ?? createSessionStorage();
  const localStorage = overrides?.localStorage ?? createSessionStorage();
  const location = overrides?.location ?? createLocation();
  const crypto = createCryptoStub();
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();
  vi.stubGlobal('window', {
    sessionStorage,
    localStorage,
    location,
    crypto,
    addEventListener,
    removeEventListener,
  });
  vi.stubGlobal('sessionStorage', sessionStorage);
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('location', location);
  vi.stubGlobal('crypto', crypto);
  return { sessionStorage, localStorage, location, addEventListener, removeEventListener };
}

function fetchUrl(input: RequestInfo | URL): string {
  return typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
}

function fetchCall(fetchMock: MockFetch, index: number) {
  const call = fetchMock.mock.calls[index];
  if (!call) {
    throw new Error('fetch was not called');
  }
  const [input, init] = call;
  return {
    url: fetchUrl(input),
    method: init?.method ?? 'GET',
    headers: new Headers(init?.headers),
    body: init?.body == null ? undefined : String(init.body),
    credentials: init?.credentials,
  };
}

function fetchCalls(fetchMock: MockFetch) {
  return fetchMock.mock.calls.map((_, index) => fetchCall(fetchMock, index));
}

function registerResponse() {
  return jsonResponse(201, {
    client_id: INSTANCE_CLIENT_ID,
    token_endpoint_auth_method: 'none',
  });
}

function oauthFetch(): MockFetch {
  return vi.fn(async (input) => {
    const url = fetchUrl(input);
    if (url.includes('/oauth/register')) {
      return registerResponse();
    }
    if (url.includes('/oauth/token')) {
      return jsonResponse(200, {
        access_token: ACCESS_TOKEN,
        token_type: 'Bearer',
        scope: 'task:find',
      });
    }
    if (url.includes('/logout')) {
      return jsonResponse(200, {});
    }
    if (url.includes('/user/me')) {
      return jsonResponse(200, { id: 'user-1', name: 'Ada' });
    }
    return jsonResponse(404, {});
  });
}

function assignedAuthorizeUrl(location: BrowserLocation): URL {
  expect(location.assign).toHaveBeenCalled();
  return new URL(String(location.assign.mock.calls[0][0]));
}

async function signInFromBlankPage(fetch: MockFetch) {
  const workast = Workast.public({ clientId: CLIENT_ID, fetch });
  await workast.signIn();
  return workast;
}

function dispatchStorage(
  addEventListener: ReturnType<typeof vi.fn>,
  event: { key: string; newValue: string | null },
) {
  const handler = addEventListener.mock.calls.find(([type]) => type === 'storage')?.[1];
  expect(handler).toEqual(expect.any(Function));
  handler(event);
}

async function completeCallback(fetch: MockFetch = oauthFetch()) {
  const browser = stubBrowser();
  vi.stubGlobal('fetch', fetch);
  await signInFromBlankPage(fetch);
  const state = assignedAuthorizeUrl(browser.location).searchParams.get('state');
  browser.location.search = `?code=${AUTH_CODE}&state=${state}`;
  browser.location.href = `${ORIGIN}/${browser.location.search}`;
  const workast = Workast.public({ clientId: CLIENT_ID, fetch });
  await workast.users.me();
  return { workast, fetch, ...browser };
}

describe('Workast.public', () => {
  it('throws when window is missing', () => {
    Reflect.deleteProperty(globalThis, 'window');
    expect(typeof Workast.public).toBe('function');
    expect(() => Workast.public({ clientId: CLIENT_ID })).toThrow();
  });

  it('is allowed when window is defined', () => {
    stubBrowser();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    expect(workast.auth.status).toBe('unauthenticated');
    expect(workast.auth.session).toBeNull();
  });
});

describe('Workast.public signIn()', () => {
  it('registers this origin and assigns the authorize URL', async () => {
    const { location } = stubBrowser();
    const fetch = vi.fn(async () => registerResponse());
    vi.stubGlobal('fetch', fetch);

    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    await workast.signIn();

    expect(fetch).toHaveBeenCalledTimes(1);
    const register = getRequest(fetch, 0);
    expect(register.method).toBe('POST');
    expect(register.url).toBe(`${AUTH_URL}/oauth/register`);
    expect(register.headers.get('Content-Type')).toMatch(/application\/json/);
    expect(register.headers.get('Authorization')).toBeNull();
    expect(register.body).toEqual({
      client_id: CLIENT_ID,
      redirect_uris: [REDIRECT_URI],
    });
    expect(register.body).not.toHaveProperty('client_name');

    expect(location.assign).toHaveBeenCalledTimes(1);
    const assigned = assignedAuthorizeUrl(location);
    expect(`${assigned.origin}${assigned.pathname}`).toBe(`${AUTH_URL}/oauth/authorize`);
    expect(assigned.searchParams.get('response_type')).toBe('code');
    expect(assigned.searchParams.get('client_id')).toBe(INSTANCE_CLIENT_ID);
    expect(assigned.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
    expect(assigned.searchParams.get('code_challenge_method')).toBe('S256');
    expect(assigned.searchParams.get('code_challenge')).toBeTruthy();
    expect(assigned.searchParams.get('state')).toBeTruthy();
    expect(assigned.searchParams.get('teamId')).toBeNull();
  });

  it('sends teamId as the authorize team hint', async () => {
    const { location } = stubBrowser();
    const fetch = vi.fn(async () => registerResponse());
    vi.stubGlobal('fetch', fetch);
    const teamId = '48dbcea6e5418e91f2328badfc66f7a9';

    const workast = Workast.public({ clientId: CLIENT_ID, teamId, fetch });
    await workast.signIn();

    expect(assignedAuthorizeUrl(location).searchParams.get('teamId')).toBe(teamId);
  });

  it('stays unauthenticated while register is in flight', async () => {
    stubBrowser();
    let release: (value: Response) => void = () => {};
    const fetch = vi.fn(() => new Promise<Response>((resolve) => {
      release = resolve;
    }));
    vi.stubGlobal('fetch', fetch);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch });

    const pending = workast.signIn();
    expect(workast.auth.status).toBe('unauthenticated');
    expect(workast.auth.error).toBeNull();

    release(registerResponse());
    await pending;
    expect(workast.auth.status).toBe('unauthenticated');
  });

  it('is an error when register fails', async () => {
    stubBrowser();
    const fetch = vi.fn(async () => {
      throw new Error('network down');
    });
    vi.stubGlobal('fetch', fetch);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    const listener = vi.fn();
    workast.onAuthStateChange(listener);

    await expect(workast.signIn()).rejects.toThrow('network down');
    expect(workast.auth.status).toBe('error');
    expect(workast.auth.session).toBeNull();
    expect(workast.auth.error).toBe('network down');
    expect(listener).toHaveBeenCalledWith('ERROR', null);
  });

  it('?error=access_denied is an error and not a code exchange', () => {
    const { location } = stubBrowser();
    location.search = '?error=access_denied&state=AjBHIg';
    location.href = `${ORIGIN}/${location.search}`;
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    const workast = Workast.public({ clientId: CLIENT_ID, fetch });

    expect(workast.auth.status).toBe('error');
    expect(workast.auth.session).toBeNull();
    expect(workast.auth.error).toBe('Sign-in was cancelled.');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('custom authUrl is used for register and authorize', async () => {
    const { location } = stubBrowser();
    const fetch = vi.fn(async () => registerResponse());
    vi.stubGlobal('fetch', fetch);
    const authUrl = 'https://my.hades.tech';

    const workast = Workast.public({ clientId: CLIENT_ID, authUrl, fetch });
    await workast.signIn();

    expect(getRequest(fetch, 0).url).toBe(`${authUrl}/oauth/register`);
    expect(String(location.assign.mock.calls[0][0])).toMatch(
      /^https:\/\/my\.hades\.tech\/oauth\/authorize/,
    );
  });

  it('is a redirect only', async () => {
    const { location } = stubBrowser();
    const fetch = vi.fn(async () => registerResponse());
    vi.stubGlobal('fetch', fetch);

    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    await workast.signIn();

    expect(location.search).toBe('');
    expect(fetchCalls(fetch).some((call) => call.url.includes('/oauth/token'))).toBe(false);
  });

  it('stores PKCE in sessionStorage and does not write a token to localStorage', async () => {
    const { sessionStorage, localStorage } = stubBrowser();
    const fetch = oauthFetch();
    vi.stubGlobal('fetch', fetch);

    await signInFromBlankPage(fetch);

    expect(sessionStorage.getItem(`workast.oauth.${CLIENT_ID}.verifier`)).toBeTruthy();
    expect(sessionStorage.getItem(`workast.oauth.${CLIENT_ID}.state`)).toBeTruthy();
    expect(sessionStorage.getItem(`workast.oauth.${CLIENT_ID}.instanceClientId`)).toBe(
      INSTANCE_CLIENT_ID,
    );
    expect(sessionStorage.getItem(`workast.oauth.${CLIENT_ID}.redirectUri`)).toBe(REDIRECT_URI);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe('Workast.public callback', () => {
  it('exchanges ?code= + stored verifier for a Bearer token', async () => {
    const { location, localStorage } = stubBrowser();
    const fetch = oauthFetch();
    vi.stubGlobal('fetch', fetch);

    await signInFromBlankPage(fetch);
    const state = assignedAuthorizeUrl(location).searchParams.get('state');
    expect(state).toBeTruthy();

    location.search = `?code=${AUTH_CODE}&state=${state}`;
    location.href = `${ORIGIN}/${location.search}`;

    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    expect(workast.auth.status).toBe('loading');
    expect(workast.auth.session).toBeNull();

    await workast.users.me();

    expect(workast.auth.status).toBe('authenticated');
    expect(workast.auth.session?.token).toBe(ACCESS_TOKEN);
    expect(workast.auth.session?.scope).toBe('task:find');
    expect(localStorage.getItem(TOKEN_KEY)).toBe(ACCESS_TOKEN);

    expect(fetchCalls(fetch).filter((call) => call.url.includes('/oauth/register'))).toHaveLength(1);

    const token = fetchCalls(fetch).find((call) => call.url === `${AUTH_URL}/oauth/token`);
    expect(token).toBeDefined();
    expect(token?.method).toBe('POST');
    expect(token?.headers.get('Content-Type')).toMatch(/application\/x-www-form-urlencoded/);
    expect(token?.headers.get('Authorization')).toBeNull();
    expect(token?.body).toContain('grant_type=authorization_code');
    expect(token?.body).toContain(`code=${AUTH_CODE}`);
    expect(token?.body).toContain(`client_id=${INSTANCE_CLIENT_ID}`);
    expect(token?.body).toContain(`redirect_uri=${REDIRECT_URI}`);
    expect(token?.body).toContain('code_verifier');

    const me = getRequest(fetch);
    expect(me.method).toBe('GET');
    expect(me.url).toBe(`${DEFAULT_BASE_URL}/user/me`);
    expect(me.headers.get('Authorization')).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  it('reload reuses the stored access token', async () => {
    const { location, sessionStorage, localStorage } = stubBrowser();
    const setupFetch = oauthFetch();
    await signInFromBlankPage(setupFetch);
    const state = assignedAuthorizeUrl(location).searchParams.get('state');
    location.search = `?code=${AUTH_CODE}&state=${state}`;
    location.href = `${ORIGIN}/${location.search}`;
    await Workast.public({ clientId: CLIENT_ID, fetch: setupFetch }).users.me();

    expect(localStorage.getItem(TOKEN_KEY)).toBe(ACCESS_TOKEN);
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();

    location.search = '';
    location.href = `${ORIGIN}/`;

    const fetch = mockFetch(200, { id: 'user-1' });
    vi.stubGlobal('fetch', fetch);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    await workast.users.me();

    const me = getRequest(fetch);
    expect(me.headers.get('Authorization')).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(fetchCalls(fetch).some((call) => call.url.includes('/oauth/register'))).toBe(false);
    expect(fetchCalls(fetch).some((call) => call.url.includes('/oauth/token'))).toBe(false);
  });

  it('users.me() before signIn throws', async () => {
    stubBrowser();
    const fetch = mockFetch(200, { id: 'user-1' });
    vi.stubGlobal('fetch', fetch);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    await expect(workast.users.me()).rejects.toThrow();
  });

  it('callback without a stored token is loading then SIGNED_IN with a localStorage token', async () => {
    const { location, sessionStorage, localStorage } = stubBrowser();
    const fetch = oauthFetch();
    vi.stubGlobal('fetch', fetch);

    await signInFromBlankPage(fetch);
    const state = assignedAuthorizeUrl(location).searchParams.get('state');
    location.search = `?code=${AUTH_CODE}&state=${state}`;
    location.href = `${ORIGIN}/${location.search}`;

    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    expect(workast.auth.status).toBe('loading');
    expect(workast.auth.session).toBeNull();

    const listener = vi.fn();
    workast.onAuthStateChange(listener);
    await workast.users.me();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('SIGNED_IN', {
      token: ACCESS_TOKEN,
      scope: 'task:find',
    });
    expect(localStorage.getItem(TOKEN_KEY)).toBe(ACCESS_TOKEN);
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('a failed code exchange is an error and does not fire SIGNED_IN', async () => {
    const { location } = stubBrowser();
    const fetch = vi.fn(async (input) => {
      const url = fetchUrl(input);
      if (url.includes('/oauth/register')) {
        return registerResponse();
      }
      if (url.includes('/oauth/token')) {
        throw new Error('network down');
      }
      return jsonResponse(404, {});
    });
    vi.stubGlobal('fetch', fetch);

    await signInFromBlankPage(fetch);
    const state = assignedAuthorizeUrl(location).searchParams.get('state');
    location.search = `?code=${AUTH_CODE}&state=${state}`;
    location.href = `${ORIGIN}/${location.search}`;

    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    const listener = vi.fn();
    workast.onAuthStateChange(listener);
    expect(workast.auth.status).toBe('loading');

    await expect(workast.users.me()).rejects.toThrow('network down');

    expect(workast.auth.status).toBe('error');
    expect(workast.auth.session).toBeNull();
    expect(workast.auth.error).toBe('network down');
    expect(listener).toHaveBeenCalledWith('ERROR', null);
    expect(listener).not.toHaveBeenCalledWith('SIGNED_IN', expect.anything());
  });

  it('shared callback exchange notifies each client SIGNED_IN once', async () => {
    const { location } = stubBrowser();
    const fetch = oauthFetch();
    vi.stubGlobal('fetch', fetch);

    await signInFromBlankPage(fetch);
    const state = assignedAuthorizeUrl(location).searchParams.get('state');
    location.search = `?code=${AUTH_CODE}&state=${state}`;
    location.href = `${ORIGIN}/${location.search}`;

    const first = Workast.public({ clientId: CLIENT_ID, fetch });
    const second = Workast.public({ clientId: CLIENT_ID, fetch });
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    first.onAuthStateChange(firstListener);
    second.onAuthStateChange(secondListener);

    await first.users.me();

    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(firstListener).toHaveBeenCalledWith('SIGNED_IN', {
      token: ACCESS_TOKEN,
      scope: 'task:find',
    });
    expect(secondListener).toHaveBeenCalledTimes(1);
    expect(secondListener).toHaveBeenCalledWith('SIGNED_IN', {
      token: ACCESS_TOKEN,
      scope: 'task:find',
    });
  });
});

describe('Workast.public auth', () => {
  it('fresh client is unauthenticated with a null session', () => {
    stubBrowser();
    const workast = Workast.public({ clientId: CLIENT_ID, fetch: vi.fn() });
    expect(workast.auth.status).toBe('unauthenticated');
    expect(workast.auth.session).toBeNull();
  });

  it('stored localStorage token is authenticated without firing on subscribe', async () => {
    const { localStorage } = stubBrowser();
    localStorage.setItem(TOKEN_KEY, ACCESS_TOKEN);
    localStorage.setItem(SCOPE_KEY, 'task:find');

    const workast = Workast.public({ clientId: CLIENT_ID, fetch: vi.fn() });
    expect(workast.auth.status).toBe('authenticated');
    expect(workast.auth.session?.token).toBe(ACCESS_TOKEN);
    expect(workast.auth.session?.scope).toBe('task:find');

    const listener = vi.fn();
    workast.onAuthStateChange(listener);
    await Promise.resolve();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('Workast.public signOut()', () => {
  it('POSTs /logout after a completed callback, clears localStorage, and fires SIGNED_OUT', async () => {
    const { workast, fetch, localStorage } = await completeCallback();
    const listener = vi.fn();
    workast.onAuthStateChange(listener);

    await workast.signOut();

    const logouts = fetchCalls(fetch).filter((call) => call.url === `${AUTH_URL}/logout`);
    expect(logouts).toHaveLength(1);
    expect(logouts[0].method).toBe('POST');
    expect(logouts[0].headers.get('Authorization')).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(logouts[0].credentials).toBe('omit');
    expect(logouts[0].body).toBeUndefined();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(SCOPE_KEY)).toBeNull();
    expect(workast.auth.status).toBe('unauthenticated');
    expect(workast.auth.session).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('SIGNED_OUT', null);
  });

  it('still clears localStorage and fires SIGNED_OUT when /logout fetch rejects', async () => {
    const { localStorage } = stubBrowser();
    localStorage.setItem(TOKEN_KEY, ACCESS_TOKEN);
    localStorage.setItem(SCOPE_KEY, 'task:find');
    const fetch = vi.fn(async (input) => {
      if (fetchUrl(input).includes('/logout')) {
        throw new Error('network down');
      }
      return jsonResponse(404, {});
    });
    vi.stubGlobal('fetch', fetch);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    const listener = vi.fn();
    workast.onAuthStateChange(listener);

    await workast.signOut();

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(SCOPE_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledWith('SIGNED_OUT', null);
  });

  it('stays authenticated while /logout is in flight', async () => {
    const { localStorage } = stubBrowser();
    localStorage.setItem(TOKEN_KEY, ACCESS_TOKEN);
    let release: (value: Response) => void = () => {};
    const fetch = vi.fn(() => new Promise<Response>((resolve) => {
      release = resolve;
    }));
    vi.stubGlobal('fetch', fetch);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch });

    const pending = workast.signOut();
    expect(workast.auth.status).toBe('authenticated');

    release(jsonResponse(200, {}));
    await pending;
    expect(workast.auth.status).toBe('unauthenticated');
  });

  it('does not POST /logout or fire SIGNED_OUT when already unauthenticated', async () => {
    stubBrowser();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    const listener = vi.fn();
    workast.onAuthStateChange(listener);

    await workast.signOut();

    expect(fetchCalls(fetch).some((call) => call.url.includes('/logout'))).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('Workast.public 401', () => {
  it('users.me() 401 rejects AuthenticationError, clears the token, and fires SIGNED_OUT without /logout', async () => {
    const { localStorage } = stubBrowser();
    localStorage.setItem(TOKEN_KEY, ACCESS_TOKEN);
    localStorage.setItem(SCOPE_KEY, 'task:find');
    const fetch = vi.fn(async () => jsonResponse(401, {
      error: { name: 'UserUnauthorizedError', message: 'User unauthorized' },
    }));
    vi.stubGlobal('fetch', fetch);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    const listener = vi.fn();
    workast.onAuthStateChange(listener);

    await expect(workast.users.me()).rejects.toBeInstanceOf(AuthenticationError);

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(SCOPE_KEY)).toBeNull();
    expect(workast.auth.status).toBe('unauthenticated');
    expect(listener).toHaveBeenCalledWith('SIGNED_OUT', null);
    expect(fetchCalls(fetch).some((call) => call.url.includes('/logout'))).toBe(false);
  });

  it('two concurrent users.me() 401s fire SIGNED_OUT once and do not POST /logout', async () => {
    const { localStorage } = stubBrowser();
    localStorage.setItem(TOKEN_KEY, ACCESS_TOKEN);
    localStorage.setItem(SCOPE_KEY, 'task:find');
    const fetch = vi.fn(async () => jsonResponse(401, {
      error: { name: 'UserUnauthorizedError', message: 'User unauthorized' },
    }));
    vi.stubGlobal('fetch', fetch);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    const listener = vi.fn();
    workast.onAuthStateChange(listener);

    await Promise.all([
      expect(workast.users.me()).rejects.toBeInstanceOf(AuthenticationError),
      expect(workast.users.me()).rejects.toBeInstanceOf(AuthenticationError),
    ]);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('SIGNED_OUT', null);
    expect(fetchCalls(fetch).some((call) => call.url.includes('/logout'))).toBe(false);
  });
});

describe('Workast.public onAuthStateChange', () => {
  it('storage event with a token authenticates and fires SIGNED_IN', () => {
    const { localStorage, addEventListener } = stubBrowser();
    const workast = Workast.public({ clientId: CLIENT_ID, fetch: vi.fn() });
    const listener = vi.fn();
    workast.onAuthStateChange(listener);

    localStorage.setItem(TOKEN_KEY, 'tab-token');
    dispatchStorage(addEventListener, { key: TOKEN_KEY, newValue: 'tab-token' });

    expect(workast.auth.status).toBe('authenticated');
    expect(workast.auth.session?.token).toBe('tab-token');
    expect(listener).toHaveBeenCalledWith('SIGNED_IN', { token: 'tab-token' });
  });

  it('storage event removing the token unauthenticates and fires SIGNED_OUT', () => {
    const { localStorage, addEventListener } = stubBrowser();
    localStorage.setItem(TOKEN_KEY, ACCESS_TOKEN);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch: vi.fn() });
    const listener = vi.fn();
    workast.onAuthStateChange(listener);

    localStorage.removeItem(TOKEN_KEY);
    dispatchStorage(addEventListener, { key: TOKEN_KEY, newValue: null });

    expect(workast.auth.status).toBe('unauthenticated');
    expect(workast.auth.session).toBeNull();
    expect(listener).toHaveBeenCalledWith('SIGNED_OUT', null);
  });

  it('unsubscribed listener is not called by later signOut()', async () => {
    const { localStorage } = stubBrowser();
    localStorage.setItem(TOKEN_KEY, ACCESS_TOKEN);
    const fetch = oauthFetch();
    vi.stubGlobal('fetch', fetch);
    const workast = Workast.public({ clientId: CLIENT_ID, fetch });
    const listener = vi.fn();
    const unsubscribe = workast.onAuthStateChange(listener);

    unsubscribe();
    await workast.signOut();

    expect(listener).not.toHaveBeenCalled();
  });
});
