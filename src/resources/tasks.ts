import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type {
  ActivityBody,
  Attachment,
  CommentActivity,
  ConvertToSubtask,
  HomeTasks,
  NewAttachment,
  SearchResults,
  SubtaskCreate,
  Task,
  TaskActivities,
  TaskActivityBody,
  TaskActivitySearchQuery,
  TaskAssignment,
  TaskBulkCreate,
  TaskBulkUpdate,
  TaskBulkUpdateResult,
  TaskCreate,
  TaskFollow,
  TaskMove,
  TaskPatch,
  TaskSearch,
  TaskTag,
} from '../types/generated.js';

class TaskSubtasks {
  constructor(private readonly client: Workast) {}

  /**
   * Create a subtask on a task.
   *
   * @example
   * const subtask = await workast.tasks.subtasks.create('task-id', { text: 'Write tests' });
   */
  create(taskId: string, body: SubtaskCreate, options?: RequestOptions): Promise<Task> {
    return this.client.request('POST', `/task/${encodeURIComponent(taskId)}/subtask`, body, options);
  }
}

class TaskDependencies {
  constructor(private readonly client: Workast) {}

  /**
   * Add a dependency to a task.
   *
   * @example
   * await workast.tasks.dependencies.add('task-id', 'dependency-id');
   */
  add(taskId: string, dependencyId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/task/${encodeURIComponent(taskId)}/dependency/${encodeURIComponent(dependencyId)}`,
      undefined,
      options,
    );
  }

  /**
   * Remove a dependency from a task.
   *
   * @example
   * await workast.tasks.dependencies.del('task-id', 'dependency-id');
   */
  del(taskId: string, dependencyId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/task/${encodeURIComponent(taskId)}/dependency/${encodeURIComponent(dependencyId)}`,
      undefined,
      options,
    );
  }
}

class TaskAttachments {
  constructor(private readonly client: Workast) {}

  /**
   * Create an attachment on a task.
   *
   * @example
   * const attachment = await workast.tasks.attachments.create('task-id', { author: 'user-id' });
   */
  create(taskId: string, body: NewAttachment, options?: RequestOptions): Promise<Attachment> {
    return this.client.request('POST', `/task/${encodeURIComponent(taskId)}/attachment`, body, options);
  }

  /**
   * Update a task attachment.
   *
   * @example
   * const attachment = await workast.tasks.attachments.update('task-id', 'attachment-id', { date: '2026-01-01' });
   */
  update(
    taskId: string,
    attachmentId: string,
    body: NewAttachment,
    options?: RequestOptions,
  ): Promise<Attachment> {
    return this.client.request(
      'PATCH',
      `/task/${encodeURIComponent(taskId)}/attachment/${encodeURIComponent(attachmentId)}`,
      body,
      options,
    );
  }

  /**
   * Delete a task attachment.
   *
   * @example
   * await workast.tasks.attachments.del('task-id', 'attachment-id');
   */
  del(taskId: string, attachmentId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/task/${encodeURIComponent(taskId)}/attachment/${encodeURIComponent(attachmentId)}`,
      undefined,
      options,
    );
  }
}

class TaskActivitiesResource {
  constructor(private readonly client: Workast) {}

  /**
   * List activities on a task.
   *
   * @example
   * const results = await workast.tasks.activities.list('task-id', { type: ['comment'], limit: 10 });
   */
  list(
    taskId: string,
    query?: TaskActivitySearchQuery,
    options?: RequestOptions,
  ): Promise<TaskActivities> {
    const params = new URLSearchParams(options?.query);
    if (query?.type) {
      for (const value of query.type) {
        params.append('type', value);
      }
    }
    if (query?.actorTypes) {
      for (const value of query.actorTypes) {
        params.append('actorTypes', value);
      }
    }
    if (query?.limit != null) {
      params.set('limit', String(query.limit));
    }
    if (query?.skip != null) {
      params.set('skip', String(query.skip));
    }
    if (query?.sort) {
      params.set('sort', query.sort);
    }
    return this.client.request(
      'GET',
      `/task/${encodeURIComponent(taskId)}/activity`,
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Create a comment activity on a task.
   *
   * @example
   * const activity = await workast.tasks.activities.create('task-id', { type: 'comment', value: 'Looks good' });
   */
  create(taskId: string, body: TaskActivityBody, options?: RequestOptions): Promise<CommentActivity> {
    return this.client.request('POST', `/task/${encodeURIComponent(taskId)}/activity`, body, options);
  }

  /**
   * Update a task activity.
   *
   * @example
   * await workast.tasks.activities.update('task-id', 'activity-id', { value: 'Updated comment' });
   */
  update(
    taskId: string,
    activityId: string,
    body: ActivityBody,
    options?: RequestOptions,
  ): Promise<void> {
    return this.client.request(
      'PATCH',
      `/task/${encodeURIComponent(taskId)}/activity/${encodeURIComponent(activityId)}`,
      body,
      options,
    );
  }

  /**
   * Delete a task activity.
   *
   * @example
   * await workast.tasks.activities.del('task-id', 'activity-id');
   */
  del(taskId: string, activityId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/task/${encodeURIComponent(taskId)}/activity/${encodeURIComponent(activityId)}`,
      undefined,
      options,
    );
  }
}

