import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkCompliance, parseTokenMap } from '../check-compliance.mjs';

const fixture = mkdtempSync(join(tmpdir(), 'compliance-fixture-'));
const emptyKnown = { projects: {} };
const section = (values) => `\`\`\`ds-section\n${JSON.stringify(values, null, 2)}\n\`\`\``;
const base = {
  id: 'hero', status: 'EXTEND', decision: 'pending', html_selector: '.fixture-hero',
  local_selectors: ['.fixture-hero'], local_files: ['css/project.css'],
  ds_sources: ['design-system/components/button/index.md'], knowledge_ids: ['KBP-0001']
};

function writeTokenMap(blocks) {
  writeFileSync(join(fixture, 'docs', 'token-map.md'), blocks.join('\n\n'), 'utf8');
}

function result() {
  return checkCompliance('fixture', { projectDirectory: fixture, knownIssuesOverride: emptyKnown });
}

try {
  mkdirSync(join(fixture, 'docs'), { recursive: true });
  mkdirSync(join(fixture, 'css'), { recursive: true });
  writeFileSync(join(fixture, 'index.html'), '<html><body><main class="fixture-hero"><section class="unmapped"></section></main></body></html>', 'utf8');
  writeFileSync(join(fixture, 'docs', 'page-blueprint.md'), '# Blueprint', 'utf8');
  writeFileSync(join(fixture, 'docs', 'qa-report.md'), '# QA', 'utf8');
  writeFileSync(join(fixture, 'docs', 'design-system-gap-report.md'), '# Gap', 'utf8');
  writeFileSync(join(fixture, 'css', 'project.css'), '.fixture-hero { color: red; }', 'utf8');

  writeTokenMap([section(base)]);
  let checked = result();
  assert.ok(checked.errors.some((finding) => finding.code === 'pending-section-implemented'));
  assert.ok(checked.errors.some((finding) => finding.code === 'pending-local-css'));

  writeTokenMap([section({ ...base, decision: 'approved-partial' })]);
  checked = result();
  assert.equal(checked.errors.some((finding) => finding.code.startsWith('pending-')), false);

  writeTokenMap([section({ ...base, decision: 'approved-partial' }), section({ ...base, decision: 'approved-partial' })]);
  assert.ok(result().errors.some((finding) => finding.code === 'duplicate-section-id'));

  writeTokenMap([section({ ...base, decision: 'approved-partial', id: 'missing-path', ds_sources: ['design-system/missing.md'] })]);
  assert.ok(result().errors.some((finding) => finding.code === 'missing-ds-source'));

  writeTokenMap([section({ ...base, decision: 'approved-partial', id: 'unknown-knowledge', knowledge_ids: ['KBP-9999'] })]);
  assert.ok(result().errors.some((finding) => finding.code === 'unknown-knowledge-id'));

  writeTokenMap([section({ ...base, decision: 'approved-partial', id: 'no-selector', html_selector: undefined })]);
  assert.ok(result().errors.some((finding) => finding.code === 'not-verifiable'), 'strict EXTEND without html_selector must fail');

  writeTokenMap([section({ ...base, decision: 'approved-partial', id: 'covered', local_selectors: [], local_files: [] })]);
  let strictResult = result();
  assert.ok(strictResult.errors.some((finding) => finding.code === 'unmapped-html-section'), 'strict mode must fail an unmapped section');
  assert.match(strictResult.errors.find((finding) => finding.code === 'unmapped-html-section').message, /index\.html:1 <section class="unmapped">/, 'unmapped section must identify its location and class');

  writeFileSync(join(fixture, 'project.json'), JSON.stringify({ compliance: 'legacy', pages: [{ source: 'index.html' }] }), 'utf8');
  const legacyResult = result();
  assert.ok(legacyResult.warnings.some((finding) => finding.code === 'unmapped-html-section'), 'legacy mode must warn about an unmapped section');
  assert.equal(legacyResult.errors.some((finding) => finding.code === 'unmapped-html-section'), false, 'legacy mode must not fail an unmapped section');

  const parsed = parseTokenMap(section({ ...base, decision: 'approved-extension' }));
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.entries[0].id, 'hero');
  console.log('check-compliance tests passed.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
