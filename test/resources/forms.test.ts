import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  AuthenticationError,
  NotFoundError,
  PermissionError,
  ValidationError,
  type FormCreate,
  type FormCreated,
  type FormPage,
  type FormSearchQuery,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, jsonResponse, makeClient, mockFetch } from '../helpers.js';

const created: FormCreated = {
  id: '6ab5d4eff38d6d8ec1a7bb84',
  link: 'https://acme.workast.com/form/6ab5d4eff38d6d8ec1a7bb84',
  status: 'draft',
  space: '5a6ebde81519395731f90e2f',
  privacy: 'public',
  JSONSchema: {
    title: 'Time off',
    description: 'Request time off',
  },
};

const page: FormPage = {
  docs: [
    {
      id: '6ab5d4eff38d6d8ec1a7bb84',
      link: 'https://acme.workast.com/form/6ab5d4eff38d6d8ec1a7bb84',
      status: 'live',
      privacy: 'public',
      title: 'Time off',
      description: 'Request time off',
      canSubmit: true,
      canEdit: false,
      list: {
        id: '5bb278ec281cd3003a163399',
        name: 'People Ops',
        type: 'group',
        status: 'active',
        privacy: 'public',
        link: 'https://acme.workast.com/space/5bb278ec281cd3003a163399',
      },
    },
  ],
  totalDocs: 1,
  page: 1,
  totalPages: 1,
};

describe('forms.create', () => {
  it('POSTs FormCreate to /list/{listId}/form and returns FormCreated', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(201, created) });
    const body: FormCreate = {
      title: 'Time off',
      description: 'Request time off',
      privacy: 'public',
      fields: [
        { label: 'Reason', type: 'text', required: true, placeholder: 'Why' },
        { label: 'Type', type: 'select', options: ['Vacation', 'Sick'], required: true },
      ],
      assignTasksTo: ['b2956627fe26a2c1e4b6d5202413f779'],
      tasksDeadline: 24,
      taskSummary: 'Form request: #title#',
      headerImage: 'https://example.com/h.png',
      confirmationText: 'Thanks',
      buttonLabel: 'Send',
      buttonColor: '#336699',
    };

    const form = await client.forms.create('list-1', body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/list-1/form`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    expect(form).toEqual(created);
  });

  it('encodes the list id', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(201, created) });

    await client.forms.create('list/weird', { title: 'Time off' });

    expect(getRequest(fetch).url).toBe(`${DEFAULT_BASE_URL}/list/list%2Fweird/form`);
  });

  it('accepts a title-only body', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(201, created) });
    const body: FormCreate = { title: 'Time off' };

    await client.forms.create('list-1', body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/list-1/form`);
    expect(request.body).toEqual({ title: 'Time off' });
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
  });

  it('types create as (listId: string, body: FormCreate) => Promise<FormCreated>', () => {
    const { client } = makeClient();
    expectTypeOf(client.forms.create).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.forms.create).parameter(1).toEqualTypeOf<FormCreate>();
    expectTypeOf(client.forms.create).returns.toEqualTypeOf<Promise<FormCreated>>();
  });

  it('types title as required and description as optional', () => {
    expectTypeOf<FormCreate['title']>().toEqualTypeOf<string>();
    expectTypeOf<FormCreate['description']>().toEqualTypeOf<string | undefined>();
  });

  it('throws ValidationError on 400', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(400, {
      error: 'Bad request.',
      message: 'title is required',
    }));
    const { client } = makeClient({ fetch });
    await expect(client.forms.create('list-1', { title: 'Time off' }))
      .rejects
      .toBeInstanceOf(ValidationError);
  });

  it('throws AuthenticationError on 401', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(401, {
      error: { name: 'UserUnauthorizedError', message: 'User unauthorized' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.forms.create('list-1', { title: 'Time off' }))
      .rejects
      .toBeInstanceOf(AuthenticationError);
  });

  it('throws PermissionError on 403', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(403, {
      error: { name: 'SpaceAccessDeniedError', message: 'Access to this space is forbidden' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.forms.create('list-1', { title: 'Time off' }))
      .rejects
      .toBeInstanceOf(PermissionError);
  });

  it('throws NotFoundError on 404', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(404, {
      error: { name: 'NotFoundError', message: 'List not found' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.forms.create('missing', { title: 'Time off' }))
      .rejects
      .toBeInstanceOf(NotFoundError);
  });
});

describe('forms.list', () => {
  it('GETs /form with query and returns FormPage', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, page) });
    const query: FormSearchQuery = {
      limit: 10,
      page: 2,
      status: ['draft', 'live'],
      listId: '5a6ebde81519395731f90e2f',
    };

    const result = await client.forms.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/form?limit=10&page=2&status=draft&status=live&listId=5a6ebde81519395731f90e2f`,
    );
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toEqual(page);
  });

  it('GETs /form without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, page) });

    await client.forms.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/form`);
    expect(request.body).toBeUndefined();
  });

  it('types list as (query?: FormSearchQuery) => Promise<FormPage>', () => {
    const { client } = makeClient();
    expectTypeOf(client.forms.list).parameter(0).toEqualTypeOf<FormSearchQuery | undefined>();
    expectTypeOf(client.forms.list).returns.toEqualTypeOf<Promise<FormPage>>();
  });

  it('throws ValidationError on 400', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(400, {
      error: 'Bad request.',
      message: 'listId is invalid',
    }));
    const { client } = makeClient({ fetch });
    await expect(client.forms.list({ listId: 'not-hex' }))
      .rejects
      .toBeInstanceOf(ValidationError);
  });

  it('throws AuthenticationError on 401', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(401, {
      error: { name: 'UserUnauthorizedError', message: 'User unauthorized' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.forms.list())
      .rejects
      .toBeInstanceOf(AuthenticationError);
  });

  it('throws PermissionError on 403', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(403, {
      error: { name: 'SpaceAccessDeniedError', message: 'Access to this space is forbidden' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.forms.list())
      .rejects
      .toBeInstanceOf(PermissionError);
  });
});
