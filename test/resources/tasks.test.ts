import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  AuthenticationError,
  NotFoundError,
  PermissionError,
  ValidationError,
  type ActivityBody,
  type Attachment,
  type CommentActivity,
  type ConvertToSubtask,
  type HomeTasks,
  type NewAttachment,
  type SearchResults,
  type SubtaskCreate,
  type Task,
  type TaskActivities,
  type TaskActivityBody,
  type TaskActivitySearchQuery,
  type TaskAssignment,
  type TaskBulkCreate,
  type TaskBulkUpdate,
  type TaskBulkUpdateResult,
  type TaskCreate,
  type TaskFollow,
  type TaskMove,
  type TaskPatch,
  type TaskSearch,
  type TaskTag,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, createdTask, getRequest, jsonResponse, makeClient, mockFetch } from '../helpers.js';

describe('tasks.create', () => {
  it('POSTs TaskCreate to /list/{listId}/task and returns Task', async () => {
    const { client, fetch } = makeClient();
    const listId = 'list-1';
    const body: TaskCreate = { text: 'Ship v3' };

    const task = await client.tasks.create(listId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/task`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    expect(task).toEqual(createdTask);
  });

  it('uses a custom baseUrl', async () => {
    const { client, fetch } = makeClient({ baseUrl: 'https://api.example.test' });
    await client.tasks.create('abc', { text: 'Hi' });
    expect(getRequest(fetch).url).toBe('https://api.example.test/list/abc/task');
  });

  it('types create as (listId: string, body: TaskCreate) => Promise<Task>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.create).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.create).parameter(1).toEqualTypeOf<TaskCreate>();
    expectTypeOf(client.tasks.create).returns.toEqualTypeOf<Promise<Task>>();
  });

  it('throws AuthenticationError on 401', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(401, {
      error: { name: 'UserUnauthorizedError', message: 'User unauthorized' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.tasks.create('list-1', { text: 'Hi' }))
      .rejects
      .toBeInstanceOf(AuthenticationError);
  });

  it('throws NotFoundError on 404', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(404, {
      error: { name: 'TaskNotFoundError', message: 'The task does not exist' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.tasks.create('missing', { text: 'Hi' }))
      .rejects
      .toBeInstanceOf(NotFoundError);
  });

  it('throws ValidationError on 400', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(400, {
      error: 'Bad request.',
      message: 'text is required',
    }));
    const { client } = makeClient({ fetch });
    await expect(client.tasks.create('list-1', { text: 'Hi' }))
      .rejects
      .toBeInstanceOf(ValidationError);
  });

  it('throws PermissionError on 403', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(403, {
      error: { name: 'SpaceAccessDeniedError', message: 'Access to this space is forbidden' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.tasks.create('list-1', { text: 'Hi' }))
      .rejects
      .toBeInstanceOf(PermissionError);
  });
});

describe('tasks.retrieve', () => {
  it('GETs /task/{taskId} and returns Task', async () => {
    const fetch = mockFetch(200, createdTask);
    const { client } = makeClient({ fetch });
    const taskId = 'task-1';

    const task = await client.tasks.retrieve(taskId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(task).toEqual(createdTask);
  });

  it('types retrieve as (taskId: string) => Promise<Task>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.retrieve).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.retrieve).returns.toEqualTypeOf<Promise<Task>>();
  });

  it('throws NotFoundError on 404', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(404, {
      error: { name: 'TaskNotFoundError', message: 'The task does not exist' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.tasks.retrieve('missing'))
      .rejects
      .toBeInstanceOf(NotFoundError);
  });
});

describe('tasks.retrieveByShortId', () => {
  it('GETs /task/shortid/{shortId} and returns Task', async () => {
    const fetch = mockFetch(200, createdTask);
    const { client } = makeClient({ fetch });
    const shortId = 't4k1';

    const task = await client.tasks.retrieveByShortId(shortId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/shortid/${shortId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(task).toEqual(createdTask);
  });

  it('types retrieveByShortId as (shortId: string) => Promise<Task>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.retrieveByShortId).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.retrieveByShortId).returns.toEqualTypeOf<Promise<Task>>();
  });
});

const taskId = 'task-1';
const listId = 'list-1';
const usersBody: TaskAssignment = { users: ['user-1'] };
const followBody: TaskFollow = { users: ['user-1'] };
const tagBody: TaskTag = { tags: ['tag-1'] };

describe('tasks.update', () => {
  it('PATCHes TaskPatch to /task/{taskId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });
    const body: TaskPatch = { text: 'Ship v3' };

    const result = await client.tasks.update(taskId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toBeUndefined();
  });

  it('types update as (taskId: string, body: TaskPatch) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.update).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.update).parameter(1).toEqualTypeOf<TaskPatch>();
    expectTypeOf(client.tasks.update).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.del', () => {
  it('DELETEs /task/{taskId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.del(taskId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toBeUndefined();
  });

  it('types del as (taskId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.del).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.list', () => {
  const searchResults: SearchResults = { tasks: [createdTask], total: 1, hiddenTasks: 0 };
  const body: TaskSearch = {
    predicates: [{ type: 'status', attribute: 'status', comparison: 'eq', value: 'pending' }],
  };

  it('POSTs TaskSearch to /task/search and returns SearchResults', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, searchResults) });

    const results = await client.tasks.list(body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/search`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(results).toEqual(searchResults);
  });

  it('types list as (body: TaskSearch) => Promise<SearchResults>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.list).parameter(0).toEqualTypeOf<TaskSearch>();
    expectTypeOf(client.tasks.list).returns.toEqualTypeOf<Promise<SearchResults>>();
  });
});

