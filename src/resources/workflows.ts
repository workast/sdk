import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type {
  Workflow,
  WorkflowCreate,
  WorkflowDetail,
  WorkflowPatch,
  WorkflowSearchQuery,
  Workflows,
} from '../types/generated.js';

function pagingOptions(query?: WorkflowSearchQuery, options?: RequestOptions): RequestOptions | undefined {
  const params = new URLSearchParams(options?.query);
  if (query?.limit != null) {
    params.set('limit', String(query.limit));
  }
  if (query?.skip != null) {
    params.set('skip', String(query.skip));
  }
  return params.toString() ? { ...options, query: params } : options;
}

export class WorkflowsResource {
  constructor(private readonly client: Workast) {}

  /**
   * List workflows created by the logged-in user.
   * Requires one of: `workflow:find` (least privilege) or `workflow:manage`.
   *
   * @example
   * const results = await workast.workflows.list({ limit: 10, skip: 0 });
   */
  list(query?: WorkflowSearchQuery, options?: RequestOptions): Promise<Workflows> {
    return this.client.request('GET', '/workflow', undefined, pagingOptions(query, options));
  }

  /**
   * Create a workflow.
   * Requires `workflow:manage`.
   *
   * @example
   * const workflow = await workast.workflows.create({
   *   type: 'event',
   *   trigger: 'task_created',
   *   prompt: 'Ship v3',
   *   lists: ['list-id'],
   * });
   */
  create(body: WorkflowCreate, options?: RequestOptions): Promise<Workflow> {
    return this.client.request('POST', '/workflow', body, options);
  }

  /**
   * Get a workflow by ID.
   * Requires one of: `workflow:find` (least privilege) or `workflow:manage`.
   *
   * @example
   * const workflow = await workast.workflows.retrieve('workflow-id');
   */
  retrieve(workflowId: string, options?: RequestOptions): Promise<WorkflowDetail> {
    return this.client.request(
      'GET',
      `/workflow/${encodeURIComponent(workflowId)}`,
      undefined,
      options,
    );
  }

  /**
   * Update a workflow.
   * Requires `workflow:manage`.
   *
   * @example
   * await workast.workflows.update('workflow-id', { prompt: 'Ship v3' });
   */
  update(workflowId: string, body: WorkflowPatch, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'PATCH',
      `/workflow/${encodeURIComponent(workflowId)}`,
      body,
      options,
    );
  }

  /**
   * Delete a workflow.
   * Requires `workflow:manage`.
   *
   * @example
   * await workast.workflows.del('workflow-id');
   */
  del(workflowId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'DELETE',
      `/workflow/${encodeURIComponent(workflowId)}`,
      undefined,
      options,
    );
  }

  /**
   * Activate a workflow.
   * Requires `workflow:manage`.
   *
   * @example
   * await workast.workflows.activate('workflow-id');
   */
  activate(workflowId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'PATCH',
      `/workflow/${encodeURIComponent(workflowId)}/activate`,
      undefined,
      options,
    );
  }

  /**
   * Deactivate a workflow.
   * Requires `workflow:manage`.
   *
   * @example
   * await workast.workflows.deactivate('workflow-id');
   */
  deactivate(workflowId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'PATCH',
      `/workflow/${encodeURIComponent(workflowId)}/deactivate`,
      undefined,
      options,
    );
  }
}
