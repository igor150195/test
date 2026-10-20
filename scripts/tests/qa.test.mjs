import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { applyObservations, collectPageAudit, createObservations, evaluateQaPrerequisites, outputDirectory, summariseA11yIncomplete, summariseA11yViolations } from '../qa.mjs';
import { inspectHtmlFixture } from '../qa-audit.mjs';
import { createQaResults, validateQaResults } from '../qa-results.mjs';

const fixture = mkdtempSync(join(tmpdir(), 'qa-fixture-'));
try {
  const manifest = {
    schema_version: 1,
    slug: 'fixture-site',
    type: 'fixture',
    mode: 'brief',
    platform: 'static-html',
    generator_version: 'git:0123456789abcdef0123456789abcdef01234567',
    ds_version: 'git:0123456789abcdef0123456789abcdef01234567',
    compliance: 'strict',
    pages: [{ id: 'home', source: 'index.html', output: 'index.html', route: '/' }],
    files: [],
    external_dependencies: []
  };
  writeFileSync(join(fixture, 'index.html'), '<!doctype html>', 'utf8');
  writeFileSync(join(fixture, 'assets.json'), JSON.stringify({ assets: [{ source: 'https://example.test/image.png' }] }), 'utf8');
  const dist = join(fixture, 'dist');

  const blocked = evaluateQaPrerequisites({ projectDirectory: fixture, distDirectory: dist, manifest });
  assert.deepEqual(blocked.map((entry) => entry.code), ['external-production-assets', 'missing-project-dist']);

  mkdirSync(dist, { recursive: true });
  writeFileSync(join(dist, 'build.json'), '{}', 'utf8');
  writeFileSync(join(fixture, 'assets.json'), JSON.stringify({ assets: [{ source: 'images/image.png' }] }), 'utf8');
  assert.deepEqual(evaluateQaPrerequisites({ projectDirectory: fixture, distDirectory: dist, manifest }), []);

  const latest = outputDirectory(fixture);
  writeFileSync(join(latest, 'stale.txt'), 'stale', 'utf8');
  assert.equal(outputDirectory(fixture), latest);
  assert.equal(outputDirectory(fixture, 'baseline'), join(fixture, 'artifacts', 'qa', 'baseline'));
  const fixtureAudit = inspectHtmlFixture('<html><body><img src="image.png"><input id="email"><button></button></body></html>');
  const result = createQaResults({ slug: 'fixture', generatorVersion: manifest.generator_version, dsVersion: manifest.ds_version, portable: true });
  const observations = createObservations();
  collectPageAudit(observations, { ...fixtureAudit, brokenImages: [], documentWidth: 100, viewportWidth: 100 }, 'fixture', 'desktop');
  applyObservations(result, observations);
  const states = Object.fromEntries(result.technical.checks.map((check) => [check.id, check.status]));
  assert.equal(states['html-lang'], 'error');
  assert.equal(states['img-alt'], 'warning');
  assert.equal(states['input-label'], 'error');
  assert.equal(states['button-accessible-name'], 'error');
  assert.equal(states['skip-link'], 'warning');
  const a11yInput = [{ page: 'home', viewport: 'desktop', violation: { id: 'image-alt', impact: 'critical', help: 'Images must have alternative text', helpUrl: 'https://example.test', nodes: [{ target: ['img.hero'], failureSummary: 'Fix the alt attribute.' }] } }, { page: 'home', viewport: 'mobile', violation: { id: 'image-alt', impact: 'critical', help: 'Images must have alternative text', helpUrl: 'https://example.test', nodes: [{ target: ['img.hero'], failureSummary: 'Fix the alt attribute.' }] } }];
  const a11y = summariseA11yViolations(a11yInput);
  assert.equal(a11y.length, 1, 'a11y violations must deduplicate across viewports');
  assert.equal(a11y[0].node_count, 1, 'each normalized finding represents one affected DOM node selector');
  assert.deepEqual(a11y[0].viewports, ['desktop', 'mobile']);
  assert.equal(a11y[0].status, 'error', 'critical axe finding must be an error in strict projects');
  assert.equal(summariseA11yViolations(a11yInput, { compliance: 'legacy' })[0].status, 'warning', 'critical axe finding must be a warning in legacy projects');
  assert.equal(summariseA11yViolations([{ ...a11yInput[0], violation: { ...a11yInput[0].violation, impact: 'serious' } }])[0].status, 'error', 'serious axe finding must be an error in strict projects');
  assert.equal(summariseA11yViolations([{ ...a11yInput[0], violation: { ...a11yInput[0].violation, impact: 'moderate' } }])[0].status, 'warning', 'moderate axe finding must remain a warning in strict projects');
  const known = { issues: [{ rule: 'color-contrast', selector: '.ds-price__discount', reason: 'fixture', added: '2026-10-20', review_after: '2027-01-18' }] };
  const knownFinding = summariseA11yViolations([{ page: 'home', viewport: 'desktop', violation: { id: 'color-contrast', impact: 'serious', help: 'Contrast', helpUrl: '', nodes: [{ target: ['.ds-price__discount'], failureSummary: 'contrast of 2.0 (foreground color: #111, background color: #fff' }] } }], { compliance: 'strict', issues: known })[0];
  assert.equal(knownFinding.status, 'warning', 'known DS a11y debt must be warning until reviewed');
  assert.equal(knownFinding.known, true);
  const a11yIncomplete = summariseA11yIncomplete([{ page: 'home', viewport: 'desktop', incomplete: { id: 'color-contrast', impact: null, help: 'Needs review', helpUrl: '', nodes: [{ target: ['.hero-image'], failureSummary: 'Image text cannot be assessed.' }] } }]);
  assert.equal(a11yIncomplete.count, 1, 'incomplete axe checks must be recorded');
  const incompleteResult = createQaResults({ slug: 'fixture', generatorVersion: manifest.generator_version, dsVersion: manifest.ds_version, portable: true });
  incompleteResult.technical.a11y = { status: 'incomplete', violations: [], incomplete: a11yIncomplete, reason: 'Axe could not determine every requested check.' };
  assert.deepEqual(validateQaResults(incompleteResult), [], 'incomplete a11y report must be valid but not passed');
  console.log('qa runner fixture tests passed.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
