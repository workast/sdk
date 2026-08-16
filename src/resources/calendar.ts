import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type { CalendarEventSearchQuery, CalendarEvents } from '../types/generated.js';

class CalendarEventsResource {
  constructor(private readonly client: Workast) {}

  /**
   * List user calendar events.
   *
   * @example
   * const results = await workast.calendar.events.list({ from: '2025-10-29', to: '2025-11-05' });
   */
  list(query?: CalendarEventSearchQuery, options?: RequestOptions): Promise<CalendarEvents> {
    const params = new URLSearchParams(options?.query);
    if (query?.from) {
      params.set('from', query.from);
    }
    if (query?.to) {
      params.set('to', query.to);
    }
    if (query?.tzid) {
      params.set('tzid', query.tzid);
    }
    if (query?.attendees) {
      for (const value of query.attendees) {
        params.append('attendees', value);
      }
    }
    return this.client.request(
      'GET',
      '/calendar/events',
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }
}

export class CalendarResource {
  readonly events: CalendarEventsResource;

  constructor(client: Workast) {
    this.events = new CalendarEventsResource(client);
  }
}
