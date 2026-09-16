import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type {
  ImportTemplate,
  List,
  ListCreate,
  ListEnumerate,
  ListParticipants,
  ListPatch,
  ListSearchQuery,
  SubListCreate,
  SubListPatch,
  SubListSearchQuery,
  SubList,
  User,
} from '../types/generated.js';

class ListSublists {
  constructor(private readonly client: Workast) {}

  /**
   * List unique sublist names across lists.
   * Requires one of: `list:find` (least privilege) or `list:manage`.
   *
   * @example
   * const names = await workast.lists.sublists.list({ types: ['group'] });
   */
  list(query?: SubListSearchQuery, options?: RequestOptions): Promise<string[]> {
    const params = new URLSearchParams(options?.query);
    if (query?.onlyUserLists != null) {
      params.set('onlyUserLists', String(query.onlyUserLists));
    }
    if (query?.types) {
      for (const value of query.types) {
        params.append('types', value);
      }
    }
    return this.client.request(
      'GET',
      '/list/sublists',
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Create a sublist in a list.
   * Requires one of: `list:create` (least privilege) or `list:manage`.
   *
   * @example
   * const sublist = await workast.lists.sublists.create('list-id', { name: 'To-do' });
   */
  create(listId: string, body: SubListCreate, options?: RequestOptions): Promise<SubList> {
    return this.client.request(
      'POST',
      `/list/${encodeURIComponent(listId)}/sublist`,
      body,
      options,
    );
  }

  /**
   * Update a sublist.
   * Requires one of: `list:update` (least privilege) or `list:manage`.
   *
   * @example
   * await workast.lists.sublists.update('list-id', 'sublist-id', { name: 'Done' });
   */
  update(
    listId: string,
    subListId: string,
    body: SubListPatch,
    options?: RequestOptions,
  ): Promise<void> {
    return this.client.request(
      'PATCH',
      `/list/${encodeURIComponent(listId)}/sublist/${encodeURIComponent(subListId)}`,
      body,
      options,
    );
  }

  /**
   * Remove a sublist.
   * Requires one of: `list:update` (least privilege) or `list:manage`.
   *
   * @example
   * await workast.lists.sublists.del('list-id', 'sublist-id');
   */
  del(listId: string, subListId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/list/${encodeURIComponent(listId)}/sublist/${encodeURIComponent(subListId)}`,
      undefined,
      options,
    );
  }
}

class ListParticipantsResource {
  constructor(private readonly client: Workast) {}

  /**
   * List participants on a list.
   * Requires one of: `list:participant:find` (least privilege) or `list:manage`.
   *
   * @example
   * const users = await workast.lists.participants.list('list-id');
   */
  list(listId: string, options?: RequestOptions): Promise<User[]> {
    return this.client.request(
      'GET',
      `/list/${encodeURIComponent(listId)}/participant`,
      undefined,
      options,
    );
  }

  /**
   * Add participants to a list.
   * Requires one of: `list:participant:manage` (least privilege) or `list:manage`.
   *
   * @example
   * await workast.lists.participants.add('list-id', { users: ['user-id'] });
   */
  add(listId: string, body: ListParticipants, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/list/${encodeURIComponent(listId)}/participant`,
      body,
      options,
    );
  }

  /**
   * Remove participants from a list.
   * Requires one of: `list:participant:manage` (least privilege) or `list:manage`.
   *
   * @example
   * await workast.lists.participants.del('list-id', { users: ['user-id'] });
   */
  del(listId: string, body: ListParticipants, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/list/${encodeURIComponent(listId)}/participant`,
      body,
      options,
    );
  }
}

class ListFields {
  constructor(private readonly client: Workast) {}

  /**
   * Enable a custom field on a list.
   * Requires `field:manage`.
   *
   * @example
   * await workast.lists.fields.enable('list-id', 'field-id');
   */
  enable(listId: string, fieldId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/list/${encodeURIComponent(listId)}/field/${encodeURIComponent(fieldId)}`,
      undefined,
      options,
    );
  }

