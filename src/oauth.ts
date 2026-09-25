const DEFAULT_AUTH_URL = 'https://my.workast.com';
const STORAGE_PREFIX = 'workast.oauth.';
const inflightExchanges = new Map<string, Promise<string>>();

const STORAGE_KEYS = {
  token: 'token',
  scope: 'scope',
  verifier: 'verifier',
  state: 'state',
  instanceClientId: 'instanceClientId',
  redirectUri: 'redirectUri',
} as const;

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';
export type AuthSession = { token: string; scope?: string };
export type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'ERROR';
type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: AuthSession | null,
) => void;

export type WorkastPublicOptions = {
  clientId: string;
  authUrl?: string;
  baseUrl?: string;
  teamId?: string;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
  timeout?: number;
};

export class PublicOAuth {
  private readonly clientId: string;
  private readonly authUrl: string;
  private readonly teamId?: string;
  private readonly fetchFn: typeof fetch;
  private readonly exchange?: Promise<string>;
  private exchanging = false;
  private failure: string | null = null;
  private readonly listeners = new Set<AuthStateChangeCallback>();

  constructor(options: WorkastPublicOptions) {
    this.clientId = options.clientId;
    this.authUrl = (options.authUrl ?? DEFAULT_AUTH_URL).replace(/\/$/, '');
    this.teamId = options.teamId;
    this.fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
    const params = callbackParams();
    if (params.error) {
      this.failure = oauthErrorMessage(params.error, params.errorDescription);
      stripCallbackParams();
    } else if (params.code && params.state) {
      const key = `${this.clientId}:${params.code}`;
      let exchange = inflightExchanges.get(key);
      this.exchanging = true;
      if (!exchange) {
        exchange = this.exchangeToken(params.code, params.state).finally(() => {
          inflightExchanges.delete(key);
        });
        inflightExchanges.set(key, exchange);
      }
      this.exchange = exchange;
      this.exchange.then(
        () => {
          this.exchanging = false;
          this.emit('SIGNED_IN', this.session);
        },
        (error: unknown) => {
          this.exchanging = false;
          this.failure = error instanceof Error ? error.message : 'Could not sign in.';
          this.emit('ERROR', null);
        },
      );
      this.exchange.finally(() => {
        this.exchanging = false;
      }).catch(() => {});
    }
    window.addEventListener('storage', this.onStorage);
  }

  get status(): AuthStatus {
    if (this.exchanging) {
      return 'loading';
    }
    if (this.getStored(STORAGE_KEYS.token)) {
      return 'authenticated';
    }
    if (this.failure) {
      return 'error';
    }
    return 'unauthenticated';
  }

  get error(): string | null {
    return this.status === 'error' ? this.failure : null;
  }

  get session(): AuthSession | null {
    const token = this.getStored(STORAGE_KEYS.token);
    if (!token) {
      return null;
    }
    const scope = this.getStored(STORAGE_KEYS.scope);
    return scope ? { token, scope } : { token };
  }

  async signIn(): Promise<void> {
    this.failure = null;
    try {
      await this.redirectToAuthorize();
    } catch (error) {
      this.failure = error instanceof Error ? error.message : 'Could not sign in.';
      this.emit('ERROR', null);
      throw error;
    }
  }

