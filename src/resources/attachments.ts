import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type { AttachmentFileUrl, AttachmentFileUrlQuery } from '../types/generated.js';

export class Attachments {
  constructor(private readonly client: Workast) {}

  /**
   * Get a signed URL to download an attachment file.
   * Requires `file:find`.
   *
   * @example
   * const attachment = await workast.attachments.retrieveFileUrl('attachment-id');
   */
  retrieveFileUrl(
    attachmentId: string,
    query?: AttachmentFileUrlQuery,
    options?: RequestOptions,
  ): Promise<AttachmentFileUrl> {
    const params = new URLSearchParams(options?.query);
    if (query?.download != null) {
      params.set('download', String(query.download));
    }
    return this.client.request(
      'GET',
      `/attachment/${encodeURIComponent(attachmentId)}/file`,
      undefined,
      params.toString() ? { ...options, query: params } : options,
    );
  }
}
