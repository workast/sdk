# @workast/sdk

[![npm version](https://img.shields.io/npm/v/@workast/sdk.svg)](https://www.npmjs.com/package/@workast/sdk)
[![CI](https://github.com/workast/sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/workast/sdk/actions/workflows/ci.yml)

TypeScript library for the [Workast API](https://developers.workast.com/). Works in Node.js 18+ and in browsers.

## Installation

```sh
npm install @workast/sdk
```

## Usage

Create a token in Workast under **Preferences → API**. Secret API keys are server-only — passing `apiKey` in a browser throws.

```ts
import { Workast } from '@workast/sdk';

const workast = new Workast({ apiKey: process.env.WORKAST_API_KEY });
// shorthand: new Workast(process.env.WORKAST_API_KEY)

const task = await workast.tasks.create(listId, { text: 'Ship SDK' });
await workast.tasks.complete(task.id);
const page = await workast.tasks.list({
  predicates: [{ type: 'status', attribute: 'status', comparison: 'eq', value: 'pending' }],
});
```

Browser / user session:

```ts
const workast = new Workast({ token: sessionToken });
// or
const workast = new Workast({ getToken: () => auth.getAccessToken() });
```

### Configuration

| Option | Description |
| --- | --- |
| `apiKey` | Secret API token. Server-only. |
| `token` | User or session token. Allowed in browsers. |
| `getToken` | Function that returns a token (sync or async). |
| `baseUrl` | API host. Defaults to `https://api.workast.com`. |
| `headers` | Extra headers (for example `W-USER-ID`, `W-TEAM-ID`). `Authorization` is set by the client. |
| `fetch` | Custom `fetch` implementation. |

`withHeaders(h)` returns a cloned client. `setHeaders(h)` updates the current one.

```ts
const workast = new Workast({
  apiKey: process.env.WORKAST_API_KEY,
  headers: { 'W-USER-ID': userId },
});

await workast.withHeaders({ 'W-USER-ID': otherUserId }).tasks.create(listId, { text: 'Hi' });
workast.setHeaders({ 'W-TEAM-ID': teamId });
```

### Errors

Failed requests throw a subclass of `ApiError`:

| Status | Error |
| --- | --- |
| 400 | `ValidationError` |
| 401 | `AuthenticationError` |
| 403 | `PermissionError` |
| 404 | `NotFoundError` |
| other | `ApiError` |

```ts
import { NotFoundError } from '@workast/sdk';

try {
  await workast.tasks.retrieve(taskId);
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log(err.status, err.body);
  }
}
```

## Resources

`tasks` · `lists` · `fields` · `users` · `searches` · `tags` · `notes` · `notifications` · `meetings` · `calendar.events` · `workflows` · `reactions` · `attachments` · `tokens`

Methods use `create` / `retrieve` / `update` / `list` / `del`, plus domain verbs like `complete` and `assign`. Path ids first, body second, request options last. Types match the [API reference](https://developers.workast.com/).

## Testing

`@workast/sdk/mock` stubs SDK methods on any `Workast` instance (including one your app already constructed). No real HTTP while a mock is active. It also exports `examples`: Public API response fixtures (`examples.task`, `examples.list`, `examples.userResource`, …) generated from the spec. Spread them in `.resolves()` and override the fields your test cares about.

```ts
import { Workast } from '@workast/sdk';
import { examples, mockWorkast } from '@workast/sdk/mock';

const workast = new Workast({ apiKey: process.env.WORKAST_API_KEY });

async function createShipTask() {
  return workast.tasks.create(examples.list.id, { text: examples.task.text });
}

const mock = mockWorkast();
mock.tasks.create.on(examples.list.id, { text: examples.task.text }).resolves({
  ...examples.task,
  text: 'Ship from my test',
});

const created = await createShipTask();

expect(created.text).toBe('Ship from my test');
expect(mock.calls()).toEqual([
  { method: 'tasks.create', args: [examples.list.id, { text: examples.task.text }] },
]);
```

```ts
mock.users.me.on().resolves({ ...examples.userResource, name: 'Ada Lovelace' });
```

`.on(...args)` is a prefix: extra trailing options on the real call still match. Nested objects match regardless of key order. Pass a function for a loose match (`true` → match):

```ts
mock.tasks.create.on(examples.list.id, (body) => body.text === examples.task.text).resolves({
  ...examples.task,
});
```

Queue errors with `.rejects()`. `errors.*` are the same classes the client throws:

```ts
import { AuthenticationError } from '@workast/sdk';
import { errors } from '@workast/sdk/mock';

mock.users.me.on().rejects(errors.unauthorized);
await expect(workast.users.me()).rejects.toBeInstanceOf(AuthenticationError);
```

| Helper | Meaning |
| --- | --- |
| `mock.calls()` | Every SDK call while this mock is active (`{ method, args }`). |
| `mock.pending()` | Interceptors that were not used. |
| `interceptor.wasCalled()` | Whether that `.resolves()` / `.rejects()` fired. |
| `mock.reset()` | Clear queue and calls. Stay intercepting. |
| `mock.restore()` | Unpatch. Later SDK calls hit the real API. |

One mock per test, or one shared mock and `reset()` between tests:

```ts
const mock = mockWorkast();

afterEach(() => mock.reset());
afterAll(() => mock.restore());
```

`mockWorkast()` last-wins: a second call replaces the active queue. Unmatched SDK methods throw and list pending interceptors.

## Upgrading from v2

v3 is a rewrite. The v2 positional constructor, `apiCall`, and generated resource helpers are gone. A string argument is now a secret `apiKey` (server-only), not a session token.

```ts
// v2
const workast = new Workast(process.env.WORKAST_TOKEN);

// v3
const workast = new Workast({ apiKey: process.env.WORKAST_API_KEY });
```

What shipped in each version is on [Releases](https://github.com/workast/sdk/releases).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

MIT
