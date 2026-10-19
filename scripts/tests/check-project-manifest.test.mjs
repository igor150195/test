import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateProjectManifest } from '../check-project-manifest.mjs';

const fixture = mkdtempSync(join(tmpdir(), 'codex-project-manifest-'));
const sha = 'git:2aa53c6efd3d14eaf27f4827e2fbf7f084512796';

try {
  writeFileSync(join(fixture, 'index.html'), '<!doctype html>', 'utf8');
  const valid = {
    schema_version: 1,
    slug: 'fixture-site',
    type: 'test',
    mode: 'brief',
    platform: 'static-html',
    generator_version: sha,
    ds_version: sha,
    pages: [{ id: 'home', source: 'index.html', output: 'index.html', route: '/' }],
    files: [{ path: 'css/custom.css', owner: 'generated' }],
    external_dependencies: []
  };
  assert.deepEqual(validateProjectManifest(valid, fixture), [], 'valid manifest must pass');
  const invalid = { ...valid, files: [{ path: 'css/custom.css', owner: 'legacy' }] };
  assert.match(validateProjectManifest(invalid, fixture).join('\n'), /owner generated\|owner/, 'invalid owner must fail');
  console.log('check-project-manifest: schema contract passed');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
