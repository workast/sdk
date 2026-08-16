import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  CalendarEvent,
  CalendarEventSearchQuery,
  CalendarEvents,
  MeetingMinimalResource,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from '../helpers.js';

const organizer = {
  id: 'user-1',
  name: 'Ada Lovelace',
  userName: 'ada',
  confirmed: true,
  avatar: 'https://cdn.workast.io/ada.png',
  costCenter: { id: 'cc-1' },
};
const meeting: MeetingMinimalResource = {
  id: 'meeting-1',
  organizer,
  totalAttendees: 2,
  someAttendees: [organizer],
  link: 'https://open.workast.app/meeting/meeting-1',
  isRecurrent: false,
  summary: 'Standup',
};
const event: CalendarEvent = {
  id: 'evt-1',
  meeting,
  title: 'Standup',
  when: {
    object: 'timespan',
    startTime: 1776205800,
    endTime: 1776211200,
  },
};
const listed: CalendarEvents = { events: [event] };

describe('calendar.events.list', () => {
  it('GETs /calendar/events with query and returns CalendarEvents', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });
    const query: CalendarEventSearchQuery = {
      from: '2025-10-29',
      to: '2025-11-05',
      tzid: 'America/Los_Angeles',
      attendees: ['a@x.com', 'b@x.com'],
    };

    const result = await client.calendar.events.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/calendar/events?from=2025-10-29&to=2025-11-05&tzid=America%2FLos_Angeles&attendees=a%40x.com&attendees=b%40x.com`,
    );
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toEqual(listed);
  });

  it('GETs /calendar/events without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });

    await client.calendar.events.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/calendar/events`);
    expect(request.body).toBeUndefined();
  });

  it('types list as (query?: CalendarEventSearchQuery) => Promise<CalendarEvents>', () => {
    const { client } = makeClient();
    expectTypeOf(client.calendar.events.list)
      .parameter(0)
      .toEqualTypeOf<CalendarEventSearchQuery | undefined>();
    expectTypeOf(client.calendar.events.list).returns.toEqualTypeOf<Promise<CalendarEvents>>();
  });
});
