import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  ReactionCreate,
  ReactionReadOnly,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from '../helpers.js';

const activityId = 'activity-1';
const reactionId = 'reaction-1';
const createdReaction: ReactionReadOnly = {
  id: reactionId,
  emoji: ':+1:',
  total: 1,
  users: [{ name: 'Ada' }],
};

describe('reactions.add', () => {
  it('POSTs ReactionCreate to /activity/{activityId}/reaction and returns ReactionReadOnly', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(201, createdReaction) });
    const body: ReactionCreate = { emoji: ':+1:' };

    const reaction = await client.reactions.add(activityId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/activity/${activityId}/reaction`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    expect(reaction).toEqual(createdReaction);
  });

  it('types add as (activityId: string, body: ReactionCreate) => Promise<ReactionReadOnly>', () => {
    const { client } = makeClient();
    expectTypeOf(client.reactions.add).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.reactions.add).parameter(1).toEqualTypeOf<ReactionCreate>();
    expectTypeOf(client.reactions.add).returns.toEqualTypeOf<Promise<ReactionReadOnly>>();
  });
});

describe('reactions.del', () => {
  it('DELETEs /activity/{activityId}/reaction/{reactionId}', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.reactions.del(activityId, reactionId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/activity/${activityId}/reaction/${reactionId}`,
    );
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toBeUndefined();
  });

  it('types del as (activityId: string, reactionId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.reactions.del).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.reactions.del).parameter(1).toEqualTypeOf<string>();
    expectTypeOf(client.reactions.del).returns.toEqualTypeOf<Promise<void>>();
  });
});
