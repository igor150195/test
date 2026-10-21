import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkDocumentation } from '../check-docs.mjs';

const fixture = mkdtempSync(join(tmpdir(), 'check-docs-'));
try {
  const skill = join(fixture, '.agents', 'skills', 'fixture', 'SKILL.md');
  mkdirSync(join(fixture, '.agents', 'skills', 'fixture'), { recursive: true });
  writeFileSync(join(fixture, 'package.json'), JSON.stringify({ scripts: { present: 'node -e ""' } }));
  writeFileSync(skill, '---\nname: fixture\ndescription: fixture\n---\n\n```sh\nnpm run missing\n```\n');
  assert.match(checkDocumentation({ root: fixture, roots: ['.agents/skills'] }).errors.join('\n'), /references missing npm script missing/);
  writeFileSync(skill, '---\nname: fixture\ndescription: fixture\n---\n\n```sh\nnpm run present\n```\n');
  assert.deepEqual(checkDocumentation({ root: fixture, roots: ['.agents/skills'] }).errors, []);
  console.log('check-docs tests passed.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
