import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  Meeting,
  MeetingCreate,
  MeetingMinimalResource,
  MeetingResource,
  MeetingNotetakerEnable,
  MeetingPatch,
  MeetingRecordingResource,
  MeetingSearchQuery,
  Meetings,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from '../helpers.js';

const meetingId = 'meeting-1';
const organizer = {
  id: 'user-1',
  name: 'Ada Lovelace',
  userName: 'ada',
  confirmed: true,
  avatar: 'https://cdn.workast.io/ada.png',
  costCenter: 'cc-1',
};
const list = {
  id: 'list-1',
  name: 'Engineering',
  status: 'active' as const,
  privacy: 'private' as const,
  link: 'https://open.workast.app/space/list-1',
};
const createdMeeting: Meeting = {
  id: meetingId,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
  status: 'active',
  organizer,
  totalAttendees: 2,
  someAttendees: [organizer],
  list,
  link: 'https://open.workast.app/meeting/meeting-1',
  isRecurrent: false,
  summary: 'Standup',
};
const meetingDetail: MeetingResource = { ...createdMeeting, notes: 'Ship v3' };
const meetingMinimal: MeetingMinimalResource = {
  id: meetingId,
  organizer,
  totalAttendees: 2,
  someAttendees: [organizer],
  link: createdMeeting.link,
  isRecurrent: false,
  summary: 'Standup',
};
const listed: Meetings = { meetings: [meetingMinimal], nextPageToken: null };
const recording: MeetingRecordingResource = {
  media: { recordingUrl: 'https://cdn.workast.io/rec.mp4' },
};

describe('meetings.list', () => {
  it('GETs /meeting with query and returns Meetings', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });
    const query: MeetingSearchQuery = {
      timeMin: '2011-06-03T10:00:00-07:00',
      timeMax: '2011-06-04T10:00:00-07:00',
      maxResults: 15,
      pageToken: 'cursor-1',
      attendees: ['user-1', 'user-2'],
    };

    const result = await client.meetings.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/meeting?timeMin=2011-06-03T10%3A00%3A00-07%3A00&timeMax=2011-06-04T10%3A00%3A00-07%3A00&maxResults=15&pageToken=cursor-1&attendees=user-1&attendees=user-2`,
    );
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(result).toEqual(listed);
  });

  it('GETs /meeting without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });

    await client.meetings.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/meeting`);
    expect(request.body).toBeUndefined();
  });

  it('types list as (query?: MeetingSearchQuery) => Promise<Meetings>', () => {
    const { client } = makeClient();
    expectTypeOf(client.meetings.list).parameter(0).toEqualTypeOf<MeetingSearchQuery | undefined>();
    expectTypeOf(client.meetings.list).returns.toEqualTypeOf<Promise<Meetings>>();
  });
});

describe('meetings.createFromEvent', () => {
  it('POSTs MeetingCreate to /meeting and returns Meeting', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(201, createdMeeting) });
    const body: MeetingCreate = { listId: 'list-1', summary: 'Standup', eventId: 'evt-1' };

    const meeting = await client.meetings.createFromEvent(body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/meeting`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    expect(meeting).toEqual(createdMeeting);
  });

  it('types createFromEvent as (body: MeetingCreate) => Promise<Meeting>', () => {
    const { client } = makeClient();
    expectTypeOf(client.meetings.createFromEvent).parameter(0).toEqualTypeOf<MeetingCreate>();
    expectTypeOf(client.meetings.createFromEvent).returns.toEqualTypeOf<Promise<Meeting>>();
  });
});

describe('meetings.retrieve', () => {
  it('GETs /meeting/{meetingId} and returns MeetingResource', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, meetingDetail) });

    const meeting = await client.meetings.retrieve(meetingId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/meeting/${meetingId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(meeting).toEqual(meetingDetail);
  });

  it('types retrieve as (meetingId: string) => Promise<MeetingResource>', () => {
    const { client } = makeClient();
    expectTypeOf(client.meetings.retrieve).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.meetings.retrieve).returns.toEqualTypeOf<Promise<MeetingResource>>();
  });
});

describe('meetings.update', () => {
  it('PATCHes MeetingPatch to /meeting/{meetingId} and returns MeetingResource', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, meetingDetail) });
    const body: MeetingPatch = { notes: 'Ship v3' };

    const meeting = await client.meetings.update(meetingId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('PATCH');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/meeting/${meetingId}`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(meeting).toEqual(meetingDetail);
  });

  it('types update as (meetingId: string, body: MeetingPatch) => Promise<MeetingResource>', () => {
    const { client } = makeClient();
    expectTypeOf(client.meetings.update).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.meetings.update).parameter(1).toEqualTypeOf<MeetingPatch>();
    expectTypeOf(client.meetings.update).returns.toEqualTypeOf<Promise<MeetingResource>>();
  });
});

describe('meetings.retrieveRecording', () => {
  it('GETs /meeting/{meetingId}/recording and returns MeetingRecordingResource', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, recording) });

    const result = await client.meetings.retrieveRecording(meetingId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/meeting/${meetingId}/recording`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(result).toEqual(recording);
  });

  it('types retrieveRecording as (meetingId: string) => Promise<MeetingRecordingResource>', () => {
    const { client } = makeClient();
    expectTypeOf(client.meetings.retrieveRecording).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.meetings.retrieveRecording).returns.toEqualTypeOf<Promise<MeetingRecordingResource>>();
  });
});

describe('meetings.enableNotetaker', () => {
  it('POSTs MeetingNotetakerEnable to /meeting/{meetingId}/notetaker and returns Meeting', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdMeeting) });
    const body: MeetingNotetakerEnable = { joinUrl: 'https://meet.example.com/abc' };

    const meeting = await client.meetings.enableNotetaker(meetingId, body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/meeting/${meetingId}/notetaker`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(meeting).toEqual(createdMeeting);
  });

  it('POSTs /meeting/{meetingId}/notetaker without body', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdMeeting) });

    await client.meetings.enableNotetaker(meetingId);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/meeting/${meetingId}/notetaker`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Content-Type')).toBeNull();
  });

  it('types enableNotetaker as (meetingId: string, body?: MeetingNotetakerEnable) => Promise<Meeting>', () => {
    const { client } = makeClient();
    expectTypeOf(client.meetings.enableNotetaker).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.meetings.enableNotetaker).parameter(1).toEqualTypeOf<MeetingNotetakerEnable | undefined>();
    expectTypeOf(client.meetings.enableNotetaker).returns.toEqualTypeOf<Promise<Meeting>>();
  });
});

describe('meetings.disableNotetaker', () => {
  it('DELETEs /meeting/{meetingId}/notetaker and returns Meeting', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, createdMeeting) });

    const meeting = await client.meetings.disableNotetaker(meetingId);

    const request = getRequest(fetch);
    expect(request.method).toBe('DELETE');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/meeting/${meetingId}/notetaker`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(meeting).toEqual(createdMeeting);
  });

  it('types disableNotetaker as (meetingId: string) => Promise<Meeting>', () => {
    const { client } = makeClient();
    expectTypeOf(client.meetings.disableNotetaker).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.meetings.disableNotetaker).returns.toEqualTypeOf<Promise<Meeting>>();
  });
});
