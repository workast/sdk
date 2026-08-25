import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type {
  Search,
  SearchCreate,
  SearchDetail,
  SearchFindQuery,
  SearchPatch,
  SearchReminderSet,
  SearchRetrieveQuery,
  SearchShare,
  Searches,
} from '../types/generated.js';

export class SearchesResource {
  constructor(private readonly client: Workast) {}

  /**
   * List searches for the logged-in user.
   * Requires one of: `search:find` (least privilege) or `search:manage`.
   *
   * @example
   * const results = await workast.searches.list({ home: true, limit: 10 });
   */
  list(query?: SearchFindQuery, options?: RequestOptions): Promise<Searches> {
    const params = new URLSearchParams(options?.query);
    if (query?.limit != null) {
      params.set('limit', String(query.limit));
    }
    if (query?.skip != null) {
      params.set('skip', String(query.skip));
    }
    if (query?.sort) {
      params.set('sort', query.sort);
    }
    if (query?.home != null) {
      params.set('home', String(query.home));
    }
    return this.client.request(
      'GET',
      '/search',
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Create a search.
   * Requires `search:manage`.
   *
   * @example
   * const search = await workast.searches.create({
   *   name: 'My tasks',
   *   payload: { predicates: [{ type: 'status', attribute: 'status', comparison: 'eq', value: 'pending' }] },
   * });
   */
  create(body: SearchCreate, options?: RequestOptions): Promise<Search> {
    return this.client.request('POST', '/search', body, options);
  }

  /**
   * Get a search by ID.
   * Requires one of: `search:find` (least privilege) or `search:manage`.
   *
   * @example
   * const search = await workast.searches.retrieve('search-id');
   */
  retrieve(
    searchId: string,
    query?: SearchRetrieveQuery,
    options?: RequestOptions,
  ): Promise<SearchDetail> {
    const params = new URLSearchParams(options?.query);
    if (query?.getTasks != null) {
      params.set('getTasks', String(query.getTasks));
    }
    if (query?.expand) {
      for (const value of query.expand) {
        params.append('expand', value);
      }
    }
    return this.client.request(
      'GET',
      `/search/${encodeURIComponent(searchId)}`,
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Update a search.
   * Requires `search:manage`.
   *
   * @example
   * const search = await workast.searches.update('search-id', { name: 'Updated' });
   */
  update(searchId: string, body: SearchPatch, options?: RequestOptions): Promise<Search> {
    return this.client.request(
      'PATCH',
      `/search/${encodeURIComponent(searchId)}`,
      body,
      options,
    );
  }

  /**
   * Delete a search.
   * Requires `search:manage`.
   *
   * @example
   * await workast.searches.del('search-id');
   */
  del(searchId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/search/${encodeURIComponent(searchId)}`,
      undefined,
      options,
    );
  }

  /**
   * Add a search to the home screen.
   * Requires `home:search:manage`.
   *
   * @example
   * await workast.searches.addHome('search-id');
   */
  addHome(searchId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/search/${encodeURIComponent(searchId)}/home`,
      undefined,
      options,
    );
  }

  /**
   * Remove a search from the home screen.
   * Requires `home:search:manage`.
   *
   * @example
   * await workast.searches.removeHome('search-id');
   */
  removeHome(searchId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/search/${encodeURIComponent(searchId)}/home`,
      undefined,
      options,
    );
  }

  /**
   * Share a search with users.
   * Requires `search:manage`.
   *
   * @example
   * await workast.searches.share('search-id', { users: ['user-id'] });
   */
  share(searchId: string, body: SearchShare, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/search/${encodeURIComponent(searchId)}/user`,
      body,
      options,
    );
  }

  /**
   * Unshare a search from users.
   * Requires `search:manage`.
   *
   * @example
   * await workast.searches.unshare('search-id', { users: ['user-id'] });
   */
  unshare(searchId: string, body: SearchShare, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/search/${encodeURIComponent(searchId)}/user`,
      body,
      options,
    );
  }

  /**
   * Set a reminder on a search.
   * Requires `search:manage`.
   *
   * @example
   * await workast.searches.setReminder('search-id', {
   *   repeat: { freq: 'weekly', byhour: 9, byminute: 0 },
   * });
   */
  setReminder(searchId: string, body: SearchReminderSet, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'PUT',
      `/search/${encodeURIComponent(searchId)}/reminder`,
      body,
      options,
    );
  }

  /**
   * Delete a reminder from a search.
   * Requires `search:manage`.
   *
   * @example
   * await workast.searches.delReminder('search-id');
   */
  delReminder(searchId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/search/${encodeURIComponent(searchId)}/reminder`,
      undefined,
      options,
    );
  }
}
