import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  AuthenticationError,
  NotFoundError,
  PermissionError,
  type TokenDetails,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, jsonResponse, makeClient, mockFetch } from '../helpers.js';

const tokenDetails: TokenDetails = {
  app: { id: 'app-1', name: 'Workast' },
  user: { id: 'user-1', name: 'Ada Lovelace' },
  team: { id: 'team-1', name: 'Acme' },
};

describe('tokens.retrieve', () => {
  it('GETs /me and returns TokenDetails', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, tokenDetails) });

    const result = await client.tokens.retrieve();

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/me`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(result).toEqual(tokenDetails);
  });

  it('types retrieve as () => Promise<TokenDetails>', () => {
    const { client } = makeClient();
    expectTypeOf(client.tokens.retrieve).returns.toEqualTypeOf<Promise<TokenDetails>>();
  });

  it('throws AuthenticationError on 401', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(401, {
      error: { name: 'UserUnauthorizedError', message: 'User unauthorized' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.tokens.retrieve()).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('throws PermissionError on 403', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(403, {
      error: { name: 'SpaceAccessDeniedError', message: 'Access to this space is forbidden' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.tokens.retrieve()).rejects.toBeInstanceOf(PermissionError);
  });

  it('throws NotFoundError on 404', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(404, {
      error: { name: 'NotFoundError', message: 'Not found' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.tokens.retrieve()).rejects.toBeInstanceOf(NotFoundError);
  });
});
