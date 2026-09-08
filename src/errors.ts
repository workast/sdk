export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string, status = 401, body?: unknown) {
    super(message, status, body);
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends ApiError {
  constructor(message: string, status = 403, body?: unknown) {
    super(message, status, body);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, status = 404, body?: unknown) {
    super(message, status, body);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, status = 400, body?: unknown) {
    super(message, status, body);
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends Error {
  readonly timeout: number;

  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}

export function errorFromResponse(status: number, body: unknown): ApiError {
  const message = messageFromBody(body) ?? `Request failed with status ${status}`;
  switch (status) {
    case 400:
      return new ValidationError(message, status, body);
    case 401:
      return new AuthenticationError(message, status, body);
    case 403:
      return new PermissionError(message, status, body);
    case 404:
      return new NotFoundError(message, status, body);
    default:
      return new ApiError(message, status, body);
  }
}

function messageFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }
  const { error, message } = body as { error?: unknown; message?: unknown };
  if (typeof error === 'string') {
    return typeof message === 'string' ? message : error;
  }
  if (error && typeof error === 'object') {
    const nested = error as { message?: unknown };
    if (typeof nested.message === 'string') {
      return nested.message;
    }
  }
  if (typeof message === 'string') {
    return message;
  }
  return undefined;
}
