import type { Workast } from '../client.js';
import type { RequestOptions } from '../request.js';
import type { TokenDetails } from '../types/generated.js';

export class Tokens {
  constructor(private readonly client: Workast) {}

  /**
   * Get the token details.
   *
   * @example
   * const token = await workast.tokens.retrieve();
   */
  retrieve(options?: RequestOptions): Promise<TokenDetails> {
    return this.client.request('GET', '/me', undefined, options);
  }
}