  /**
   * Disable a custom field on a list.
   * Requires `field:manage`.
   *
   * @example
   * await workast.lists.fields.disable('list-id', 'field-id');
   */
  disable(listId: string, fieldId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/list/${encodeURIComponent(listId)}/field/${encodeURIComponent(fieldId)}`,
      undefined,
      options,
    );
  }
}

export class Lists {
  readonly sublists: ListSublists;
  readonly participants: ListParticipantsResource;
  readonly fields: ListFields;

  constructor(private readonly client: Workast) {
    this.sublists = new ListSublists(client);
    this.participants = new ListParticipantsResource(client);
    this.fields = new ListFields(client);
  }

  /**
   * Create a list.
   * Requires one of: `list:create` (least privilege) or `list:manage`.
   *
   * @example
   * const list = await workast.lists.create({ name: 'Engineering', readme: '# Welcome' });
   */
  create(body: ListCreate, options?: RequestOptions): Promise<List> {
    return this.client.request('POST', '/list', body, options);
  }

  /**
   * Get a list by ID.
   * Requires one of: `list:find` (least privilege) or `list:manage`.
   *
   * @example
   * const list = await workast.lists.retrieve('list-id');
   */
  retrieve(listId: string, options?: RequestOptions): Promise<List> {
    return this.client.request('GET', `/list/${encodeURIComponent(listId)}`, undefined, options);
  }

  /**
   * Update a list.
   * Requires one of: `list:update` (least privilege) or `list:manage`.
   *
   * @example
   * await workast.lists.update('list-id', { name: 'Engineering' });
   */
  update(listId: string, body: ListPatch, options?: RequestOptions): Promise<void> {
    return this.client.request('PATCH', `/list/${encodeURIComponent(listId)}`, body, options);
  }

  /**
   * Search lists.
   * Requires one of: `list:find` (least privilege) or `list:manage`.
   *
   * @example
   * const lists = await workast.lists.list({ type: 'group', limit: 10 });
   */
  list(query?: ListSearchQuery, options?: RequestOptions): Promise<ListEnumerate[]> {
    const params = new URLSearchParams(options?.query);
    if (query?.onlyUserLists != null) {
      params.set('onlyUserLists', String(query.onlyUserLists));
    }
    if (query?.statusIs) {
      params.set('statusIs', query.statusIs);
    }
    if (query?.includeTemplates != null) {
      params.set('includeTemplates', String(query.includeTemplates));
    }
    if (query?.type) {
      params.set('type', query.type);
    }
    if (query?.channelId) {
      params.set('channelId', query.channelId);
    }
    if (query?.participants) {
      for (const value of query.participants) {
        params.append('participants', value);
      }
    }
    if (query?.name) {
      params.set('name', query.name);
    }
    if (query?.limit != null) {
      params.set('limit', String(query.limit));
    }
    if (query?.skip != null) {
      params.set('skip', String(query.skip));
    }
    if (query?.sort) {
      params.set('sort', query.sort);
    }
    return this.client.request(
      'GET',
      '/list',
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Get the personal list.
   * Requires one of: `list:find` (least privilege) or `list:manage`.
   *
   * @example
   * const list = await workast.lists.retrievePersonal();
   */
  retrievePersonal(options?: RequestOptions): Promise<List> {
    return this.client.request('GET', '/list/personal', undefined, options);
  }

  /**
   * Archive a list.
   * Requires `list:manage`.
   *
   * @example
   * await workast.lists.archive('list-id');
   */
  archive(listId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/list/${encodeURIComponent(listId)}/archive`,
      undefined,
      options,
    );
  }

  /**
   * Unarchive a list.
   * Requires `list:manage`.
   *
   * @example
   * await workast.lists.unarchive('list-id');
   */
  unarchive(listId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/list/${encodeURIComponent(listId)}/unarchive`,
      undefined,
      options,
    );
  }

  /**
   * Join a list.
   * Requires `list:join`.
   *
   * @example
   * await workast.lists.join('list-id');
   */
  join(listId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/list/${encodeURIComponent(listId)}/participant/join`,
      undefined,
      options,
    );
  }

  /**
   * Request access to a private list.
   * Requires `list:join`.
   *
   * @example
   * await workast.lists.requestAccess('list-id');
   */
  requestAccess(listId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/list/${encodeURIComponent(listId)}/participant/request`,
      undefined,
      options,
    );
  }

  /**
   * Import a template into a list.
   * Requires one of: `task:create` (least privilege) or `task:manage`.
   *
   * @example
   * await workast.lists.importTemplate('list-id', 'template-id', { updateDueDates: 30 });
   */
  importTemplate(
    listId: string,
    templateId: string,
    body: ImportTemplate,
    options?: RequestOptions,
  ): Promise<void> {
    return this.client.request(
      'POST',
      `/list/${encodeURIComponent(listId)}/import/${encodeURIComponent(templateId)}`,
      body,
      options,
    );
  }
}
