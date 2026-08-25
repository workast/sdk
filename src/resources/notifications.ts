import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type {
  NotificationSearchQuery,
  Notifications,
} from '../types/generated.js';

export class NotificationsResource {
  constructor(private readonly client: Workast) {}

  /**
   * List notifications for the logged-in user.
   * Requires one of: `notification:find` (least privilege) or `notification:manage`.
   *
   * @example
   * const results = await workast.notifications.list({ read: false, limit: 10 });
   */
  list(query?: NotificationSearchQuery, options?: RequestOptions): Promise<Notifications> {
    const params = new URLSearchParams(options?.query);
    if (query?.read != null) {
      params.set('read', String(query.read));
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
      '/notification',
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Mark a notification as read.
   * Requires `notification:manage`.
   *
   * @example
   * await workast.notifications.markRead('notification-id');
   */
  markRead(notificationId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/notification/${encodeURIComponent(notificationId)}/read`,
      undefined,
      options,
    );
  }

  /**
   * Mark a notification as unread.
   * Requires `notification:manage`.
   *
   * @example
   * await workast.notifications.markUnread('notification-id');
   */
  markUnread(notificationId: string, options?: RequestOptions): Promise<void> {
    return this.client.request(
      'POST',
      `/notification/${encodeURIComponent(notificationId)}/unread`,
      undefined,
      options,
    );
  }
}
