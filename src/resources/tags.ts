import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type { Tag, TagCreate, TagPatch, TagSearchQuery } from '../types/generated.js';

export class Tags {
  constructor(private readonly client: Workast) {}

  /**
   * List tags in the team.
   * Requires one of: `tag:find` (least privilege) or `tag:manage`.
   *
   * @example
   * const tags = await workast.tags.list({ listId: 'list-id' });
   */
  list(query?: TagSearchQuery, options?: RequestOptions): Promise<Tag[]> {
    const params = new URLSearchParams(options?.query);
    if (query?.listId) {
      params.set('listId', query.listId);
    }
    if (query?.name) {
      params.set('name', query.name);
    }
    return this.client.request(
      'GET',
      '/tag',
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Create a tag.
   * Requires `tag:manage`.
   *
   * @example
   * const tag = await workast.tags.create({ name: 'Priority', color: '#ff0000' });
   */
  create(body: TagCreate, options?: RequestOptions): Promise<Tag> {
    return this.client.request('POST', '/tag', body, options);
  }

  /**
   * Update a tag.
   * Requires `tag:manage`.
   *
   * @example
   * const tag = await workast.tags.update('tag-id', { name: 'Priority' });
   */
  update(tagId: string, body: TagPatch, options?: RequestOptions): Promise<Tag> {
    return this.client.request(
      'PATCH',
      `/tag/${encodeURIComponent(tagId)}`,
      body,
      options,
    );
  }

  /**
   * Delete a tag.
   * Requires `tag:manage`.
   *
   * @example
   * await workast.tags.del('tag-id');
   */
  del(tagId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/tag/${encodeURIComponent(tagId)}`,
      undefined,
      options,
    );
  }
}
