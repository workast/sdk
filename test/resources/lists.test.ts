import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  ImportTemplate,
  List,
  ListCreate,
  ListEnumerate,
  ListParticipants,
  ListPatch,
  ListSearchQuery,
  SubList,
  SubListCreate,
  SubListPatch,
  SubListSearchQuery,
  User,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from '../helpers.js';

const listId = 'list-1';
const createdList: List = { id: listId, name: 'Engineering' };
const enumerated: ListEnumerate[] = [{ id: listId, name: 'Engineering' }];

describe('lists.create', () => {
  it('POSTs ListCreate to /list and returns List', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdList) });
    const body: ListCreate = { name: 'Engineering' };

    const list = await client.lists.create(body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    expect(list).toEqual(createdList);
  });

  it('types create as (body: ListCreate) => Promise<List>', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.create).parameter(0).toEqualTypeOf<ListCreate>();
    expectTypeOf(client.lists.create).returns.toEqualTypeOf<Promise<List>>();
  });
});

describe('lists.retrieve', () => {
  it('GETs /list/{listId} and returns List', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdList) });

    const list = await client.lists.retrieve(listId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(list).toEqual(createdList);
  });

  it('types retrieve as (listId: string) => Promise<List>', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.retrieve).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.retrieve).returns.toEqualTypeOf<Promise<List>>();
  });
});

describe('lists.update', () => {
  it('PATCHes ListPatch to /list/{listId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });
    const body: ListPatch = { name: 'Engineering' };

    const result = await client.lists.update(listId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toBeUndefined();
  });

  it('types update as (listId: string, body: ListPatch) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.update).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.update).parameter(1).toEqualTypeOf<ListPatch>();
    expectTypeOf(client.lists.update).returns.toEqualTypeOf<Promise<void>>();
  });

  it('sends readme plus version', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });
    const body: ListPatch = { readme: '# Welcome', version: 2 };

    await client.lists.update('list-1', body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/list-1`);
    expect(request.body).toEqual({ readme: '# Welcome', version: 2 });
  });

  it('types version as number | undefined', () => {
    expectTypeOf<List['version']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<ListPatch['version']>().toEqualTypeOf<number | undefined>();
    const list: List = { id: 'list-1', name: 'Engineering', readme: '# Welcome', version: 2 };
    expectTypeOf(list).toEqualTypeOf<List>();
  });
});

describe('lists.list', () => {
  it('GETs /list with query and returns ListEnumerate[]', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, enumerated) });
    const query: ListSearchQuery = {
      onlyUserLists: true,
      statusIs: 'active',
      includeTemplates: false,
      type: 'group',
      channelId: 'C123',
      participants: ['user-1', 'user-2'],
      name: 'Eng',
      limit: 10,
      skip: 5,
      sort: '-createdAt',
    };

    const results = await client.lists.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/list?onlyUserLists=true&statusIs=active&includeTemplates=false&type=group&channelId=C123&participants=user-1&participants=user-2&name=Eng&limit=10&skip=5&sort=-createdAt`,
    );
    expect(request.body).toBeUndefined();
    expect(results).toEqual(enumerated);
  });

  it('GETs /list without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, enumerated) });

    await client.lists.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list`);
    expect(request.body).toBeUndefined();
  });

  it('types list as (query?: ListSearchQuery) => Promise<ListEnumerate[]>', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.list).parameter(0).toEqualTypeOf<ListSearchQuery | undefined>();
    expectTypeOf(client.lists.list).returns.toEqualTypeOf<Promise<ListEnumerate[]>>();
  });
});

describe('lists.retrievePersonal', () => {
  it('GETs /list/personal and returns List', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdList) });

    const list = await client.lists.retrievePersonal();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/personal`);
    expect(request.body).toBeUndefined();
    expect(list).toEqual(createdList);
  });

  it('types retrievePersonal as () => Promise<List>', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.retrievePersonal).returns.toEqualTypeOf<Promise<List>>();
  });
});

