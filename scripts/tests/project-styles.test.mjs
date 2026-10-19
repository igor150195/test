import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCustomScss, ensureCustomScss } from '../project-styles.mjs';

const fixture = mkdtempSync(join(tmpdir(), 'codex-project-styles-'));

try {
  const firstRun = ensureCustomScss(fixture);
  assert.equal(firstRun.created, true, 'initialisation must create custom.scss');

  const manualNote = '\n/* owner: keep this customization */\n.manual-note { color: inherit; }\n';
  writeFileSync(firstRun.path, readFileSync(firstRun.path, 'utf8') + manualNote, 'utf8');

  const repeatRun = ensureCustomScss(fixture);
  assert.equal(repeatRun.created, false, 'repeat initialisation must preserve custom.scss');
  assert.equal(readFileSync(repeatRun.path, 'utf8').endsWith(manualNote), true, 'owner changes must be unchanged');

  const build = buildCustomScss(fixture, 'css/custom.css');
  assert.equal(existsSync(build.output), true, 'compiled custom CSS must exist');
  assert.match(readFileSync(build.output, 'utf8'), /\.manual-note/, 'compiled CSS must include the owner rule');
  console.log('project-styles: custom.scss preservation and build passed');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
