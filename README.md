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
