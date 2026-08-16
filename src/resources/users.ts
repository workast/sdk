import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type {
  Team,
  UserByEmailQuery,
  UserDetail,
  UserInvite,
  UserResource,
  UserSearchQuery,
} from '../types/generated.js';

function appendValues(
  params: URLSearchParams,
  key: string,
  value: string | string[] | undefined,
): void {
  if (value == null) {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      params.append(key, item);
    }
    return;
  }
  params.set(key, value);
}

export class Users {
  constructor(private readonly client: Workast) {}

  /**
   * Get the logged-in user.
   *
   * @example
   * const me = await workast.users.me();
   */
  me(options?: RequestOptions): Promise<UserResource> {
    return this.client.request('GET', '/user/me', undefined, options);
  }

  /**
   * List users in the team.
   *
   * @example
   * const users = await workast.users.list({ name: 'Ada', limit: 10 });
   */
  list(query?: UserSearchQuery, options?: RequestOptions): Promise<UserDetail[]> {
    const params = new URLSearchParams(options?.query);
    if (query?.name) {
      params.set('name', query.name);
    }
    if (query?.email) {
      params.set('email', query.email);
    }
    appendValues(params, 'slackUserId', query?.slackUserId);
    appendValues(params, 'webexUserId', query?.webexUserId);
    if (query?.random != null) {
      params.set('random', String(query.random));
    }
    appendValues(params, 'status', query?.status);
    appendValues(params, 'role', query?.role);
    if (query?.sort) {
      params.set('sort', query.sort);
    }
    if (query?.limit != null) {
      params.set('limit', String(query.limit));
    }
    if (query?.offset != null) {
      params.set('offset', String(query.offset));
    }
    return this.client.request(
      'GET',
      '/user',
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Get a user by ID.
   *
   * @example
   * const user = await workast.users.retrieve('user-id');
   */
  retrieve(userId: string, options?: RequestOptions): Promise<UserDetail> {
    return this.client.request('GET', `/user/${encodeURIComponent(userId)}`, undefined, options);
  }

  /**
   * Get a user by email.
   *
   * @example
   * const user = await workast.users.retrieveByEmail('ada@example.com');
   */
  retrieveByEmail(
    email: string,
    query?: UserByEmailQuery,
    options?: RequestOptions,
  ): Promise<UserDetail & { team?: Team }> {
    const params = new URLSearchParams(options?.query);
    if (query?.platform) {
      params.set('platform', query.platform);
    }
    return this.client.request(
      'GET',
      `/user/email/${encodeURIComponent(email)}`,
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Invite a user to the team.
   *
   * @example
   * const user = await workast.users.invite({ name: 'Ada', email: 'ada@example.com', role: 'member' });
   */
  invite(body: UserInvite, options?: RequestOptions): Promise<UserDetail> {
    return this.client.request('POST', '/user/invite', body, options);
  }
}