describe('tasks.complete', () => {
  it('POSTs /task/{taskId}/done', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.complete(taskId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/done`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toBeUndefined();
  });

  it('types complete as (taskId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.complete).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.complete).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.uncomplete', () => {
  it('POSTs /task/{taskId}/undone', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.uncomplete(taskId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/undone`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types uncomplete as (taskId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.uncomplete).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.uncomplete).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.assign', () => {
  it('POSTs TaskAssignment to /task/{taskId}/assigned', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.assign(taskId, usersBody);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/assigned`);
    expect(request.body).toEqual(usersBody);
    expect(result).toBeUndefined();
  });

  it('types assign as (taskId: string, body: TaskAssignment) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.assign).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.assign).parameter(1).toEqualTypeOf<TaskAssignment>();
    expectTypeOf(client.tasks.assign).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.unassign', () => {
  it('DELETEs TaskAssignment on /task/{taskId}/assigned', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.unassign(taskId, usersBody);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/assigned`);
    expect(request.body).toEqual(usersBody);
    expect(result).toBeUndefined();
  });

  it('types unassign as (taskId: string, body: TaskAssignment) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.unassign).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.unassign).parameter(1).toEqualTypeOf<TaskAssignment>();
    expectTypeOf(client.tasks.unassign).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.follow', () => {
  it('POSTs TaskFollow to /task/{taskId}/follow', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.follow(taskId, followBody);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/follow`);
    expect(request.body).toEqual(followBody);
    expect(result).toBeUndefined();
  });

  it('types follow as (taskId: string, body: TaskFollow) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.follow).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.follow).parameter(1).toEqualTypeOf<TaskFollow>();
    expectTypeOf(client.tasks.follow).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.unfollow', () => {
  it('POSTs TaskFollow to /task/{taskId}/unfollow', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.unfollow(taskId, followBody);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/unfollow`);
    expect(request.body).toEqual(followBody);
    expect(result).toBeUndefined();
  });

  it('types unfollow as (taskId: string, body: TaskFollow) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.unfollow).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.unfollow).parameter(1).toEqualTypeOf<TaskFollow>();
    expectTypeOf(client.tasks.unfollow).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.move', () => {
  it('POSTs TaskMove to /list/{listId}/move', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });
    const body: TaskMove = { tasks: [taskId], target: 'list-2' };

    const result = await client.tasks.move(listId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/move`);
    expect(request.body).toEqual(body);
    expect(result).toBeUndefined();
  });

  it('types move as (listId: string, body: TaskMove) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.move).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.move).parameter(1).toEqualTypeOf<TaskMove>();
    expectTypeOf(client.tasks.move).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.createMany', () => {
  it('POSTs TaskBulkCreate[] to /list/{listId}/task/bulk', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });
    const body: TaskBulkCreate[] = [{ text: 'One' }, { text: 'Two' }];

    const result = await client.tasks.createMany(listId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/list/${listId}/task/bulk`);
    expect(request.body).toEqual(body);
    expect(result).toBeUndefined();
  });

  it('types createMany as (listId: string, body: TaskBulkCreate[]) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.createMany).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.createMany).parameter(1).toEqualTypeOf<TaskBulkCreate[]>();
    expectTypeOf(client.tasks.createMany).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.updateMany', () => {
  const bulkResult: TaskBulkUpdateResult = { modified: [taskId], error: [] };

  it('PUTs TaskBulkUpdate to /task and returns TaskBulkUpdateResult', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, bulkResult) });
    const body: TaskBulkUpdate = { tasks: [taskId], status: 'done' };

    const result = await client.tasks.updateMany(body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PUT');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task`);
    expect(request.body).toEqual(body);
    expect(result).toEqual(bulkResult);
  });

  it('types updateMany as (body: TaskBulkUpdate) => Promise<TaskBulkUpdateResult>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.updateMany).parameter(0).toEqualTypeOf<TaskBulkUpdate>();
    expectTypeOf(client.tasks.updateMany).returns.toEqualTypeOf<Promise<TaskBulkUpdateResult>>();
  });
});

