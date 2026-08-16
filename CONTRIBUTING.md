# Contributing

Pull requests are welcome. Keep them focused, match the style of the surrounding code, and include tests for behavior you change.

## Setup

Node.js 18+ (this repo’s `.nvmrc` is 20).

```sh
nvm use
npm install
npm test
npm run build
```

Regenerate API types after a Public swagger change:

```sh
npm run generate:types
```

## Releasing

1. Bump `version` in `package.json`.
2. Commit the change, then tag and push:

```sh
git tag vX.Y.Z
git push origin vX.Y.Z
```

The `release` workflow runs tests, publishes to npm, and creates a [GitHub Release](https://github.com/workast/sdk/releases). Prerelease versions (with a `-` in the version, for example `3.0.0-0`) publish under the npm `next` dist-tag and are marked as prereleases on GitHub.
