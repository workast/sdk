import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SWAGGER_CANDIDATES = [
  path.resolve(REPO_ROOT, '../workast-api/swagger.yaml'),
  '/Users/guillegette/Apps/workast-api/swagger.yaml',
];

function findSwagger(): string | undefined {
  return SWAGGER_CANDIDATES.find((candidate) => existsSync(candidate));
}

describe('generated types contract', () => {
  const swaggerPath = findSwagger();

  it.skipIf(!swaggerPath)(
    'matches committed openapi.d.ts, generated.ts, and examples.ts',
    async () => {
      const outDir = await mkdtemp(path.join(tmpdir(), 'workast-sdk-types-contract-'));
      try {
        await execFileAsync(
          process.execPath,
          [
            path.join(REPO_ROOT, 'scripts/generate-types.mjs'),
            '--swagger',
            swaggerPath!,
            '--out-dir',
            outDir,
          ],
          { cwd: REPO_ROOT },
        );

        const files = ['openapi.d.ts', 'generated.ts', 'examples.ts'];
        for (const file of files) {
          const [committed, generated] = await Promise.all([
            readFile(path.join(REPO_ROOT, 'src/types', file), 'utf8'),
            readFile(path.join(outDir, file), 'utf8'),
          ]);
          expect(generated).toBe(committed);
        }
      } finally {
        await rm(outDir, { recursive: true, force: true });
      }
    },
    60_000,
  );
});