describe('tasks.listHome', () => {
  const homeTasks: HomeTasks = { tasks: [createdTask], total: 1 };

  it('GETs /task/home and returns HomeTasks', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, homeTasks) });

    const result = await client.tasks.listHome();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/home`);
    expect(request.body).toBeUndefined();
    expect(result).toEqual(homeTasks);
  });

  it('types listHome as () => Promise<HomeTasks>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.listHome).returns.toEqualTypeOf<Promise<HomeTasks>>();
  });
});

describe('tasks.addHome', () => {
  it('POSTs /task/{taskId}/home', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.addHome(taskId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/home`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types addHome as (taskId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.addHome).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.addHome).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.removeHome', () => {
  it('DELETEs /task/{taskId}/home', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.removeHome(taskId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/home`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types removeHome as (taskId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.removeHome).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.removeHome).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.addTag', () => {
  it('POSTs TaskTag to /task/{taskId}/tag', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.addTag(taskId, tagBody);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/tag`);
    expect(request.body).toEqual(tagBody);
    expect(result).toBeUndefined();
  });

  it('types addTag as (taskId: string, body: TaskTag) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.addTag).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.addTag).parameter(1).toEqualTypeOf<TaskTag>();
    expectTypeOf(client.tasks.addTag).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.removeTag', () => {
  it('DELETEs TaskTag on /task/{taskId}/tag', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.removeTag(taskId, tagBody);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/tag`);
    expect(request.body).toEqual(tagBody);
    expect(result).toBeUndefined();
  });

  it('types removeTag as (taskId: string, body: TaskTag) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.removeTag).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.removeTag).parameter(1).toEqualTypeOf<TaskTag>();
    expectTypeOf(client.tasks.removeTag).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.subtasks.create', () => {
  it('POSTs SubtaskCreate to /task/{taskId}/subtask and returns Task', async () => {
    const { client, fetch } = makeClient();
    const body: SubtaskCreate = { text: 'Write tests' };

    const task = await client.tasks.subtasks.create(taskId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/subtask`);
    expect(request.body).toEqual(body);
    expect(task).toEqual(createdTask);
  });

  it('types subtasks.create as (taskId: string, body: SubtaskCreate) => Promise<Task>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.subtasks.create).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.subtasks.create).parameter(1).toEqualTypeOf<SubtaskCreate>();
    expectTypeOf(client.tasks.subtasks.create).returns.toEqualTypeOf<Promise<Task>>();
  });
});

describe('tasks.convertToSubtask', () => {
  it('POSTs ConvertToSubtask to /task/{taskId}/convert-to-subtask', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });
    const body: ConvertToSubtask = { parentTaskId: 'parent-1' };

    const result = await client.tasks.convertToSubtask(taskId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/convert-to-subtask`);
    expect(request.body).toEqual(body);
    expect(result).toBeUndefined();
  });

  it('types convertToSubtask as (taskId: string, body: ConvertToSubtask) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.convertToSubtask).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.convertToSubtask).parameter(1).toEqualTypeOf<ConvertToSubtask>();
    expectTypeOf(client.tasks.convertToSubtask).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.convertToTask', () => {
  it('POSTs /task/{taskId}/convert-to-task and returns Task', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdTask) });

    const task = await client.tasks.convertToTask(taskId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/convert-to-task`);
    expect(request.body).toBeUndefined();
    expect(task).toEqual(createdTask);
  });

  it('types convertToTask as (taskId: string) => Promise<Task>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.convertToTask).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.convertToTask).returns.toEqualTypeOf<Promise<Task>>();
  });
});