describe('lists.archive', () => {
  it('POSTs /list/{listId}/archive', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.lists.archive(listId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/archive`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types archive as (listId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.archive).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.archive).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('lists.unarchive', () => {
  it('POSTs /list/{listId}/unarchive', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.lists.unarchive(listId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/unarchive`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types unarchive as (listId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.unarchive).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.unarchive).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('lists.join', () => {
  it('POSTs /list/{listId}/participant/join', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(new Response(null, { status: 201 }));
    const { client } = makeClient({ fetch });

    const result = await client.lists.join(listId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/participant/join`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types join as (listId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.join).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.join).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('lists.requestAccess', () => {
  it('POSTs /list/{listId}/participant/request', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.lists.requestAccess(listId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/participant/request`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types requestAccess as (listId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.requestAccess).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.requestAccess).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('lists.importTemplate', () => {
  it('POSTs ImportTemplate to /list/{listId}/import/{templateId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });
    const templateId = 'template-1';
    const body: ImportTemplate = { updateDueDates: 30 };

    const result = await client.lists.importTemplate(listId, templateId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/import/${templateId}`);
    expect(request.body).toEqual(body);
    expect(result).toBeUndefined();
  });

  it('types importTemplate as (listId: string, templateId: string, body: ImportTemplate) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.importTemplate).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.importTemplate).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.lists.importTemplate).parameter(2).toEqualTypeOf<ImportTemplate>();
    expectTypeOf(client.lists.importTemplate).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('lists.sublists', () => {
  const subListId = 'sub-1';
  const subList: SubList = { id: subListId, name: 'To-do' };
  const names = ['Backlog', 'To-do'];

  it('GETs /list/sublists with query and returns string[]', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, names) });
    const query: SubListSearchQuery = { onlyUserLists: true, types: ['group', 'personal'] };

    const result = await client.lists.sublists.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/list/sublists?onlyUserLists=true&types=group&types=personal`,
    );
    expect(request.body).toBeUndefined();
    expect(result).toEqual(names);
  });

  it('GETs /list/sublists without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, names) });

    await client.lists.sublists.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/sublists`);
    expect(request.body).toBeUndefined();
  });

  it('POSTs SubListCreate to /list/{listId}/sublist and returns SubList', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, subList) });
    const body: SubListCreate = { name: 'To-do' };

    const result = await client.lists.sublists.create(listId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/sublist`);
    expect(request.body).toEqual(body);
    expect(result).toEqual(subList);
  });

  it('PATCHes SubListPatch to /list/{listId}/sublist/{subListId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });
    const body: SubListPatch = { name: 'Done' };

    const result = await client.lists.sublists.update(listId, subListId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/sublist/${subListId}`);
    expect(request.body).toEqual(body);
    expect(result).toBeUndefined();
  });

  it('DELETEs /list/{listId}/sublist/{subListId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.lists.sublists.del(listId, subListId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/sublist/${subListId}`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types sublists.list, create, update, and del', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.sublists.list).parameter(0).toEqualTypeOf<SubListSearchQuery | undefined>();
    expectTypeOf(client.lists.sublists.list).returns.toEqualTypeOf<Promise<string[]>>();
    expectTypeOf(client.lists.sublists.create).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.sublists.create).parameter(1).toEqualTypeOf<SubListCreate>();
    expectTypeOf(client.lists.sublists.create).returns.toEqualTypeOf<Promise<SubList>>();
    expectTypeOf(client.lists.sublists.update).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.sublists.update).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.lists.sublists.update).parameter(2).toEqualTypeOf<SubListPatch>();
    expectTypeOf(client.lists.sublists.update).returns.toEqualTypeOf<Promise<void>>();
    expectTypeOf(client.lists.sublists.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.sublists.del).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.lists.sublists.del).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('lists.participants', () => {
  const users: User[] = [{ id: 'user-1' }];
  const body: ListParticipants = { users: ['user-1'] };

  it('GETs /list/{listId}/participant and returns User[]', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, users) });

    const result = await client.lists.participants.list(listId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/participant`);
    expect(request.body).toBeUndefined();
    expect(result).toEqual(users);
  });

  it('POSTs ListParticipants to /list/{listId}/participant', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.lists.participants.add(listId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/participant`);
    expect(request.body).toEqual(body);
    expect(result).toBeUndefined();
  });

  it('DELETEs ListParticipants on /list/{listId}/participant', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.lists.participants.del(listId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/participant`);
    expect(request.body).toEqual(body);
    expect(result).toBeUndefined();
  });

  it('types participants.list, add, and del', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.participants.list).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.participants.list).returns.toEqualTypeOf<Promise<User[]>>();
    expectTypeOf(client.lists.participants.add).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.participants.add).parameter(1).toEqualTypeOf<ListParticipants>();
    expectTypeOf(client.lists.participants.add).returns.toEqualTypeOf<Promise<void>>();
    expectTypeOf(client.lists.participants.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.participants.del).parameter(1).toEqualTypeOf<ListParticipants>();
    expectTypeOf(client.lists.participants.del).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('lists.fields', () => {
  const fieldId = 'field-1';

  it('POSTs /list/{listId}/field/{fieldId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.lists.fields.enable(listId, fieldId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/field/${fieldId}`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('DELETEs /list/{listId}/field/{fieldId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.lists.fields.disable(listId, fieldId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/field/${fieldId}`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types fields.enable and disable', () => {
    const { client } = makeClient();
    expectTypeOf(client.lists.fields.enable).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.fields.enable).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.lists.fields.enable).returns.toEqualTypeOf<Promise<void>>();
    expectTypeOf(client.lists.fields.disable).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.lists.fields.disable).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.lists.fields.disable).returns.toEqualTypeOf<Promise<void>>();
  });
});
