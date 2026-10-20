import assert from 'node:assert/strict';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repositoryRoot = resolve(import.meta.dirname, '..', '..');
const probePath = resolve(repositoryRoot, 'projects', 'house-store', 'dist', '__check-tokens-probe.css');

function runCheckTokens() {
  const result = spawnSync(process.execPath, ['scripts/check-tokens.mjs'], { cwd: repositoryRoot, encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

try {
  const withoutProbe = runCheckTokens();
  writeFileSync(probePath, '.probe { color: var(--should-not-be-scanned); }', 'utf8');
  const withProbe = runCheckTokens();
  assert.deepEqual(withProbe, withoutProbe, 'projects/*/dist must not affect check:tokens output');
  console.log('check-tokens: output is identical with and without a dist probe.');
} finally {
  if (existsSync(probePath)) rmSync(probePath);
}
