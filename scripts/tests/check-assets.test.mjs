import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkAssets, resourcesInText } from '../check-assets.mjs';

const resources = resourcesInText(`
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E" alt="">
  <img src="https://example.test/image.png" alt="">
  <div style="background-image: url('./local.png')"></div>
`);

assert.deepEqual(resources, ['./local.png', 'https://example.test/image.png']);

const root = mkdtempSync(join(tmpdir(), 'assets-check-'));
const project = join(root, 'projects', 'fixture');
mkdirSync(join(project, 'images'), { recursive: true });
writeFileSync(join(project, 'images', 'placeholder.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
writeFileSync(join(project, 'index.html'), '<img src="images/placeholder.svg" alt="fixture">');
writeFileSync(join(project, 'assets.json'), JSON.stringify({
  schema_version: 1,
  assets: [{ id: 'fixture-placeholder', source: 'local neutral placeholder', rights: 'placeholder', local_path: 'images/placeholder.svg', role: 'fixture', ratio: '1:1' }]
}));

let result = checkAssets('fixture', { root, knownIssuesOverride: {} });
assert.deepEqual(result.errors, [], 'a local placeholder must not require a known-debt exception');
assert.deepEqual(result.warnings, []);

result = checkAssets('fixture', { root, knownIssuesOverride: { fixture: { allow_unknown_rights: true } } });
assert.equal(result.errors.length, 1, 'a present known-debt entry without reason and dates must fail');
assert.match(result.errors[0], /missing a non-empty reason/);

result = checkAssets('fixture', { root, knownIssuesOverride: { fixture: { allow_unknown_rights: true, reason: 'fixture debt', added: 'bad', review_after: '2027-01-01' } } });
assert.equal(result.errors.length, 1, 'invalid known-debt dates must fail');
assert.match(result.errors[0], /missing valid added\/review_after/);

console.log('check-assets tests passed.');
