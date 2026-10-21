import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { repositoryRoot, searchCatalog, validateCatalog } from '../catalog-utils.mjs';
import { noMatchingEntriesMessage, parseCatalogSearchArgs } from '../catalog-search.mjs';

const schema = JSON.parse(readFileSync(resolve(repositoryRoot, 'schemas/catalog-entry.schema.json'), 'utf8'));
const base = {
  id: 'DSC-fixture', kind: 'component', maturity: 'stable', platform: 'neutral', purpose: 'fixture button',
  classes: ['.ds-button'], structural_classes: [], variants: [], requires: { components: [] },
  public_tokens: [], optional_tokens: [], a11y: ['native-button'], viewports_verified: [], examples: ['design-system/templates/home.html']
};
const record = (entry = base, uses_tokens = ['--primary']) => ({ entry, source: 'fixture/index.md', uses_tokens });

let result = validateCatalog({ entries: [record({ ...base, public_tokens: ['--catalog-missing-token'] }, ['--catalog-missing-token'])] });
assert.match(result.errors.join('\n'), /undefined token --catalog-missing-token/);

result = validateCatalog({ entries: [record({ ...base, classes: ['.ds-not-in-dist'] })] });
assert.match(result.errors.join('\n'), /CSS class not in dist/);

result = validateCatalog({
  entries: [],
  contract: { css: '.ds-orphan {}', classes: new Set(['ds-orphan']), tokens: new Set() },
  knownGaps: { 'ds-orphan': { reason: 'fixture known gap', added: '2026-10-21', review_after: '2027-01-19' } },
  structuralContracts: {}
});
assert.equal(result.errors.length, 0);
assert.match(result.warnings.join('\n'), /known catalog gap: .ds-orphan/);

result = validateCatalog({ entries: [record({ ...base, examples: ['package.json'] })] });
assert.match(result.errors.join('\n'), /contains none of this entry's classes/);

result = validateCatalog({ entries: [record({ ...base, public_tokens: ['--primary'] }, [])] });
assert.match(result.errors.join('\n'), /public_tokens --primary is not used/);

const found = searchCatalog([{ ...base, source: 'fixture/index.md', uses_tokens: ['--primary'] }], { kind: ['component'], maturity: [], platform: [], className: ['.ds-button'], purpose: ['button'], token: ['--primary'], a11y: ['native-button'] });
assert.equal(found.length, 1);
assert.equal(schema.$defs.a11yValue.enum.includes('focus-visible'), true);
assert.match(noMatchingEntriesMessage, /^No matching entries\. Retry by purpose\/kind\/token\/a11y filters;/);
assert.deepEqual(parseCatalogSearchArgs(['node', 'catalog-search.mjs', '--purpose', 'button']).purpose, ['button']);
assert.throws(() => parseCatalogSearchArgs(['node', 'catalog-search.mjs', '--unknown', 'value']), /unsupported flag --unknown/);
assert.throws(() => parseCatalogSearchArgs(['node', 'catalog-search.mjs', '--purpose']), /--purpose requires a value/);

for (const script of ['scripts/catalog-build.mjs', 'scripts/kb-build.mjs']) {
  const run = spawnSync(process.execPath, [script, '--check'], { cwd: repositoryRoot, encoding: 'utf8' });
  assert.equal(run.status, 0, `${script} --check must pass`);
  assert.doesNotMatch(`${run.stdout}\n${run.stderr}`, /known (catalog )?gap/i, `${script} --check must not list known gaps`);
}
console.log('catalog tests passed.');
