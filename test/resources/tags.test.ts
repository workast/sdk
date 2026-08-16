import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  Tag,
  TagCreate,
  TagPatch,
  TagSearchQuery,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from '../helpers.js';

const tagId = 'tag-1';
const createdTag: Tag = { id: tagId, name: 'Priority', color: '#ff0000' };
const listed: Tag[] = [createdTag];

describe('tags.list', () => {
  it('GETs /tag with query and returns Tag[]', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });
    const query: TagSearchQuery = { listId: 'list-1', name: 'Priority' };

    const result = await client.tags.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/tag?listId=list-1&name=Priority`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toEqual(listed);
  });

  it('GETs /tag without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });

    await client.tags.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/tag`);
    expect(request.body).toBeUndefined();
  });

  it('types list as (query?: TagSearchQuery) => Promise<Tag[]>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tags.list).parameter(0).toEqualTypeOf<TagSearchQuery | undefined>();
    expectTypeOf(client.tags.list).returns.toEqualTypeOf<Promise<Tag[]>>();
  });
});

describe('tags.create', () => {
  it('POSTs TagCreate to /tag and returns Tag', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdTag) });
    const body: TagCreate = { name: 'Priority', color: '#ff0000' };

    const tag = await client.tags.create(body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/tag`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    expect(tag).toEqual(createdTag);
  });

  it('types create as (body: TagCreate) => Promise<Tag>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tags.create).parameter(0).toEqualTypeOf<TagCreate>();
    expectTypeOf(client.tags.create).returns.toEqualTypeOf<Promise<Tag>>();
  });
});

describe('tags.update', () => {
  it('PATCHes TagPatch to /tag/{tagId} and returns Tag', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdTag) });
    const body: TagPatch = { name: 'Priority' };

    const tag = await client.tags.update(tagId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/tag/${tagId}`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(tag).toEqual(createdTag);
  });

  it('types update as (tagId: string, body: TagPatch) => Promise<Tag>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tags.update).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tags.update).parameter(1).toEqualTypeOf<TagPatch>();
    expectTypeOf(client.tags.update).returns.toEqualTypeOf<Promise<Tag>>();
  });
});

describe('tags.del', () => {
  it('DELETEs /tag/{tagId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tags.del(tagId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/tag/${tagId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toBeUndefined();
  });

  it('types del as (tagId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tags.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tags.del).returns.toEqualTypeOf<Promise<void>>();
  });
});