  private async redirectToAuthorize(): Promise<void> {
    const redirectUri = currentRedirectUri();
    const instanceClientId = await this.resolveInstanceClientId(redirectUri);
    const verifier = randomBase64Url(32);
    const state = randomBase64Url(32);
    const challenge = await createChallenge(verifier);

    this.setStored(STORAGE_KEYS.verifier, verifier);
    this.setStored(STORAGE_KEYS.state, state);
    this.setStored(STORAGE_KEYS.instanceClientId, instanceClientId);
    this.setStored(STORAGE_KEYS.redirectUri, redirectUri);

    const url = new URL(`${this.authUrl}/oauth/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', instanceClientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    if (this.teamId) {
      url.searchParams.set('teamId', this.teamId);
    }
    window.location.assign(url.toString());
  }

  async signOut(): Promise<void> {
    const token = this.getStored(STORAGE_KEYS.token);
    if (!token) {
      return;
    }
    try {
      await this.fetchFn(`${this.authUrl}/logout`, {
        method: 'POST',
        credentials: 'omit',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // still clear locally
    }
    this.clearSession();
    this.emit('SIGNED_OUT', null);
  }

  onAuthStateChange(callback: AuthStateChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  handleAuthenticationError(): void {
    const token = this.getStored(STORAGE_KEYS.token);
    if (!token) {
      return;
    }
    this.clearSession();
    this.emit('SIGNED_OUT', null);
  }

  async resolveAuth(): Promise<string> {
    if (this.exchange) {
      try {
        return await this.exchange;
      } catch (error) {
        const stored = this.getStored(STORAGE_KEYS.token);
        if (stored) {
          return stored;
        }
        throw error;
      }
    }
    const token = this.getStored(STORAGE_KEYS.token);
    if (token) {
      return token;
    }
    throw new Error('Not authenticated. Call signIn() first.');
  }

  private async resolveInstanceClientId(redirectUri: string): Promise<string> {
    const existing = this.getStored(STORAGE_KEYS.instanceClientId);
    const storedRedirectUri = this.getStored(STORAGE_KEYS.redirectUri);
    if (existing && storedRedirectUri === redirectUri) {
      return existing;
    }
    const response = await this.fetchFn(`${this.authUrl}/oauth/register`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        redirect_uris: [redirectUri],
      }),
    });
    if (!response.ok) {
      throw new Error('Could not sign in.');
    }
    const data = (await response.json()) as { client_id?: string };
    if (!data.client_id) {
      throw new Error('OAuth register did not return client_id');
    }
    this.setStored(STORAGE_KEYS.instanceClientId, data.client_id);
    return data.client_id;
  }

  private async exchangeToken(code: string, state: string): Promise<string> {
    try {
      if (this.getStored(STORAGE_KEYS.state) !== state) {
        throw new Error('OAuth state mismatch');
      }
      const verifier = this.getStored(STORAGE_KEYS.verifier);
      const instanceClientId = this.getStored(STORAGE_KEYS.instanceClientId);
      const redirectUri = this.getStored(STORAGE_KEYS.redirectUri);
      if (!verifier || !instanceClientId || !redirectUri) {
        throw new Error('Missing OAuth session');
      }

      const response = await this.fetchFn(`${this.authUrl}/oauth/token`, {
        method: 'POST',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: [
          'grant_type=authorization_code',
          `client_id=${instanceClientId}`,
          `code=${code}`,
          `redirect_uri=${redirectUri}`,
          `code_verifier=${verifier}`,
        ].join('&'),
      });
      const data = (await response.json()) as { access_token?: string; scope?: string };
      if (!data.access_token) {
        throw new Error('OAuth token did not return access_token');
      }
      this.setStored(STORAGE_KEYS.token, data.access_token);
      if (data.scope) {
        this.setStored(STORAGE_KEYS.scope, data.scope);
      }
      stripCallbackParams();
      return data.access_token;
    } catch (error) {
      stripCallbackParams();
      throw error;
    }
  }

  private onStorage = (event: StorageEvent): void => {
    if (event.key !== this.storageKey(STORAGE_KEYS.token)) {
      return;
    }
    if (event.newValue) {
      const scope = this.getStored(STORAGE_KEYS.scope);
      this.emit('SIGNED_IN', scope ? { token: event.newValue, scope } : { token: event.newValue });
      return;
    }
    this.clearSession();
    this.emit('SIGNED_OUT', null);
  };

  private emit(event: AuthChangeEvent, session: AuthSession | null): void {
    for (const listener of this.listeners) {
      listener(event, session);
    }
  }

  private clearSession(): void {
    this.removeStored(STORAGE_KEYS.token);
    this.removeStored(STORAGE_KEYS.scope);
  }

  private storageKey(name: string): string {
    return `${STORAGE_PREFIX}${this.clientId}.${name}`;
  }

  private storeFor(name: string): Storage {
    return name === STORAGE_KEYS.token || name === STORAGE_KEYS.scope
      ? window.localStorage
      : window.sessionStorage;
  }

  private getStored(name: string): string | null {
    return this.storeFor(name).getItem(this.storageKey(name));
  }

  private setStored(name: string, value: string): void {
    this.storeFor(name).setItem(this.storageKey(name), value);
  }

  private removeStored(name: string): void {
    this.storeFor(name).removeItem(this.storageKey(name));
  }
}

function currentRedirectUri(): string {
  return window.location.origin + window.location.pathname;
}

function callbackParams(): {
  code: string | null;
  state: string | null;
  error: string | null;
  errorDescription: string | null;
} {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
  };
}

function oauthErrorMessage(error: string, description: string | null): string {
  if (error === 'access_denied') {
    return 'Sign-in was cancelled.';
  }
  return description || 'Could not sign in.';
}

function stripCallbackParams(): void {
  if (typeof history === 'undefined') {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('scope');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function createChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