export class Tasks {
  readonly subtasks: TaskSubtasks;
  readonly dependencies: TaskDependencies;
  readonly attachments: TaskAttachments;
  readonly activities: TaskActivitiesResource;

  constructor(private readonly client: Workast) {
    this.subtasks = new TaskSubtasks(client);
    this.dependencies = new TaskDependencies(client);
    this.attachments = new TaskAttachments(client);
    this.activities = new TaskActivitiesResource(client);
  }

  /**
   * Create a task in a list.
   *
   * @example
   * const task = await workast.tasks.create('list-id', { text: 'Ship v3' });
   */
  create(listId: string, body: TaskCreate, options?: RequestOptions): Promise<Task> {
    return this.client.request('POST', `/list/${encodeURIComponent(listId)}/task`, body, options);
  }

  /**
   * Get a task by ID.
   *
   * @example
   * const task = await workast.tasks.retrieve('task-id');
   */
  retrieve(taskId: string, options?: RequestOptions): Promise<Task> {
    return this.client.request('GET', `/task/${encodeURIComponent(taskId)}`, undefined, options);
  }

  /**
   * Get a task by short ID.
   *
   * @example
   * const task = await workast.tasks.retrieveByShortId('t4k1');
   */
  retrieveByShortId(shortId: string, options?: RequestOptions): Promise<Task> {
    return this.client.request('GET', `/task/shortid/${encodeURIComponent(shortId)}`, undefined, options);
  }

  /**
   * Update a task.
   *
   * @example
   * await workast.tasks.update('task-id', { text: 'Ship v3' });
   */
  update(taskId: string, body: TaskPatch, options?: RequestOptions): Promise<void> {
    return this.client.request('PATCH', `/task/${encodeURIComponent(taskId)}`, body, options);
  }

  /**
   * Delete a task.
   *
   * @example
   * await workast.tasks.del('task-id');
   */
  del(taskId: string, options?: RequestOptions): Promise<void> {
    return this.client.request('DELETE', `/task/${encodeURIComponent(taskId)}`, undefined, options);
  }

  /**
   * Search tasks.
   *
   * @example
   * const results = await workast.tasks.list({
   *   predicates: [{ type: 'status', attribute: 'status', comparison: 'eq', value: 'pending' }],
   * });
   */
  list(body: TaskSearch, options?: RequestOptions): Promise<SearchResults> {
    return this.client.request('POST', '/task/search', body, options);
  }

  /**
   * Complete a task.
   *
   * @example
   * await workast.tasks.complete('task-id');
   */
  complete(taskId: string, options?: RequestOptions): Promise<void> {
    return this.client.request('POST', `/task/${encodeURIComponent(taskId)}/done`, undefined, options);
  }

  /**
   * Uncomplete a task.
   *
   * @example
   * await workast.tasks.uncomplete('task-id');
   */
  uncomplete(taskId: string, options?: RequestOptions): Promise<void> {
    return this.client.request('POST', `/task/${encodeURIComponent(taskId)}/undone`, undefined, options);
  }

  /**
   * Assign users to a task.
   *
   * @example
   * await workast.tasks.assign('task-id', { users: ['user-id'] });
   */
  assign(taskId: string, body: TaskAssignment, options?: RequestOptions): Promise<void> {
    return this.client.request('POST', `/task/${encodeURIComponent(taskId)}/assigned`, body, options);
  }

