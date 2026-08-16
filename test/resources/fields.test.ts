import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  CustomField,
  CustomFieldCreate,
  CustomFieldPatch,
  CustomFieldSearchQuery,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from '../helpers.js';

const fieldId = 'field-1';
const createdField: CustomField = { id: fieldId, name: 'Priority', type: 'text' };
const listed: CustomField[] = [createdField];

describe('fields.list', () => {
  it('GETs /field with query and returns CustomField[]', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });
    const query: CustomFieldSearchQuery = { listId: 'list-1' };

    const result = await client.fields.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/field?listId=list-1`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toEqual(listed);
  });

  it('GETs /field without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });

    await client.fields.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/field`);
    expect(request.body).toBeUndefined();
  });

  it('types list as (query?: CustomFieldSearchQuery) => Promise<CustomField[]>', () => {
    const { client } = makeClient();
    expectTypeOf(client.fields.list).parameter(0).toEqualTypeOf<CustomFieldSearchQuery | undefined>();
    expectTypeOf(client.fields.list).returns.toEqualTypeOf<Promise<CustomField[]>>();
  });
});

describe('fields.create', () => {
  it('POSTs CustomFieldCreate to /field and returns CustomField', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(201, createdField) });
    const body: CustomFieldCreate = { name: 'Priority', type: 'text' };

    const field = await client.fields.create(body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/field`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    expect(field).toEqual(createdField);
  });

  it('types create as (body: CustomFieldCreate) => Promise<CustomField>', () => {
    const { client } = makeClient();
    expectTypeOf(client.fields.create).parameter(0).toEqualTypeOf<CustomFieldCreate>();
    expectTypeOf(client.fields.create).returns.toEqualTypeOf<Promise<CustomField>>();
  });
});

describe('fields.update', () => {
  it('PUTs CustomFieldPatch to /field/{fieldId} and returns CustomField', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdField) });
    const body: CustomFieldPatch = { name: 'Priority' };

    const field = await client.fields.update(fieldId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PUT');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/field/${fieldId}`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(field).toEqual(createdField);
  });

  it('types update as (fieldId: string, body: CustomFieldPatch) => Promise<CustomField>', () => {
    const { client } = makeClient();
    expectTypeOf(client.fields.update).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.fields.update).parameter(1).toEqualTypeOf<CustomFieldPatch>();
    expectTypeOf(client.fields.update).returns.toEqualTypeOf<Promise<CustomField>>();
  });
});

describe('fields.del', () => {
  it('DELETEs /field/{fieldId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.fields.del(fieldId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/field/${fieldId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toBeUndefined();
  });

  it('types del as (fieldId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.fields.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.fields.del).returns.toEqualTypeOf<Promise<void>>();
  });
});
