import { describe, expect, it } from 'vitest';
import {
  collectTypeExamples,
  composeExample,
  emitExamplesSource,
  successType,
} from '../scripts/generate-examples.mjs';

const spec = {
  paths: {
    '/task': {
      post: {
        operationId: 'createTask',
        responses: {
          201: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
        },
      },
    },
    '/task/{id}': {
      get: {
        operationId: 'getTaskDetails',
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Task' },
              },
            },
          },
        },
      },
    },
    '/tag': {
      get: {
        operationId: 'listTags',
        responses: {
          200: {
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Tag' },
                },
              },
            },
          },
        },
      },
    },
    '/user/email/{email}': {
      get: {
        operationId: 'getUserByEmail',
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserDetailWithTeam' },
              },
            },
          },
        },
      },
    },
    '/list/sublists': {
      get: {
        operationId: 'getListSublists',
        responses: {
          200: {
            content: {
              'application/json': {
                schema: { type: 'array', items: { type: 'string' }, example: ['Backlog'] },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Task: { example: { id: 'task-1', text: 'Ship' } },
      Tag: { example: { id: 'tag-1', name: 'launch' } },
      UserDetail: { example: { id: 'user-1', name: 'Ada' } },
      Team: { example: { id: 'team-1', name: 'Example' } },
      UserDetailWithTeam: {
        allOf: [
          { $ref: '#/components/schemas/UserDetail' },
          {
            type: 'object',
            properties: {
              team: { $ref: '#/components/schemas/Team' },
            },
          },
        ],
      },
    },
  },
};

describe('successType', () => {
  it('unwraps arrays to the item schema', () => {
    expect(successType({ type: 'array', items: { $ref: '#/components/schemas/Tag' } })).toEqual({
      type: 'Tag',
    });
  });
});

describe('composeExample', () => {
  it('merges allOf without a schema-level example', () => {
    expect(composeExample({ $ref: '#/components/schemas/UserDetailWithTeam' }, spec)).toEqual({
      ok: true,
      value: { id: 'user-1', name: 'Ada', team: { id: 'team-1', name: 'Example' } },
    });
  });
});

describe('collectTypeExamples', () => {
  it('keys by type, shares Task, unwraps Tag[], skips string[]', () => {
    const collected = collectTypeExamples(spec);

    expect(Object.keys(collected.examples)).toEqual(['Tag', 'Task', 'UserDetailWithTeam']);
    expect(collected.examples.Task.usedBy).toEqual(['createTask', 'getTaskDetails']);
    expect(collected.examples.Task.exportName).toBe('task');
    expect(collected.examples.Tag.example).toEqual({ id: 'tag-1', name: 'launch' });
    expect(collected.examples.Tag.usedBy).toEqual(['listTags']);
    expect(collected.examples.UserDetailWithTeam.example.team).toEqual({
      id: 'team-1',
      name: 'Example',
    });
    expect(collected.skipped.map((row) => row.operationId)).toEqual(['getListSublists']);
    expect(collected.conflicts).toEqual([]);
  });
});

describe('emitExamplesSource', () => {
  it('writes typed consts', () => {
    const source = emitExamplesSource(
      {
        Task: { type: 'Task', exportName: 'task', usedBy: ['createTask'], example: { id: 'task-1' } },
        UserDetailWithTeam: {
          type: 'UserDetailWithTeam',
          exportName: 'userDetailWithTeam',
          usedBy: ['getUserByEmail'],
          example: { id: 'user-1', team: { id: 'team-1' } },
        },
      },
      'abc',
    );

    expect(source).toContain('scripts/generate-types.mjs');
    expect(source).toContain("from './generated.js'");
    expect(source).toContain('export const task: Task =');
    expect(source).toContain('export const userDetailWithTeam: UserDetailWithTeam =');
    expect(source).not.toContain('usedBy');
    expect(source).not.toContain('skipped');
  });
});
