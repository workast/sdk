import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type { ReactionCreate, ReactionReadOnly } from '../types/generated.js';

export class Reactions {
  constructor(private readonly client: Workast) {}

  /**
   * Add a reaction to an activity.
   * Requires one of: `activity:react` (least privilege) or `task:manage`.
   *
   * @example
   * const reaction = await workast.reactions.add('activity-id', { emoji: ':+1:' });
   */
  add(
    activityId: string,
    body: ReactionCreate,
    options?: RequestOptions,
  ): Promise<ReactionReadOnly> {
    return this.client.request(
      'POST',
      `/activity/${encodeURIComponent(activityId)}/reaction`,
      body,
      options,
    );
  }

  /**
   * Remove a reaction from an activity.
   * Requires one of: `activity:react` (least privilege) or `task:manage`.
   *
   * @example
   * await workast.reactions.del('activity-id', 'reaction-id');
   */
  del(activityId: string, reactionId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/activity/${encodeURIComponent(activityId)}/reaction/${encodeURIComponent(reactionId)}`,
      undefined,
      options,
    );
  }
}
