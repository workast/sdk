import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  Notification,
  NotificationSearchQuery,
  Notifications,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from '../helpers.js';

const notificationId = 'notif-1';
const notification: Notification = {
  id: notificationId,
  type: 'task_assigned',
  read: false,
  activityId: 'activity-1',
  sentAt: '2026-08-14T00:00:00.000Z',
  createdAt: '2026-08-14T00:00:00.000Z',
};
const listed: Notifications = { total: 1, notifications: [notification] };

describe('notifications.list', () => {
  it('GETs /notification with query and returns Notifications', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });
    const query: NotificationSearchQuery = {
      read: false,
      limit: 10,
      skip: 5,
      sort: '-sentAt',
    };

    const result = await client.notifications.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/notification?read=false&limit=10&skip=5&sort=-sentAt`,
    );
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toEqual(listed);
  });

  it('GETs /notification without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });

    await client.notifications.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/notification`);
    expect(request.body).toBeUndefined();
  });

  it('types list as (query?: NotificationSearchQuery) => Promise<Notifications>', () => {
    const { client } = makeClient();
    expectTypeOf(client.notifications.list).parameter(0).toEqualTypeOf<NotificationSearchQuery | undefined>();
    expectTypeOf(client.notifications.list).returns.toEqualTypeOf<Promise<Notifications>>();
  });
});

describe('notifications.markRead', () => {
  it('POSTs /notification/{notificationId}/read', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.notifications.markRead(notificationId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/notification/${notificationId}/read`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(result).toBeUndefined();
  });

  it('types markRead as (notificationId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.notifications.markRead).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.notifications.markRead).returns.toEqualTypeOf<Promise<void>>();
  });
});

describe('notifications.markUnread', () => {
  it('POSTs /notification/{notificationId}/unread', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(204) });

    const result = await client.notifications.markUnread(notificationId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/notification/${notificationId}/unread`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(result).toBeUndefined();
  });

  it('types markUnread as (notificationId: string) => Promise<void>', () => {
    const { client } = makeClient();
    expectTypeOf(client.notifications.markUnread).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.notifications.markUnread).returns.toEqualTypeOf<Promise<void>>();
  });
});
