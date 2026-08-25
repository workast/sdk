import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type {
  CustomFieldCreate,
  CustomFieldPatch,
  CustomFieldSearchQuery,
  CustomField,
} from '../types/generated.js';

export class Fields {
  constructor(private readonly client: Workast) {}

  /**
   * List custom fields in the team.
   * Requires one of: `field:find` (least privilege) or `field:manage`.
   *
   * @example
   * const fields = await workast.fields.list({ listId: 'list-id' });
   */
  list(query?: CustomFieldSearchQuery, options?: RequestOptions): Promise<CustomField[]> {
    const params = new URLSearchParams(options?.query);
    if (query?.listId) {
      params.set('listId', query.listId);
    }
    return this.client.request(
      'GET',
      '/field',
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Create a custom field.
   * Requires `field:manage`.
   *
   * @example
   * const field = await workast.fields.create({ name: 'Priority', type: 'text' });
   */
  create(body: CustomFieldCreate, options?: RequestOptions): Promise<CustomField> {
    return this.client.request('POST', '/field', body, options);
  }

  /**
   * Update a custom field.
   * Requires `field:manage`.
   *
   * @example
   * const field = await workast.fields.update('field-id', { name: 'Priority' });
   */
  update(fieldId: string, body: CustomFieldPatch, options?: RequestOptions): Promise<CustomField> {
    return this.client.request(
      'PUT',
      `/field/${encodeURIComponent(fieldId)}`,
      body,
      options,
    );
  }

  /**
   * Remove a custom field.
   * Requires `field:manage`.
   *
   * @example
   * await workast.fields.del('field-id');
   */
  del(fieldId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/field/${encodeURIComponent(fieldId)}`,
      undefined,
      options,
    );
  }
}
