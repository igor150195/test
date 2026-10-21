import assert from 'node:assert/strict';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { structuralClassParentViolations } from '../css-contracts.mjs';

const repositoryRoot = resolve(import.meta.dirname, '..', '..');
const probePath = resolve(repositoryRoot, 'projects', 'house-store', 'dist', '__check-tokens-probe.css');

function runCheckTokens() {
  const result = spawnSync(process.execPath, ['scripts/check-tokens.mjs'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });
  assert.equal(result.error, undefined, `check:tokens child process failed to start: ${result.error?.message ?? 'unknown error'}`);
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

const validFooter = '<nav class="ds-footer__columns"><section class="ds-footer__column"></section></nav>';
const orphanFooterColumn = '<section class="ds-footer__column"></section>';
assert.deepEqual(
  structuralClassParentViolations(validFooter, 'ds-footer__column', 'ds-footer__columns'),
  [],
  'documented ds-footer__column structure must pass without its own CSS selector'
);
assert.equal(
  structuralClassParentViolations(orphanFooterColumn, 'ds-footer__column', 'ds-footer__columns').length,
  1,
  'ds-footer__column without ds-footer__columns parent must be reported as an error by check:tokens'
);
console.log('check-tokens: structural Footer contract accepts its documented parent and rejects an orphan column.');
