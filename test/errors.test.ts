import { describe, expect, it } from 'vitest';
import {
  AccountError,
  AuthenticationError,
  PermissionError,
} from '../src/index.js';
import { errorFromResponse } from '../src/errors.js';

const accountErrorCases = [
  {
    status: 401,
    name: 'TeamDeactivatedError',
    message: 'Team is deactivated',
  },
  {
    status: 401,
    name: 'UserDeactivatedError',
    message: 'User is deactivated',
  },
  {
    status: 401,
    name: 'UserSuspendedError',
    message: 'User is suspended',
  },
  {
    status: 403,
    name: 'TeamSuspendedError',
    message: 'Team is suspended',
  },
] as const;

describe('errorFromResponse account errors', () => {
  it.each(accountErrorCases)(
    'maps $status $name to AccountError',
    ({ status, name, message }) => {
      const body = { error: { name, message } };
      const err = errorFromResponse(status, body);

      expect(err).toBeInstanceOf(AccountError);
      expect(err).not.toBeInstanceOf(AuthenticationError);
      expect(err).not.toBeInstanceOf(PermissionError);
      expect((err as AccountError).reason).toBe(name);
      expect(err.message).toBe(message);
      expect(err.status).toBe(status);
    },
  );
});

describe('errorFromResponse fallbacks', () => {
  it('maps 401 UserUnauthorizedError to AuthenticationError', () => {
    const body = { error: { name: 'UserUnauthorizedError', message: 'User unauthorized' } };
    const err = errorFromResponse(401, body);

    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err).not.toBeInstanceOf(AccountError);
  });

  it('maps 403 UserForbiddenError to PermissionError', () => {
    const body = {
      error: {
        name: 'UserForbiddenError',
        message: 'User has no permissions to perform this action',
      },
    };
    const err = errorFromResponse(403, body);

    expect(err).toBeInstanceOf(PermissionError);
    expect(err).not.toBeInstanceOf(AccountError);
  });

  it('maps 401 without error.name to AuthenticationError', () => {
    const body = { error: { message: 'User unauthorized' } };
    const err = errorFromResponse(401, body);

    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err).not.toBeInstanceOf(AccountError);
  });
});
