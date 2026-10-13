import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type { FormCreate, FormCreated, FormPage, FormSearchQuery } from '../types/generated.js';

export class FormsResource {
  constructor(private readonly client: Workast) {}

  /**
   * Create a draft form in a list.
   * Requires `form:manage`.
   *
   * @example
   * const form = await workast.forms.create('list-id', { title: 'Time off' });
   */
  create(listId: string, body: FormCreate, options?: RequestOptions): Promise<FormCreated> {
    return this.client.request('POST', `/list/${encodeURIComponent(listId)}/form`, body, options);
  }

  /**
   * List forms.
   * Requires one of: `form:find` (least privilege) or `form:manage`.
   *
   * @example
   * const page = await workast.forms.list({ status: ['live'], limit: 10 });
   */
  list(query?: FormSearchQuery, options?: RequestOptions): Promise<FormPage> {
    const params = new URLSearchParams(options?.query);
    if (query?.limit != null) {
      params.set('limit', String(query.limit));
    }
    if (query?.page != null) {
      params.set('page', String(query.page));
    }
    if (query?.status) {
      for (const value of query.status) {
        params.append('status', value);
      }
    }
    if (query?.listId) {
      params.set('listId', query.listId);
    }
    return this.client.request(
      'GET',
      '/form',
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }
}
