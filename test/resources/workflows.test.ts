import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  Workflow,
  WorkflowCreate,
  WorkflowDetail,
  WorkflowPatch,
  WorkflowSearchQuery,
  Workflows,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from '../helpers.js';

const workflowId = 'workflow-1';
const createdWorkflow: Workflow = {
  id: workflowId,
  trigger: { name: 'event', value: 'task_created' },
  prompt: 'Ship v3',
  lists: [{
    id: 'list-1',
    name: 'Engineering',
    status: 'active',
    privacy: 'private',
    link: 'https://open.workast.app/space/list-1',
  }],
  status: 'active',
};
const workflowDetail: WorkflowDetail = {
  ...createdWorkflow,
  runs: [{ id: 'run-1', createdAt: '2026-01-01T10:00:00.000Z' }],
  totalRuns: 1,
};
const listed: Workflows = { workflows: [createdWorkflow], total: 1 };

describe('workflows.list', () => {
  it('GETs /workflow with query and returns Workflows', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });
    const query: WorkflowSearchQuery = { limit: 10, skip: 5 };

    const result = await client.workflows.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/workflow?limit=10&skip=5`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toEqual(listed);
  });

  it('GETs /workflow without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });

    await client.workflows.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/workflow`);
    expect(request.body).toBeUndefined();
  });

  it('types list as (query?: WorkflowSearchQuery) => Promise<Workflows>', () => {
    const { client } = makeClient();
    expectTypeOf(client.workflows.list).parameter(0).toEqualTypeOf<WorkflowSearchQuery | undefined>();
    expectTypeOf(client.workflows.list).returns.toEqualTypeOf<Promise<Workflows>>();
  });
});

describe('workflows.create', () => {
  it('POSTs WorkflowCreate to /workflow and returns Workflow', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(201, createdWorkflow) });
    const body: WorkflowCreate = {
      type: 'event',
      trigger: 'task_created',
      prompt: 'Ship v3',
      lists: ['list-1'],
    };

    const workflow = await client.workflows.create(body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/workflow`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    expect(workflow).toEqual(createdWorkflow);
  });

  it('types create as (body: WorkflowCreate) => Promise<Workflow>', () => {
    const { client } = makeClient();
    expectTypeOf(client.workflows.create).parameter(0).toEqualTypeOf<WorkflowCreate>();
    expectTypeOf(client.workflows.create).returns.toEqualTypeOf<Promise<Workflow>>();
  });
});

describe('workflows.retrieve', () => {
  it('GETs /workflow/{workflowId} and returns WorkflowDetail', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, workflowDetail) });

    const workflow = await client.workflows.retrieve(workflowId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/workflow/${workflowId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(workflow).toEqual(workflowDetail);
  });

  it('types retrieve as (workflowId: string) => Promise<WorkflowDetail>', () => {
    const { client } = makeClient();
    expectTypeOf(client.workflows.retrieve).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.workflows.retrieve).returns.toEqualTypeOf<Promise<WorkflowDetail>>();
  });
});

describe('workflows.update', () => {
  it('PATCHes WorkflowPatch to /workflow/{workflowId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });
    const body: WorkflowPatch = { prompt: 'Ship v3' };

    const result = await client.workflows.update(workflowId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/workflow/${workflowId}`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toBeUndefined();
  });

  it('types update as (workflowId: string, body: WorkflowPatch) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.workflows.update).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.workflows.update).parameter(1).toEqualTypeOf<WorkflowPatch>();
    expectTypeOf(client.workflows.update).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('workflows.del', () => {
  it('DELETEs /workflow/{workflowId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.workflows.del(workflowId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/workflow/${workflowId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toBeUndefined();
  });

  it('types del as (workflowId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.workflows.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.workflows.del).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('workflows.activate', () => {
  it('PATCHes /workflow/{workflowId}/activate', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.workflows.activate(workflowId);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/workflow/${workflowId}/activate`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(result).toBeUndefined();
  });

  it('types activate as (workflowId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.workflows.activate).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.workflows.activate).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('workflows.deactivate', () => {
  it('PATCHes /workflow/{workflowId}/deactivate', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.workflows.deactivate(workflowId);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/workflow/${workflowId}/deactivate`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(result).toBeUndefined();
  });

  it('types deactivate as (workflowId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.workflows.deactivate).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.workflows.deactivate).returns.toEqualTypeOf<Promise<void>>();
  });
});
