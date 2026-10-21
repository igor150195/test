import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseKnowledgeFrontmatter, repositoryRoot, supplementEvidenceProjects, validateKnowledge } from '../kb-utils.mjs';
import { appendInboxEntries, formatKnowledgeResult, searchKnowledgeEntries, valuesFor } from '../kb-search.mjs';

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
  const inbox = resolve(root, 'inbox');
  const repo = resolve(fixture, 'repo');
  const fs = await import('node:fs');
  fs.mkdirSync(patterns, { recursive: true });
  fs.mkdirSync(inbox, { recursive: true });
  fs.mkdirSync(resolve(repo, 'dist/css'), { recursive: true });
  fs.mkdirSync(resolve(repo, 'scripts'), { recursive: true });
  writeFileSync(resolve(repo, 'dist/css/contracts.css'), ':root { --primary: #000; } .ds-button {}');
  writeFileSync(resolve(repo, 'scripts/evidence.mjs'), '');
  const entry = valid.replaceAll('scripts/kb-utils.mjs', 'scripts/evidence.mjs');
  writeFileSync(resolve(patterns, 'kbp-9999-one.md'), entry);
  assert.deepEqual(validateKnowledge({ root, repoRoot: repo }).errors, []);
  writeFileSync(resolve(inbox, 'kbp-9998-inbox.md'), entry.replace('KBP-9999', 'KBP-9998'));
  assert.deepEqual(validateKnowledge({ root, repoRoot: repo, collection: 'inbox', inbox: true }).errors, []);
  assert.equal(validateKnowledge({ root, repoRoot: repo }).entries.some(({ entry: candidate }) => candidate.id === 'KBP-9998'), false, 'inbox entries must not be active KB entries');
  const activeIndex = [{ id: 'KBP-0001', status: 'candidate', scope: 'universal', platform: 'neutral', page_types: ['home'], tags: ['test'] }];
  assert.equal(appendInboxEntries(activeIndex, { root }).some((candidate) => candidate.id === 'KBP-9998'), false, 'inbox must be excluded unless explicitly requested');
  const inboxSearch = appendInboxEntries(activeIndex, { root, includeInbox: true }).find((candidate) => candidate.id === 'KBP-9998');
  assert.equal(inboxSearch.inbox, true, 'explicit inbox search must mark inbox candidates');
  assert.match(formatKnowledgeResult({ ...inboxSearch, title: 'Inbox fixture' }), /inbox candidate — evidence only/, 'inbox output must be visibly marked');
  writeFileSync(resolve(inbox, 'kbp-9998-inbox.md'), entry.replace('KBP-9999', 'KBP-9998').replace('status: candidate', 'status: approved'));
  assert.match(validateKnowledge({ root, repoRoot: repo, collection: 'inbox', inbox: true }).errors.join('\n'), /inbox entries must have status candidate/);
  writeFileSync(resolve(inbox, 'kbp-9998-inbox.md'), entry.replace('KBP-9999', 'KBP-9998').replaceAll('scripts/evidence.mjs', 'scripts/missing-evidence.mjs'));
  assert.match(validateKnowledge({ root, repoRoot: repo, collection: 'inbox', inbox: true }).errors.join('\n'), /evidence\.(implementation|technical_check|visual_check) does not reference an existing repository file/);
  writeFileSync(resolve(patterns, 'kbp-9997-two.md'), entry);
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
assert.deepEqual(valuesFor(['node', 'kb-search.mjs', '--status', 'verified,approved,candidate'], '--status'), ['verified', 'approved', 'candidate'], 'comma-separated status values must be parsed for CLI search');
const evidenceEntry = { evidence: { projects: ['first-project'] } };
supplementEvidenceProjects(evidenceEntry, 'second-project');
supplementEvidenceProjects(evidenceEntry, 'second-project');
assert.deepEqual(evidenceEntry.evidence.projects, ['first-project', 'second-project'], 'matching knowledge must gain a project once instead of becoming a duplicate');
assert.equal(repositoryRoot.endsWith('codex\\test') || repositoryRoot.endsWith('codex/test'), true);
console.log('kb tests passed.');
