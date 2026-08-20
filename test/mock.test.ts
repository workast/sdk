import { describe, expect, it } from 'vitest';
import {
  AuthenticationError,
  NotFoundError,
  PermissionError,
  ValidationError,
  Workast,
} from '../src/index.js';
import { errors, examples, mockWorkast } from '../src/mock.js';

const workast = new Workast({ apiKey: 'test-api-key' });

const { customField, list, task, userDetail, userResource } = examples;

const me = { ...userResource };
const createdTask = { ...task };
const childTask = { ...task, text: 'Child' };
const createBodyWithFields = {
  text: task.text,
  fields: [{ id: customField.id, value: 'High' }],
};

describe('success', () => {
  it('returns the body for users.me with no args', async () => {
    const mock = mockWorkast();
    mock.users.me.on().resolves(me);

    const user = await workast.users.me();

    expect(user).toEqual(me);
  });

  it('returns the task for tasks.create with path and body', async () => {
    const mock = mockWorkast();
    mock.tasks.create.on(list.id, { text: task.text }).resolves(createdTask);

    const created = await workast.tasks.create(list.id, { text: task.text });

    expect(created).toEqual(createdTask);
  });

  it('returns undefined for tasks.update with no resolve value', async () => {
    const mock = mockWorkast();
    mock.tasks.update.on(task.id, { text: task.text }).resolves();

    const result = await workast.tasks.update(task.id, { text: task.text });

    expect(result).toBeUndefined();
  });

  it('returns the task for nested tasks.subtasks.create', async () => {
    const mock = mockWorkast();
    mock.tasks.subtasks.create.on(task.id, { text: childTask.text }).resolves(childTask);

    const created = await workast.tasks.subtasks.create(task.id, { text: childTask.text });

    expect(created).toEqual(childTask);
    expect(mock.calls()).toEqual([{
      method: 'tasks.subtasks.create',
      args: [task.id, { text: childTask.text }],
    }]);
  });

  it('returns the list for users.list with a query object', async () => {
    const mock = mockWorkast();
    mock.users.list.on({ name: userDetail.name, limit: 10 }).resolves([userDetail]);

    const users = await workast.users.list({ name: userDetail.name, limit: 10 });

    expect(users).toEqual([userDetail]);
  });
});

describe('asserting the call', () => {
  it('wasCalled is false before the matching call and true after', async () => {
    const mock = mockWorkast();
    const interceptor = mock.users.me.on().resolves(me);

    expect(interceptor.wasCalled()).toBe(false);

    await workast.users.me();

    expect(interceptor.wasCalled()).toBe(true);
  });

  it('calls records method and args', async () => {
    const mock = mockWorkast();
    mock.users.me.on().resolves(me);

    await workast.users.me();

    expect(mock.calls()).toEqual([{ method: 'users.me', args: [] }]);
  });

  it('calls records unmatched methods', async () => {
    const mock = mockWorkast();
    mock.users.me.on().resolves(me);

    await expect(workast.tasks.create(list.id, { text: task.text }))
      .rejects
      .toThrow(/pending/i);

    expect(mock.calls()).toEqual([{
      method: 'tasks.create',
      args: [list.id, { text: task.text }],
    }]);
  });

  it('pending is empty after two FIFO tasks.update calls', async () => {
    const mock = mockWorkast();
    mock.tasks.update.on(task.id, { text: task.text }).resolves();
    mock.tasks.update.on(list.id, { text: list.name }).resolves();

    await workast.tasks.update(task.id, { text: task.text });
    await workast.tasks.update(list.id, { text: list.name });

    expect(mock.pending()).toHaveLength(0);
  });

  it('wasCalled is false when the interceptor is unused', () => {
    const mock = mockWorkast();
    const interceptor = mock.users.me.on().resolves(me);

    expect(interceptor.wasCalled()).toBe(false);
  });

  it('pending lists an unused interceptor', () => {
    const mock = mockWorkast();
    mock.users.me.on().resolves(me);

    expect(mock.pending()).toHaveLength(1);
  });

  it('passes when an unused interceptor is left unchecked', () => {
    const mock = mockWorkast();
    mock.users.me.on().resolves(me);
  });
});

