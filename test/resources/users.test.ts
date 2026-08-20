import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  UserByEmailQuery,
  UserDetail,
  UserDetailWithTeam,
  UserInvite,
  UserResource,
  UserSearchQuery,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, makeClient, mockFetch } from '../helpers.js';

const userId = 'user-1';
const email = 'ada@example.com';
const userDetail: UserDetail = {
  id: userId,
  name: 'Ada Lovelace',
  userName: 'ada',
  email,
};
const userResource: UserResource = {
  id: userId,
  name: 'Ada Lovelace',
  userName: 'ada',
  email,
};
const userByEmail: UserDetailWithTeam = {
  ...userDetail,
  team: { id: 'team-1', name: 'Workast' },
};

describe('users.me', () => {
  it('GETs /user/me and returns UserResource', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, userResource) });

    const user = await client.users.me();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/user/me`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(user).toEqual(userResource);
  });

  it('types me as () => Promise<UserResource>', () => {
    const { client } = makeClient();
    expectTypeOf(client.users.me).returns.toEqualTypeOf<Promise<UserResource>>();
  });
});

describe('users.list', () => {
  const listed: UserDetail[] = [userDetail];

  it('GETs /user with query and returns UserDetail[]', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });
    const query: UserSearchQuery = {
      name: 'Ada',
      email,
      slackUserId: 'U1',
      webexUserId: 'W1',
      random: 3,
      status: 'active',
      role: 'admin',
      sort: 'name',
      limit: 10,
      offset: 5,
    };

    const users = await client.users.list(query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/user?name=Ada&email=${encodeURIComponent(email)}&slackUserId=U1&webexUserId=W1&random=3&status=active&role=admin&sort=name&limit=10&offset=5`,
    );
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(users).toEqual(listed);
  });

  it('GETs /user without query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, listed) });

    await client.users.list();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/user`);
    expect(request.body).toBeUndefined();
  });

  it('types list as (query?: UserSearchQuery) => Promise<UserDetail[]>', () => {
    const { client } = makeClient();
    expectTypeOf(client.users.list).parameter(0).toEqualTypeOf<UserSearchQuery | undefined>();
    expectTypeOf(client.users.list).returns.toEqualTypeOf<Promise<UserDetail[]>>();
  });
});

describe('users.retrieve', () => {
  it('GETs /user/{userId} and returns UserDetail', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, userDetail) });

    const user = await client.users.retrieve(userId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/user/${userId}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(user).toEqual(userDetail);
  });

  it('types retrieve as (userId: string) => Promise<UserDetail>', () => {
    const { client } = makeClient();
    expectTypeOf(client.users.retrieve).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.users.retrieve).returns.toEqualTypeOf<Promise<UserDetail>>();
  });
});

describe('users.retrieveByEmail', () => {
  it('GETs /user/email/{email} and returns UserDetailWithTeam', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, userByEmail) });

    const user = await client.users.retrieveByEmail(email);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/user/email/${encodeURIComponent(email)}`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(user).toEqual(userByEmail);
  });

  it('GETs /user/email/{email} with platform query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, userByEmail) });
    const query: UserByEmailQuery = { platform: 'slack' };

    await client.users.retrieveByEmail(email, query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(
      `${DEFAULT_BASE_URL}/user/email/${encodeURIComponent(email)}?platform=slack`,
    );
    expect(request.body).toBeUndefined();
  });

  it('types retrieveByEmail as (email: string, query?: UserByEmailQuery) => Promise<UserDetailWithTeam>', () => {
    const { client } = makeClient();
    expectTypeOf(client.users.retrieveByEmail).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.users.retrieveByEmail).parameter(1).toEqualTypeOf<UserByEmailQuery | undefined>();
    expectTypeOf(client.users.retrieveByEmail).returns.toEqualTypeOf<Promise<UserDetailWithTeam>>();
  });
});

describe('users.invite', () => {
  it('POSTs UserInvite to /user/invite and returns UserDetail', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(201, userDetail) });
    const body: UserInvite = { name: 'Ada Lovelace', email, role: 'member' };

    const user = await client.users.invite(body);

    const request = getRequest(fetch);
    expect(request.method).toBe('POST');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/user/invite`);
    expect(request.body).toEqual(body);
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    expect(user).toEqual(userDetail);
  });

  it('types invite as (body: UserInvite) => Promise<UserDetail>', () => {
    const { client } = makeClient();
    expectTypeOf(client.users.invite).parameter(0).toEqualTypeOf<UserInvite>();
    expectTypeOf(client.users.invite).returns.toEqualTypeOf<Promise<UserDetail>>();
  });
});
