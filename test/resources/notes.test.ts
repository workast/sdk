import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  Note,
  NoteDetail,
  NotePatch,
  NoteSearchQuery,
  Notes,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from '../helpers.js';

const noteId = 'note-1';
const createdNote: Note = { id: noteId, title: 'Spec', version: 1 };
const noteDetail: NoteDetail = { ...createdNote, body: '<p>Hello</p>' };
const listed: Notes = { total: 1, notes: [createdNote] };

describe('notes.list', () => {
  it('GETs /note with query and returns Notes', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });
    const query: NoteSearchQuery = {
      showDeleted: true,
      lists: ['list-1', 'list-2'],
      title: 'Spec',
      owners: ['user-1'],
      sort: '-updatedAt',
      limit: 10,
      skip: 5,
    };

    const result = await client.notes.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/note?showDeleted=true&lists=list-1&lists=list-2&title=Spec&owners=user-1&sort=-updatedAt&limit=10&skip=5`,
    );
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toEqual(listed);
  });

  it('GETs /note without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });

    await client.notes.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/note`);
    expect(request.body).toBeUndefined();
  });

  it('types list as (query?: NoteSearchQuery) => Promise<Notes>', () => {
    const { client } = makeClient();
    expectTypeOf(client.notes.list).parameter(0).toEqualTypeOf<NoteSearchQuery | undefined>();
    expectTypeOf(client.notes.list).returns.toEqualTypeOf<Promise<Notes>>();
  });
});

describe('notes.retrieve', () => {
  it('GETs /note/{noteId} and returns NoteDetail', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, noteDetail) });

    const note = await client.notes.retrieve(noteId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/note/${noteId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(note).toEqual(noteDetail);
  });

  it('types retrieve as (noteId: string) => Promise<NoteDetail>', () => {
    const { client } = makeClient();
    expectTypeOf(client.notes.retrieve).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.notes.retrieve).returns.toEqualTypeOf<Promise<NoteDetail>>();
  });
});

describe('notes.update', () => {
  it('PATCHes NotePatch to /note/{noteId} and returns Note', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdNote) });
    const body: NotePatch = { title: 'Spec', version: 1, body: '<p>Hello</p>' };

    const note = await client.notes.update(noteId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/note/${noteId}`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(note).toEqual(createdNote);
  });

  it('types update as (noteId: string, body: NotePatch) => Promise<Note>', () => {
    const { client } = makeClient();
    expectTypeOf(client.notes.update).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.notes.update).parameter(1).toEqualTypeOf<NotePatch>();
    expectTypeOf(client.notes.update).returns.toEqualTypeOf<Promise<Note>>();
  });
});

describe('notes.del', () => {
  it('DELETEs /note/{noteId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.notes.del(noteId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/note/${noteId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toBeUndefined();
  });

  it('types del as (noteId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.notes.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.notes.del).returns.toEqualTypeOf<Promise<void>>();
  });
});