  /**
   * Unassign users from a task.
   *
   * @example
   * await workast.tasks.unassign('task-id', { users: ['user-id'] });
   */
  unassign(taskId: string, body: TaskAssignment, options?: RequestOptions): Promise<void> {
    return this.client.request('DELETE', `/task/${encodeURIComponent(taskId)}/assigned`, body, options);
  }

  /**
   * Add followers to a task.
   *
   * @example
   * await workast.tasks.follow('task-id', { users: ['user-id'] });
   */
  follow(taskId: string, body: TaskFollow, options?: RequestOptions): Promise<void> {
    return this.client.request('POST', `/task/${encodeURIComponent(taskId)}/follow`, body, options);
  }

  /**
   * Remove followers from a task.
   *
   * @example
   * await workast.tasks.unfollow('task-id', { users: ['user-id'] });
   */
  unfollow(taskId: string, body: TaskFollow, options?: RequestOptions): Promise<void> {
    return this.client.request('POST', `/task/${encodeURIComponent(taskId)}/unfollow`, body, options);
  }

  /**
   * Move tasks to another list.
   *
   * @example
   * await workast.tasks.move('list-id', { tasks: ['task-id'], target: 'other-list-id' });
   */
  move(listId: string, body: TaskMove, options?: RequestOptions): Promise<void> {
    return this.client.request('POST', `/list/${encodeURIComponent(listId)}/move`, body, options);
  }

  /**
   * Create many tasks in a list.
   *
   * @example
   * await workast.tasks.createMany('list-id', [{ text: 'One' }, { text: 'Two' }]);
   */
  createMany(listId: string, body: TaskBulkCreate[], options?: RequestOptions): Promise<void> {
    return this.client.request('POST', `/list/${encodeURIComponent(listId)}/task/bulk`, body, options);
  }

  /**
   * Update many tasks.
   *
   * @example
   * const result = await workast.tasks.updateMany({ tasks: ['task-id'], status: 'done' });
   */
  updateMany(body: TaskBulkUpdate, options?: RequestOptions): Promise<TaskBulkUpdateResult> {
    return this.client.request('PUT', '/task', body, options);
  }

  /**
   * List home (favourite) tasks.
   *
   * @example
   * const home = await workast.tasks.listHome();
   */
  listHome(options?: RequestOptions): Promise<HomeTasks> {
    return this.client.request('GET', '/task/home', undefined, options);
  }

  /**
   * Add a task to the home screen.
   *
   * @example
   * await workast.tasks.addHome('task-id');
   */
  addHome(taskId: string, options?: RequestOptions): Promise<void> {
    return this.client.request('POST', `/task/${encodeURIComponent(taskId)}/home`, undefined, options);
  }

  /**
   * Remove a task from the home screen.
   *
   * @example
   * await workast.tasks.removeHome('task-id');
   */
  removeHome(taskId: string, options?: RequestOptions): Promise<void> {
    return this.client.request('DELETE', `/task/${encodeURIComponent(taskId)}/home`, undefined, options);
  }

  /**
   * Add tags to a task.
   *
   * @example
   * await workast.tasks.addTag('task-id', { tags: ['tag-id'] });
   */
  addTag(taskId: string, body: TaskTag, options?: RequestOptions): Promise<void> {
    return this.client.request('POST', `/task/${encodeURIComponent(taskId)}/tag`, body, options);
  }

  /**
   * Remove tags from a task.
   *
   * @example
   * await workast.tasks.removeTag('task-id', { tags: ['tag-id'] });
   */
  removeTag(taskId: string, body: TaskTag, options?: RequestOptions): Promise<void> {
    return this.client.request('DELETE', `/task/${encodeURIComponent(taskId)}/tag`, body, options);
  }

  /**
   * Convert a task into a subtask of another task.
   *
   * @example
   * await workast.tasks.convertToSubtask('task-id', { parentTaskId: 'parent-id' });
   */
  convertToSubtask(taskId: string, body: ConvertToSubtask, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/task/${encodeURIComponent(taskId)}/convert-to-subtask`,
      body,
      options,
    );
  }

  /**
   * Convert a subtask into a standalone task.
   *
   * @example
   * const task = await workast.tasks.convertToTask('task-id');
   */
  convertToTask(taskId: string, options?: RequestOptions): Promise<Task> {
    return this.client.request(
      'POST',
      `/task/${encodeURIComponent(taskId)}/convert-to-task`,
      undefined,
      options,
    );
  }
}
