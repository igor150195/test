import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkCompliance, parseTokenMap } from '../check-compliance.mjs';

const fixture = mkdtempSync(join(tmpdir(), 'compliance-fixture-'));
try {
  mkdirSync(join(fixture, 'docs'), { recursive: true });
  mkdirSync(join(fixture, 'css'), { recursive: true });
  writeFileSync(join(fixture, 'docs', 'token-map.md'), '<!-- ds-section id="hero" status="EXTEND" local-selectors=".fixture-hero" local-files="css/project.css" -->', 'utf8');
  writeFileSync(join(fixture, 'docs', 'page-blueprint.md'), '# Blueprint', 'utf8');
  writeFileSync(join(fixture, 'docs', 'qa-report.md'), '# QA', 'utf8');
  writeFileSync(join(fixture, 'docs', 'design-system-gap-report.md'), '# Gap', 'utf8');
  writeFileSync(join(fixture, 'css', 'project.css'), '.fixture-hero { color: red; }', 'utf8');
  const errors = checkCompliance('fixture', { projectDirectory: fixture, knownIssuesOverride: { projects: {} } }).errors;
  assert.ok(errors.some((finding) => finding.code === 'extend-local-css'));
  assert.deepEqual(parseTokenMap('<!-- ds-section id="hero" status="REUSE" local-selectors="" local-files="" -->'), [{ id: 'hero', status: 'REUSE', selectors: [], files: [] }]);
  console.log('check-compliance tests passed.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