describe('arg match', () => {
  it('matches a nested body regardless of key order', async () => {
    const mock = mockWorkast();
    mock.tasks.create.on(list.id, createBodyWithFields).resolves(createdTask);

    const created = await workast.tasks.create(list.id, {
      fields: [{ value: 'High', id: customField.id }],
      text: task.text,
    });

    expect(created).toEqual(createdTask);
  });

  it('matches when an argument predicate returns true', async () => {
    const mock = mockWorkast();
    mock.tasks.create.on(list.id, (body: { text: string }) => body.text === task.text).resolves(createdTask);

    const created = await workast.tasks.create(list.id, {
      text: task.text,
      description: task.description,
    });

    expect(created).toEqual(createdTask);
  });

  it('matches when an on() predicate over all args returns true', async () => {
    const mock = mockWorkast();
    mock.tasks.create.on(
      (listId: string, body: { text: string }) => listId === list.id && body.text === task.text,
    ).resolves(createdTask);

    const created = await workast.tasks.create(list.id, { text: task.text });

    expect(created).toEqual(createdTask);
  });

  it('throws unmatched when an argument predicate returns false', async () => {
    const mock = mockWorkast();
    mock.tasks.create.on(list.id, (body: { text: string }) => body.text === task.text).resolves(createdTask);

    await expect(workast.tasks.create(list.id, { text: list.name }))
      .rejects
      .toThrow(/pending/i);
  });

  it('throws unmatched when a nested key is missing', async () => {
    const mock = mockWorkast();
    mock.tasks.create.on(list.id, createBodyWithFields).resolves(createdTask);

    await expect(workast.tasks.create(list.id, {
      text: task.text,
      fields: [{ id: customField.id }],
    })).rejects.toThrow(/pending/i);
  });

  it('throws unmatched when a nested field value differs', async () => {
    const mock = mockWorkast();
    mock.tasks.create.on(list.id, createBodyWithFields).resolves(createdTask);

    await expect(workast.tasks.create(list.id, {
      text: task.text,
      fields: [{ id: customField.id, value: 'Low' }],
    })).rejects.toThrow(/pending/i);
  });

  it('throws unmatched when top-level args differ', async () => {
    const mock = mockWorkast();
    mock.tasks.create.on(list.id, { text: task.text }).resolves(createdTask);

    await expect(workast.tasks.create(task.list.id, { text: task.text }))
      .rejects
      .toThrow(/pending/i);
  });

  it('matches a trailing RequestOptions prefix', async () => {
    const mock = mockWorkast();
    mock.tasks.create.on(list.id, { text: task.text }).resolves(createdTask);

    const created = await workast.tasks.create(
      list.id,
      { text: task.text },
      { headers: { 'X-A': '1' } },
    );

    expect(created).toEqual(createdTask);
    expect(mock.calls()).toEqual([{
      method: 'tasks.create',
      args: [list.id, { text: task.text }, { headers: { 'X-A': '1' } }],
    }]);
  });
});

describe('errors', () => {
  it('throws AuthenticationError for errors.unauthorized', async () => {
    const mock = mockWorkast();
    mock.users.me.on().rejects(errors.unauthorized);

    await expect(workast.users.me()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('throws NotFoundError for errors.notFound', async () => {
    const mock = mockWorkast();
    mock.users.me.on().rejects(errors.notFound);

    await expect(workast.users.me()).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws PermissionError for errors.forbidden', async () => {
    const mock = mockWorkast();
    mock.users.me.on().rejects(errors.forbidden);

    await expect(workast.users.me()).rejects.toBeInstanceOf(PermissionError);
  });

  it('throws ValidationError for errors.validation', async () => {
    const mock = mockWorkast();
    mock.tasks.create.on(list.id, { text: task.text }).rejects(errors.validation);

    await expect(workast.tasks.create(list.id, { text: task.text }))
      .rejects
      .toBeInstanceOf(ValidationError);
  });

  it('throws a custom Error passed to rejects', async () => {
    const mock = mockWorkast();
    mock.users.me.on().rejects(new AuthenticationError('nope'));

    const rejection = workast.users.me();
    await expect(rejection).rejects.toBeInstanceOf(AuthenticationError);
    await expect(rejection).rejects.toThrow('nope');
  });
});

describe('unmatched and isolation', () => {
  it('throws listing pending interceptors when nothing is queued', async () => {
    mockWorkast();

    await expect(workast.users.me()).rejects.toThrow(/pending/i);
  });

  it('throws listing the pending interceptor when the call does not match', async () => {
    const mock = mockWorkast();
    mock.users.me.on().resolves(me);

    const rejection = workast.tasks.create(list.id, { text: task.text });
    await expect(rejection).rejects.toThrow(/pending/i);
    await expect(rejection).rejects.toThrow(/users\.me/);
  });

  it('does not share queues across mockWorkast instances', async () => {
    const mockA = mockWorkast();
    const interceptor = mockA.users.me.on().resolves(me);

    mockWorkast();

    await expect(workast.users.me()).rejects.toThrow(/pending/i);
    expect(interceptor.wasCalled()).toBe(false);
    expect(mockA.pending()).toHaveLength(1);
  });
});

describe('reset and restore', () => {
  it('reset clears interceptors and calls but keeps intercepting', async () => {
    const mock = mockWorkast();
    const interceptor = mock.users.me.on().resolves(me);
    await workast.users.me();

    mock.reset();

    expect(interceptor.wasCalled()).toBe(false);
    expect(mock.pending()).toHaveLength(0);
    expect(mock.calls()).toHaveLength(0);
    await expect(workast.users.me()).rejects.toThrow(/pending/i);
  });

  it('restore stops intercepting so the real SDK uses fetch', async () => {
    const mock = mockWorkast();
    mock.users.me.on().resolves(me);
    mock.restore();

    let fetched = false;
    const client = new Workast({
      apiKey: 'test-api-key',
      fetch: async () => {
        fetched = true;
        return new Response(JSON.stringify(me), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

    const user = await client.users.me();

    expect(fetched).toBe(true);
    expect(user).toEqual(me);
  });

  it('mockWorkast after restore intercepts again', async () => {
    const mock = mockWorkast();
    mock.restore();

    const again = mockWorkast();
    again.users.me.on().resolves(me);

    const user = await workast.users.me();

    expect(user).toEqual(me);
    expect(again.calls()).toEqual([{ method: 'users.me', args: [] }]);
  });
});
