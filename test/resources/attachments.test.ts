import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  AuthenticationError,
  NotFoundError,
  PermissionError,
  ValidationError,
  type AttachmentFileUrl,
  type AttachmentFileUrlQuery,
} from '../../src/index.js';
import { DEFAULT_BASE_URL, getRequest, jsonResponse, makeClient, mockFetch } from '../helpers.js';

const attachmentId = 'attachment-1';
const attachmentFileUrl: AttachmentFileUrl = {
  id: attachmentId,
  file: { name: 'spec.pdf' },
  link: 'https://cdn.workast.io/spec.pdf',
  fileUrl: 'https://cdn.workast.io/signed/spec.pdf',
};

describe('attachments.retrieveFileUrl', () => {
  it('GETs /attachment/{attachmentId}/file and returns AttachmentFileUrl', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, attachmentFileUrl) });

    const result = await client.attachments.retrieveFileUrl(attachmentId);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/attachment/${attachmentId}/file`);
    expect(request.body).toBeUndefined();
    expect(request.headers.get('Authorization')).toBe('Bearer test-api-key');
    expect(request.headers.get('Content-Type')).toBeNull();
    expect(result).toEqual(attachmentFileUrl);
  });

  it('GETs /attachment/{attachmentId}/file with download query', async () => {
    const { client, fetch } = makeClient({ fetch: mockFetch(200, attachmentFileUrl) });
    const query: AttachmentFileUrlQuery = { download: true };

    await client.attachments.retrieveFileUrl(attachmentId, query);

    const request = getRequest(fetch);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${DEFAULT_BASE_URL}/attachment/${attachmentId}/file?download=true`);
    expect(request.body).toBeUndefined();
  });

  it('types retrieveFileUrl as (attachmentId: string, query?: AttachmentFileUrlQuery) => Promise<AttachmentFileUrl>', () => {
    const { client } = makeClient();
    expectTypeOf(client.attachments.retrieveFileUrl).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(client.attachments.retrieveFileUrl).parameter(1).toEqualTypeOf<AttachmentFileUrlQuery | undefined>();
    expectTypeOf(client.attachments.retrieveFileUrl).returns.toEqualTypeOf<Promise<AttachmentFileUrl>>();
  });

  it('throws ValidationError on 400', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(400, {
      error: 'Bad request.',
      message: 'attachmentId is invalid',
    }));
    const { client } = makeClient({ fetch });
    await expect(client.attachments.retrieveFileUrl(attachmentId))
      .rejects
      .toBeInstanceOf(ValidationError);
  });

  it('throws AuthenticationError on 401', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(401, {
      error: { name: 'UserUnauthorizedError', message: 'User unauthorized' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.attachments.retrieveFileUrl(attachmentId))
      .rejects
      .toBeInstanceOf(AuthenticationError);
  });

  it('throws PermissionError on 403', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(403, {
      error: { name: 'SpaceAccessDeniedError', message: 'Access to this space is forbidden' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.attachments.retrieveFileUrl(attachmentId))
      .rejects
      .toBeInstanceOf(PermissionError);
  });

  it('throws NotFoundError on 404', async () => {
    const fetch = mockFetch();
    fetch.mockResolvedValueOnce(jsonResponse(404, {
      error: { name: 'AttachmentNotFoundError', message: 'The attachment does not exist' },
    }));
    const { client } = makeClient({ fetch });
    await expect(client.attachments.retrieveFileUrl(attachmentId))
      .rejects
      .toBeInstanceOf(NotFoundError);
  });
});
