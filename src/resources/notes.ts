import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type { Note, NoteCreate, NoteDetail, NotePatch, NoteSearchQuery, Notes } from '../types/generated.js';

export class NotesResource {
  constructor(private readonly client: Workast) {}

  /**
   * Create a note in a list.
   * Requires one of: `note:create` (least privilege) or `note:manage`.
   *
   * @example
   * const note = await workast.notes.create('list-id', {
   *   title: 'Action Items',
   *   summary: '',
   *   content: '# Ship v3',
   * });
   */
  create(listId: string, body: NoteCreate, options?: RequestOptions): Promise<NoteDetail> {
    return this.client.request('POST', `/list/${encodeURIComponent(listId)}/note`, body, options);
  }

  /**
   * List notes.
   * Requires one of: `note:find` (least privilege) or `note:manage`.
   *
   * @example
   * const results = await workast.notes.list({ title: 'Spec', limit: 10 });
   */
  list(query?: NoteSearchQuery, options?: RequestOptions): Promise<Notes> {
    const params = new URLSearchParams(options?.query);
    if (query?.showDeleted != null) {
      params.set('showDeleted', String(query.showDeleted));
    }
    if (query?.lists) {
      for (const value of query.lists) {
        params.append('lists', value);
      }
    }
    if (query?.title) {
      params.set('title', query.title);
    }
    if (query?.owners) {
      for (const value of query.owners) {
        params.append('owners', value);
      }
    }
    if (query?.sort) {
      params.set('sort', query.sort);
    }
    if (query?.limit != null) {
      params.set('limit', String(query.limit));
    }
    if (query?.skip != null) {
      params.set('skip', String(query.skip));
    }
    return this.client.request(
      'GET',
      '/note',
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Get a note by ID.
   * Requires one of: `note:find` (least privilege) or `note:manage`.
   *
   * @example
   * const note = await workast.notes.retrieve('note-id');
   */
  retrieve(noteId: string, options?: RequestOptions): Promise<NoteDetail> {
    return this.client.request('GET', `/note/${encodeURIComponent(noteId)}`, undefined, options);
  }

  /**
   * Update a note.
   * Requires one of: `note:update` (least privilege) or `note:manage`.
   *
   * @example
   * const note = await workast.notes.update('note-id', { title: 'Spec', content: '# Hello' });
   */
  update(noteId: string, body: NotePatch, options?: RequestOptions): Promise<Note> {
    return this.client.request('PATCH', `/note/${encodeURIComponent(noteId)}`, body, options);
  }

  /**
   * Delete a note.
   * Requires `note:manage`.
   *
   * @example
   * await workast.notes.del('note-id');
   */
  del(noteId: string, options?: RequestOptions): Promise<void> {
    return this.client.request('DELETE', `/note/${encodeURIComponent(noteId)}`, undefined, options);
  }
}
