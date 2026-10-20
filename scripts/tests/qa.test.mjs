import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { applyObservations, collectPageAudit, createObservations, evaluateQaPrerequisites, outputDirectory } from '../qa.mjs';
import { inspectHtmlFixture } from '../qa-audit.mjs';
import { createQaResults } from '../qa-results.mjs';

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
  const incomplete = inspectHtmlFixture('<html><body><img src="image.png"><input id="email"><button></button></body></html>');
  const result = createQaResults({ slug: 'fixture', generatorVersion: manifest.generator_version, dsVersion: manifest.ds_version, portable: true });
  const observations = createObservations();
  collectPageAudit(observations, { ...incomplete, brokenImages: [], documentWidth: 100, viewportWidth: 100 }, 'fixture', 'desktop');
  applyObservations(result, observations);
  const states = Object.fromEntries(result.technical.checks.map((check) => [check.id, check.status]));
  assert.equal(states['html-lang'], 'error');
  assert.equal(states['img-alt'], 'warning');
  assert.equal(states['input-label'], 'error');
  assert.equal(states['button-accessible-name'], 'error');
  assert.equal(states['skip-link'], 'warning');
  console.log('qa runner fixture tests passed.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
