import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseKnowledgeFrontmatter, repositoryRoot, validateKnowledge } from '../kb-utils.mjs';
import { searchKnowledgeEntries } from '../kb-search.mjs';

const valid = `---\nid: KBP-9999\ntitle: Test\nkind: technical\nstatus: candidate\nscope: universal\nplatform: neutral\nindustry: []\npage_types: [home]\ntags: [test]\nrequires:\n  components: [.ds-button]\n  tokens: [--primary]\n  optional_tokens: [--focus_ring_color]\nvariants: []\ndata_needed: []\nviewports_checked: [390x844]\nevidence:\n  implementation: scripts/kb-utils.mjs\n  technical_check: scripts/kb-utils.mjs\n  visual_check: scripts/kb-utils.mjs\n  projects: [test]\n  limitations: [fixture]\nreview_after: 2027-01-01\nsupersedes: []\napplies_when: [test]\nnot_when: [never]\n---\n`;

for (const [name, snippet] of Object.entries({
  anchor: 'title: &title Test',
  multiline: 'title: |',
  deep: 'requires:\n  components:\n    - .ds-button',
  unknownType: 'tags: { bad: map }'
})) {
  assert.throws(() => parseKnowledgeFrontmatter(valid.replace('title: Test', snippet), `${name}.md`), new RegExp(`${name}\.md:`), `${name} must fail with a source line`);
}
assert.equal(parseKnowledgeFrontmatter(valid, 'valid.md').requires.optional_tokens[0], '--focus_ring_color');

const fixture = mkdtempSync(join(tmpdir(), 'kb-fixture-'));
try {
  const root = resolve(fixture, 'knowledge');
  const patterns = resolve(root, 'patterns');
  const repo = resolve(fixture, 'repo');
  const fs = await import('node:fs');
  fs.mkdirSync(patterns, { recursive: true });
  fs.mkdirSync(resolve(repo, 'dist/css'), { recursive: true });
  fs.mkdirSync(resolve(repo, 'scripts'), { recursive: true });
  writeFileSync(resolve(repo, 'dist/css/contracts.css'), ':root { --primary: #000; } .ds-button {}');
  writeFileSync(resolve(repo, 'scripts/evidence.mjs'), '');
  const entry = valid.replaceAll('scripts/kb-utils.mjs', 'scripts/evidence.mjs');
  writeFileSync(resolve(patterns, 'one.md'), entry);
  assert.deepEqual(validateKnowledge({ root, repoRoot: repo }).errors, []);
  writeFileSync(resolve(patterns, 'two.md'), entry);
  assert.match(validateKnowledge({ root, repoRoot: repo }).errors.join('\n'), /duplicate id/);
  assert.match(validateKnowledge({ root, repoRoot: repo }).errors.join('\n'), /duplicate kind\+tags\+requires/);
} finally {
  rmSync(fixture, { recursive: true, force: true });
}

const entries = [
  { id: 'KBP-0001', status: 'candidate', scope: 'universal', platform: 'neutral', page_types: ['home'], tags: ['visual-qa'] },
  { id: 'KBP-0002', status: 'candidate', scope: 'industry', platform: 'neutral', page_types: ['home', 'catalog'], tags: ['commerce', 'responsive'] }
];
const cases = [
  [{ status: ['candidate'], scope: [], platform: [], pageType: [], tag: [] }, 2],
  [{ status: ['verified'], scope: [], platform: [], pageType: [], tag: [] }, 0],
  [{ status: [], scope: [], platform: [], pageType: [], tag: ['visual-qa'] }, 1],
  [{ status: [], scope: [], platform: [], pageType: [], tag: ['commerce'] }, 1],
  [{ status: [], scope: ['universal'], platform: [], pageType: [], tag: [] }, 1],
  [{ status: [], scope: ['industry'], platform: [], pageType: [], tag: [] }, 1],
  [{ status: [], scope: [], platform: ['neutral'], pageType: [], tag: [] }, 2],
  [{ status: [], scope: [], platform: [], pageType: ['catalog'], tag: [] }, 1],
  [{ status: [], scope: [], platform: [], pageType: [], tag: ['missing'] }, 0],
  [{ status: ['candidate'], scope: [], platform: [], pageType: [], tag: ['responsive'] }, 1]
];
for (const [filters, expected] of cases) assert.equal(searchKnowledgeEntries(entries, filters).length, expected);
assert.equal(repositoryRoot.endsWith('codex\\test') || repositoryRoot.endsWith('codex/test'), true);
console.log('kb tests passed.');
