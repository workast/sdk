import {
  PublicOAuth,
  type AuthChangeEvent,
  type AuthSession,
  type AuthStatus,
  type WorkastPublicOptions,
} from './oauth.js';
import { request, withoutAuthorization, type RequestOptions } from './request.js';
import { Attachments } from './resources/attachments.js';
import { CalendarResource } from './resources/calendar.js';
import { Fields } from './resources/fields.js';
import { Lists } from './resources/lists.js';
import { MeetingsResource } from './resources/meetings.js';
import { NotesResource } from './resources/notes.js';
import { NotificationsResource } from './resources/notifications.js';
import { Reactions } from './resources/reactions.js';
import { SearchesResource } from './resources/searches.js';
import { Tags } from './resources/tags.js';
import { Tasks } from './resources/tasks.js';
import { Tokens } from './resources/tokens.js';
import { Users } from './resources/users.js';
import { WorkflowsResource } from './resources/workflows.js';

const DEFAULT_BASE_URL = 'https://api.workast.com';
const DEFAULT_TIMEOUT_MS = 30_000;

type WorkastConfig = {
  baseUrl?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
  timeout?: number;
  dangerouslyAllowBrowser?: boolean;
};

export type WorkastAuth =
  | { apiKey: string }
  | { token: string }
  | { getToken: () => string | Promise<string> };

export type WorkastOptions = WorkastAuth & WorkastConfig;
export type { AuthChangeEvent, AuthSession, AuthStatus, WorkastPublicOptions };

export class Workast {
  readonly attachments: Attachments;
  readonly calendar: CalendarResource;
  readonly fields: Fields;
  readonly lists: Lists;
  readonly meetings: MeetingsResource;
  readonly notes: NotesResource;
  readonly notifications: NotificationsResource;
  readonly reactions: Reactions;
  readonly searches: SearchesResource;
  readonly tags: Tags;
  readonly tasks: Tasks;
  readonly tokens: Tokens;
  readonly users: Users;
  readonly workflows: WorkflowsResource;

  private readonly apiKey?: string;
  private readonly token?: string;
  private readonly getTokenFn?: () => string | Promise<string>;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly timeout: number;
  private readonly dangerouslyAllowBrowser: boolean;
  private headers: Record<string, string>;
  private oauth?: PublicOAuth;

  constructor(options: string | WorkastOptions) {
    const opts: WorkastOptions = typeof options === 'string' ? { apiKey: options } : options;
    const passedApiKey = typeof options === 'string' || 'apiKey' in opts;
    this.dangerouslyAllowBrowser = typeof options !== 'string' && Boolean(opts.dangerouslyAllowBrowser);

    if (typeof window !== 'undefined' && passedApiKey && !this.dangerouslyAllowBrowser) {
      throw new Error(
        'apiKey cannot be used in a browser. Use Workast.public({ clientId }) on a page, or pass dangerouslyAllowBrowser: true.',
      );
    }

    if ('getToken' in opts) {
      this.getTokenFn = opts.getToken;
    } else if ('token' in opts) {
      this.token = opts.token;
    } else if ('apiKey' in opts) {
      this.apiKey = opts.apiKey;
    } else {
      throw new Error('Missing authentication. Provide apiKey, token, or getToken.');
    }

    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchFn = opts.fetch ?? globalThis.fetch.bind(globalThis);
    this.timeout = opts.timeout ?? DEFAULT_TIMEOUT_MS;
    this.headers = withoutAuthorization(opts.headers);
    this.attachments = new Attachments(this);
    this.calendar = new CalendarResource(this);
    this.fields = new Fields(this);
    this.lists = new Lists(this);
    this.meetings = new MeetingsResource(this);
    this.notes = new NotesResource(this);
    this.notifications = new NotificationsResource(this);
    this.reactions = new Reactions(this);
    this.searches = new SearchesResource(this);
    this.tags = new Tags(this);
    this.tasks = new Tasks(this);
    this.tokens = new Tokens(this);
    this.users = new Users(this);
    this.workflows = new WorkflowsResource(this);
  }

  static ['public'](options: WorkastPublicOptions): Workast {
    if (typeof window === 'undefined') {
      throw new Error('Workast.public can only be used in a browser');
    }
    const oauth = new PublicOAuth(options);
    const client = new Workast({
      getToken: () => oauth.resolveAuth(),
      baseUrl: options.baseUrl,
      fetch: options.fetch,
      headers: options.headers,
      timeout: options.timeout,
    });
    client.oauth = oauth;
    return client;
  }

  get auth(): { status: AuthStatus; session: AuthSession | null; error: string | null } {
    return {
      status: this.oauth?.status ?? 'unauthenticated',
      session: this.oauth?.session ?? null,
      error: this.oauth?.error ?? null,
    };
  }

  signIn(): Promise<void> {
    if (!this.oauth) {
      throw new Error('signIn() is only available on Workast.public clients');
    }
    return this.oauth.signIn();
  }

  signOut(): Promise<void> {
    if (!this.oauth) {
      throw new Error('signOut() is only available on Workast.public clients');
    }
    return this.oauth.signOut();
  }

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: AuthSession | null) => void,
  ): () => void {
    if (!this.oauth) {
      throw new Error('onAuthStateChange() is only available on Workast.public clients');
    }
    return this.oauth.onAuthStateChange(callback);
  }

  withHeaders(headers: Record<string, string>): Workast {
    const clone = new Workast({
      ...this.authOptions(),
      baseUrl: this.baseUrl,
      fetch: this.fetchFn,
      timeout: this.timeout,
      headers: { ...this.headers, ...withoutAuthorization(headers) },
      dangerouslyAllowBrowser: this.dangerouslyAllowBrowser,
    });
    clone.oauth = this.oauth;
    return clone;
  }

  setHeaders(headers: Record<string, string>): void {
    this.headers = { ...this.headers, ...withoutAuthorization(headers) };
  }

  request<T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request(this.context(), method, path, body, options);
  }

  private context() {
    const { oauth } = this;
    return {
      baseUrl: this.baseUrl,
      headers: this.headers,
      fetch: this.fetchFn,
      timeout: this.timeout,
      resolveAuth: () => this.resolveAuth(),
      onAuthenticationError: oauth
        ? () => oauth.handleAuthenticationError()
        : undefined,
    };
  }

  private authOptions(): WorkastAuth {
    if (this.getTokenFn) {
      return { getToken: this.getTokenFn };
    }
    if (this.token) {
      return { token: this.token };
    }
    if (this.apiKey) {
      return { apiKey: this.apiKey };
    }
    throw new Error('Missing authentication. Provide apiKey, token, or getToken.');
  }

  private async resolveAuth(): Promise<string> {
    const auth = this.authOptions();
    if ('getToken' in auth) {
      return auth.getToken();
    }
    if ('token' in auth) {
      return auth.token;
    }
    return auth.apiKey;
  }
}