describe('tasks.dependencies', () => {
  const dependencyId = 'dep-1';

  it('POSTs /task/{taskId}/dependency/{dependencyId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.dependencies.add(taskId, dependencyId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/dependency/${dependencyId}`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('DELETEs /task/{taskId}/dependency/{dependencyId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.dependencies.del(taskId, dependencyId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/dependency/${dependencyId}`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types dependencies.add and del', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.dependencies.add).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.dependencies.add).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.dependencies.add).returns.toEqualTypeOf<Promise<void>>();
    expectTypeOf(client.tasks.dependencies.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.dependencies.del).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.dependencies.del).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.attachments', () => {
  const attachmentId = 'att-1';
  const attachment: Attachment = { id: attachmentId };
  const body: NewAttachment = { author: 'user-1' };

  it('POSTs NewAttachment to /task/{taskId}/attachment and returns Attachment', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(201, attachment) });

    const result = await client.tasks.attachments.create(taskId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/attachment`);
    expect(request.body).toEqual(body);
    expect(result).toEqual(attachment);
  });

  it('PATCHes NewAttachment to /task/{taskId}/attachment/{attachmentId} and returns Attachment', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, attachment) });

    const result = await client.tasks.attachments.update(taskId, attachmentId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/attachment/${attachmentId}`);
    expect(request.body).toEqual(body);
    expect(result).toEqual(attachment);
  });

  it('DELETEs /task/{taskId}/attachment/{attachmentId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.attachments.del(taskId, attachmentId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/attachment/${attachmentId}`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types attachments.create, update, and del', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.attachments.create).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.attachments.create).parameter(1).toEqualTypeOf<NewAttachment>();
    expectTypeOf(client.tasks.attachments.create).returns.toEqualTypeOf<Promise<Attachment>>();
    expectTypeOf(client.tasks.attachments.update).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.attachments.update).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.attachments.update).parameter(2).toEqualTypeOf<NewAttachment>();
    expectTypeOf(client.tasks.attachments.update).returns.toEqualTypeOf<Promise<Attachment>>();
    expectTypeOf(client.tasks.attachments.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.attachments.del).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.attachments.del).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('tasks.activities', () => {
  const activityId = 'act-1';
  const comment: CommentActivity = {
    id: activityId,
    type: 'comment',
    value: 'Looks good',
    status: 'active',
    actor: { id: 'user-1', name: 'Ada', userName: 'ada', confirmed: true, avatar: '', costCenter: {} },
  };
  const listed: TaskActivities = {
    total: 1,
    activities: [{
      id: activityId,
      type: 'comment',
      actor: { type: 'User', data: 'user-1' },
      userFriendlyContent: { message: 'commented' },
    }],
  };

  it('GETs /task/{taskId}/activity with query and returns TaskActivities', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });
    const query: TaskActivitySearchQuery = {
      type: ['comment'],
      actorTypes: ['User'],
      limit: 10,
      skip: 5,
      sort: '-createdAt',
    };

    const result = await client.tasks.activities.list(taskId, query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/task/${taskId}/activity?type=comment&actorTypes=User&limit=10&skip=5&sort=-createdAt`,
    );
    expect(request.body).toBeUndefined();
    expect(result).toEqual(listed);
  });

  it('GETs /task/{taskId}/activity without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });

    await client.tasks.activities.list(taskId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/activity`);
    expect(request.body).toBeUndefined();
  });

  it('POSTs TaskActivityBody to /task/{taskId}/activity and returns CommentActivity', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(201, comment) });
    const body: TaskActivityBody = { type: 'comment', value: 'Looks good' };

    const result = await client.tasks.activities.create(taskId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/activity`);
    expect(request.body).toEqual(body);
    expect(result).toEqual(comment);
  });

  it('PATCHes ActivityBody to /task/{taskId}/activity/{activityId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });
    const body: ActivityBody = { value: 'Updated comment' };

    const result = await client.tasks.activities.update(taskId, activityId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/activity/${activityId}`);
    expect(request.body).toEqual(body);
    expect(result).toBeUndefined();
  });

  it('DELETEs /task/{taskId}/activity/{activityId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.tasks.activities.del(taskId, activityId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/task/${taskId}/activity/${activityId}`);
    expect(request.body).toBeUndefined();
    expect(result).toBeUndefined();
  });

  it('types activities.list, create, update, and del', () => {
    const { client } = makeClient();
    expectTypeOf(client.tasks.activities.list).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.activities.list).parameter(1).toEqualTypeOf<TaskActivitySearchQuery | undefined>();
    expectTypeOf(client.tasks.activities.list).returns.toEqualTypeOf<Promise<TaskActivities>>();
    expectTypeOf(client.tasks.activities.create).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.activities.create).parameter(1).toEqualTypeOf<TaskActivityBody>();
    expectTypeOf(client.tasks.activities.create).returns.toEqualTypeOf<Promise<CommentActivity>>();
    expectTypeOf(client.tasks.activities.update).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.activities.update).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.activities.update).parameter(2).toEqualTypeOf<ActivityBody>();
    expectTypeOf(client.tasks.activities.update).returns.toEqualTypeOf<Promise<void>>();
    expectTypeOf(client.tasks.activities.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.activities.del).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.tasks.activities.del).returns.toEqualTypeOf<Promise<void>>();
  });
});
