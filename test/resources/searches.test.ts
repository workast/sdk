import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  Search,
  SearchCreate,
  SearchDetail,
  SearchFindQuery,
  FindHomeSearchesQuery,
  SearchPatch,
  SearchReminderSet,
  SearchRetrieveQuery,
  SearchShare,
  Searches,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from '../helpers.js';

const searchId = 'search-1';
const payload = {
  predicates: [{ type: 'status' as const, attribute: 'status' as const, comparison: 'eq' as const, value: 'pending' }],
};
const createdSearch: Search = {
  id: searchId,
  name: 'My tasks',
  custom: true,
  payload,
};
const listed: Searches = { searches: [createdSearch], total: 1 };

describe('searches.list', () => {
  it('GETs /search with query and returns Searches', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });
    const query: SearchFindQuery = {
      limit: 10,
      skip: 5,
      sort: '-createdAt',
    };

    const results = await client.searches.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/search?limit=10&skip=5&sort=-createdAt`,
    );
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(results).toEqual(listed);
  });

  it('GETs /search without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });

    await client.searches.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search`);
    expect(request.body).toBeUndefined();
  });

  it('types list as (query?: SearchFindQuery) => Promise<Searches>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.list).parameter(0).toEqualTypeOf<SearchFindQuery | undefined>();
    expectTypeOf(client.searches.list).returns.toEqualTypeOf<Promise<Searches>>();
  });
});

describe('searches.create', () => {
  it('POSTs SearchCreate to /search and returns Search', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(201, createdSearch) });
    const body: SearchCreate = { name: 'My tasks', payload };

    const search = await client.searches.create(body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    expect(search).toEqual(createdSearch);
  });

  it('types create as (body: SearchCreate) => Promise<Search>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.create).parameter(0).toEqualTypeOf<SearchCreate>();
    expectTypeOf(client.searches.create).returns.toEqualTypeOf<Promise<Search>>();
  });
});

describe('searches.retrieve', () => {
  const detail: SearchDetail = { ...createdSearch, results: { tasks: [], total: 0, hiddenTasks: 0 } };

  it('GETs /search/{searchId} and returns SearchDetail', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdSearch) });

    const search = await client.searches.retrieve(searchId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search/${searchId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(search).toEqual(createdSearch);
  });

  it('GETs /search/{searchId} with query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, detail) });
    const query: SearchRetrieveQuery = { getTasks: 10, expand: ['listId', 'tags'] };

    const search = await client.searches.retrieve(searchId, query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/search/${searchId}?getTasks=10&expand=listId&expand=tags`,
    );
    expect(request.body).toBeUndefined();
    expect(search).toEqual(detail);
  });

  it('types retrieve as (searchId: string, query?: SearchRetrieveQuery) => Promise<SearchDetail>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.retrieve).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.searches.retrieve).parameter(1).toEqualTypeOf<SearchRetrieveQuery | undefined>();
    expectTypeOf(client.searches.retrieve).returns.toEqualTypeOf<Promise<SearchDetail>>();
  });
});

describe('searches.update', () => {
  it('PATCHes SearchPatch to /search/{searchId} and returns Search', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdSearch) });
    const body: SearchPatch = { name: 'Updated' };

    const search = await client.searches.update(searchId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search/${searchId}`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(search).toEqual(createdSearch);
  });

  it('types update as (searchId: string, body: SearchPatch) => Promise<Search>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.update).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.searches.update).parameter(1).toEqualTypeOf<SearchPatch>();
    expectTypeOf(client.searches.update).returns.toEqualTypeOf<Promise<Search>>();
  });
});

describe('searches.del', () => {
  it('DELETEs /search/{searchId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.searches.del(searchId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search/${searchId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toBeUndefined();
  });

  it('types del as (searchId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.searches.del).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('searches.listHome', () => {
  it('GETs /search/home with query and returns Searches', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });
    const query: FindHomeSearchesQuery = { limit: 10, skip: 5 };

    const results = await client.searches.listHome(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search/home?limit=10&skip=5`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(results).toEqual(listed);
  });

  it('GETs /search/home without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });

    await client.searches.listHome();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search/home`);
    expect(request.body).toBeUndefined();
  });

  it('types listHome as (query?: FindHomeSearchesQuery) => Promise<Searches>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.listHome).parameter(0).toEqualTypeOf<FindHomeSearchesQuery | undefined>();
    expectTypeOf(client.searches.listHome).returns.toEqualTypeOf<Promise<Searches>>();
  });
});

describe('searches.addHome', () => {
  it('POSTs /search/{searchId}/home', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.searches.addHome(searchId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search/${searchId}/home`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types addHome as (searchId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.addHome).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.searches.addHome).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('searches.removeHome', () => {
  it('DELETEs /search/{searchId}/home', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.searches.removeHome(searchId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search/${searchId}/home`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types removeHome as (searchId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.removeHome).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.searches.removeHome).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('searches.share', () => {
  const body: SearchShare = { users: ['user-1'] };

  it('POSTs SearchShare to /search/{searchId}/user', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.searches.share(searchId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search/${searchId}/user`);
    expect(request.body).toEqual(body);
    expect(result).toBeUndefined();
  });

  it('types share as (searchId: string, body: SearchShare) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.share).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.searches.share).parameter(1).toEqualTypeOf<SearchShare>();
    expectTypeOf(client.searches.share).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('searches.unshare', () => {
  const body: SearchShare = { users: ['user-1'] };

  it('DELETEs SearchShare on /search/{searchId}/user', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.searches.unshare(searchId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search/${searchId}/user`);
    expect(request.body).toEqual(body);
    expect(result).toBeUndefined();
  });

  it('types unshare as (searchId: string, body: SearchShare) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.unshare).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.searches.unshare).parameter(1).toEqualTypeOf<SearchShare>();
    expectTypeOf(client.searches.unshare).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('searches.setReminder', () => {
  const body: SearchReminderSet = {
    repeat: { freq: 'weekly', byhour: 9, byminute: 0, byweekday: [0] },
  };

  it('PUTs SearchReminderSet to /search/{searchId}/reminder', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.searches.setReminder(searchId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PUT');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search/${searchId}/reminder`);
    expect(request.body).toEqual(body);
    expect(result).toBeUndefined();
  });

  it('types setReminder as (searchId: string, body: SearchReminderSet) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.setReminder).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.searches.setReminder).parameter(1).toEqualTypeOf<SearchReminderSet>();
    expectTypeOf(client.searches.setReminder).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('searches.delReminder', () => {
  it('DELETEs /search/{searchId}/reminder', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.searches.delReminder(searchId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/search/${searchId}/reminder`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types delReminder as (searchId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.searches.delReminder).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.searches.delReminder).returns.toEqualTypeOf<Promise<void>>();
  });
});
