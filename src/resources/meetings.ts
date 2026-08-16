import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type {
  Meeting,
  MeetingCreate,
  MeetingDetail,
  MeetingNotetakerEnable,
  MeetingPatch,
  MeetingRecordingResource,
  MeetingSearchQuery,
  Meetings,
} from '../types/generated.js';

export class MeetingsResource {
  constructor(private readonly client: Workast) {}

  /**
   * List meetings.
   *
   * @example
   * const results = await workast.meetings.list({ timeMin: '2026-01-01T00:00:00Z', maxResults: 15 });
   */
  list(query?: MeetingSearchQuery, options?: RequestOptions): Promise<Meetings> {
    const params = new URLSearchParams(options?.query);
    if (query?.timeMin) {
      params.set('timeMin', query.timeMin);
    }
    if (query?.timeMax) {
      params.set('timeMax', query.timeMax);
    }
    if (query?.maxResults != null) {
      params.set('maxResults', String(query.maxResults));
    }
    if (query?.pageToken) {
      params.set('pageToken', query.pageToken);
    }
    if (query?.attendees) {
      for (const value of query.attendees) {
        params.append('attendees', value);
      }
    }
    return this.client.request(
      'GET',
      '/meeting',
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }

  /**
   * Create a meeting from a calendar event, or create a new calendar event.
   *
   * @example
   * const meeting = await workast.meetings.createFromEvent({
   *   listId: 'list-id',
   *   summary: 'Standup',
   *   eventId: 'evt-1',
   * });
   */
  createFromEvent(body: MeetingCreate, options?: RequestOptions): Promise<Meeting> {
    return this.client.request('POST', '/meeting', body, options);
  }

  /**
   * Get a meeting by ID.
   *
   * @example
   * const meeting = await workast.meetings.retrieve('meeting-id');
   */
  retrieve(meetingId: string, options?: RequestOptions): Promise<MeetingDetail> {
    return this.client.request('GET', `/meeting/${encodeURIComponent(meetingId)}`, undefined, options);
  }

  /**
   * Update meeting notes.
   *
   * @example
   * const meeting = await workast.meetings.update('meeting-id', { notes: 'Ship v3' });
   */
  update(meetingId: string, body: MeetingPatch, options?: RequestOptions): Promise<MeetingDetail> {
    return this.client.request('PATCH', `/meeting/${encodeURIComponent(meetingId)}`, body, options);
  }

  /**
   * Get meeting recording assets and transcript.
   *
   * @example
   * const recording = await workast.meetings.retrieveRecording('meeting-id');
   */
  retrieveRecording(meetingId: string, options?: RequestOptions): Promise<MeetingRecordingResource> {
    return this.client.request(
      'GET',
      `/meeting/${encodeURIComponent(meetingId)}/recording`,
      undefined,
      options,
    );
  }

  /**
   * Enable the notetaker for a meeting.
   *
   * @example
   * const meeting = await workast.meetings.enableNotetaker('meeting-id', {
   *   joinUrl: 'https://meet.example.com/abc',
   * });
   */
  enableNotetaker(
    meetingId: string,
    body?: MeetingNotetakerEnable,
    options?: RequestOptions,
  ): Promise<Meeting> {
    return this.client.request(
      'POST',
      `/meeting/${encodeURIComponent(meetingId)}/notetaker`,
      body,
      options,
    );
  }

  /**
   * Disable or remove the notetaker from a meeting.
   *
   * @example
   * const meeting = await workast.meetings.disableNotetaker('meeting-id');
   */
  disableNotetaker(meetingId: string, options?: RequestOptions): Promise<Meeting> {
    return this.client.request(
      'DELETE',
      `/meeting/${encodeURIComponent(meetingId)}/notetaker`,
      undefined,
      options,
    );
  }
}
