import { Workast } from './client.js';
import {
  AuthenticationError,
  NotFoundError,
  PermissionError,
  ValidationError,
} from './errors.js';

export const errors = {
  unauthorized: new AuthenticationError('Unauthorized'),
  forbidden: new PermissionError('Forbidden'),
  notFound: new NotFoundError('Not found'),
  validation: new ValidationError('Validation failed'),
};

export * as examples from './types/examples.js';

type CallRecord = { method: string; args: unknown[] };

type Interceptor = {
  method: string;
  expectedArgs: unknown[];
  used: boolean;
  error: Error | undefined;
  value: unknown;
  wasCalled(): boolean;
};

type Session = {
  calls: CallRecord[];
  interceptors: Interceptor[];
};

const ROOT_KEYS = new Set(['calls', 'pending', 'reset', 'restore']);

let active: Session | null = null;
const patches: { proto: Record<string, unknown>; key: string; original: Function }[] = [];

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      result[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return result;
  }
  return value;
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function argsMatch(expected: unknown[], actual: unknown[]): boolean {
  if (expected.length === 1 && typeof expected[0] === 'function') {
    return expected[0](...actual) === true;
  }
  if (expected.length > actual.length) {
    return false;
  }
  for (let i = 0; i < expected.length; i += 1) {
    const slot = expected[i];
    if (typeof slot === 'function') {
      if (slot(actual[i]) !== true) {
        return false;
      }
    } else if (!valuesEqual(slot, actual[i])) {
      return false;
    }
  }
  return true;
}

function findInterceptor(session: Session, method: string, actual: unknown[]): Interceptor | undefined {
  return session.interceptors.find(
    (interceptor) =>
      !interceptor.used && interceptor.method === method && argsMatch(interceptor.expectedArgs, actual),
  );
}

function pendingMethods(session: Session): string[] {
  return session.interceptors.filter((interceptor) => !interceptor.used).map((interceptor) => interceptor.method);
}

function wrapMethod(proto: object, key: string, method: string): void {
  const record = proto as Record<string, unknown>;
  const original = record[key];
  if (typeof original !== 'function') {
    return;
  }
  if (patches.some((patch) => patch.proto === record && patch.key === key)) {
    return;
  }

  record[key] = async function patched(this: unknown, ...args: unknown[]) {
    if (!active) {
      return original.apply(this, args);
    }
    active.calls.push({ method, args });
    const interceptor = findInterceptor(active, method, args);
    if (!interceptor) {
      const pending = pendingMethods(active).join(', ') || '(none)';
      throw new Error(`No pending interceptor for ${method}. Pending: ${pending}`);
    }
    interceptor.used = true;
    if (interceptor.error) {
      throw interceptor.error;
    }
    return interceptor.value;
  };

  patches.push({ proto: record, key, original });
}

function isNestedResource(value: unknown): value is object {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto !== Object.prototype && proto !== null;
}

function walkResource(obj: object, path: string[]): void {
  const proto = Object.getPrototypeOf(obj);
  if (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') {
        continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      if (descriptor && typeof descriptor.value === 'function') {
        wrapMethod(proto, key, [...path, key].join('.'));
      }
    }
  }

  for (const key of Object.keys(obj)) {
    const value = (obj as Record<string, unknown>)[key];
    if (typeof value === 'function' || value instanceof Workast) {
      continue;
    }
    if (isNestedResource(value)) {
      walkResource(value, [...path, key]);
    }
  }
}

function patchPrototypes(): void {
  if (patches.length > 0) {
    return;
  }
  const probe = new Workast({
    apiKey: 'test-api-key',
    fetch: () => Promise.resolve(new Response(null, { status: 204 })),
  });
  for (const key of Object.keys(probe)) {
    const value = (probe as unknown as Record<string, unknown>)[key];
    if (typeof value === 'function' || value instanceof Workast) {
      continue;
    }
    if (isNestedResource(value)) {
      walkResource(value, [key]);
    }
  }
}

function unpatchPrototypes(): void {
  for (const { proto, key, original } of patches) {
    proto[key] = original;
  }
  patches.length = 0;
}

function addInterceptor(
  session: Session,
  method: string,
  expectedArgs: unknown[],
  error: Error | undefined,
  value: unknown,
): Interceptor {
  const interceptor: Interceptor = {
    method,
    expectedArgs,
    used: false,
    error,
    value,
    wasCalled() {
      return interceptor.used;
    },
  };
  session.interceptors.push(interceptor);
  return interceptor;
}

function registrar(session: Session, path: string[]) {
  const method = path.join('.');
  return {
    on(...expectedArgs: unknown[]) {
      return {
        resolves(value?: unknown) {
          return addInterceptor(session, method, expectedArgs, undefined, value);
        },
        rejects(error: Error) {
          return addInterceptor(session, method, expectedArgs, error, undefined);
        },
      };
    },
  };
}

function resourceTree(session: Session, path: string[]): unknown {
  return new Proxy(registrar(session, path), {
    get(target, prop) {
      if (prop === 'on') {
        return target.on;
      }
      if (typeof prop !== 'string') {
        return undefined;
      }
      return resourceTree(session, [...path, prop]);
    },
  });
}

type Registrar = {
  on(...expectedArgs: unknown[]): {
    resolves(value?: unknown): { wasCalled(): boolean };
    rejects(error: Error): { wasCalled(): boolean };
  };
};

type MockTree<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown
    ? Registrar
    : T[K] extends object
      ? MockTree<T[K]>
      : never;
};

type MockWorkast = MockTree<Workast> & {
  calls(): CallRecord[];
  pending(): { wasCalled(): boolean }[];
  reset(): void;
  restore(): void;
};

export function mockWorkast(): MockWorkast {
  patchPrototypes();

  const session: Session = {
    calls: [],
    interceptors: [],
  };
  active = session;

  const api = {
    calls() {
      return session.calls;
    },
    pending() {
      return session.interceptors.filter((interceptor) => !interceptor.used);
    },
    reset() {
      for (const interceptor of session.interceptors) {
        interceptor.used = false;
      }
      session.interceptors.length = 0;
      session.calls.length = 0;
    },
    restore() {
      api.reset();
      unpatchPrototypes();
      active = null;
    },
  };

  return new Proxy(api, {
    get(target, prop) {
      if (typeof prop === 'string' && ROOT_KEYS.has(prop)) {
        return target[prop as keyof typeof api];
      }
      if (typeof prop !== 'string') {
        return undefined;
      }
      return resourceTree(session, [prop]);
    },
  }) as unknown as MockWorkast;
}
