import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateProjectManifest } from '../check-project-manifest.mjs';

const fixture = mkdtempSync(join(tmpdir(), 'codex-project-manifest-'));
const sha = 'git:2aa53c6efd3d14eaf27f4827e2fbf7f084512796';

try {
  writeFileSync(join(fixture, 'index.html'), '<!doctype html>', 'utf8');
  const valid = {
    schema_version: 1,
    slug: 'fixture-site',
    type: 'test',
    mode: 'brief',
    platform: 'static-html',
    generator_version: sha,
    ds_version: sha,
    compliance: 'strict',
    pages: [{ id: 'home', source: 'index.html', output: 'index.html', route: '/' }],
    files: [{ path: 'css/custom.css', owner: 'generated' }],
    external_dependencies: []
  };
  assert.deepEqual(validateProjectManifest(valid, fixture), [], 'valid manifest must pass');
  const invalid = { ...valid, files: [{ path: 'css/custom.css', owner: 'legacy' }] };
  assert.match(validateProjectManifest(invalid, fixture).join('\n'), /owner generated\|owner/, 'invalid owner must fail');
  assert.match(validateProjectManifest(({ ...valid, compliance: 'unknown' }), fixture).join('\n'), /compliance must be legacy or strict/, 'invalid compliance mode must fail');
  const theme = {
    primary: '#7042F4', primary_surface: '#4915B7', on_primary: '#FFFFFF',
    accent: '#A1F2A0', accent_surface: '#7DDD7C', on_accent: '#000000',
    bg_main: '#FFFFFF', bg_main_surface: '#F7F7F7', on_bg_main: '#000000', on_bg_main_accent: '#151037'
  };
  const themed = { ...valid, theme, files: [...valid.files, { path: 'css/theme.css', owner: 'generated' }] };
  writeFileSync(join(fixture, 'index.html'), [
    '<link rel="stylesheet" href="../../dist/css/tokens.css">',
    '<link rel="stylesheet" href="../../dist/css/core.css">',
    '<link rel="stylesheet" href="../../dist/css/components.css">',
    '<link rel="stylesheet" href="../../dist/css/blocks.css">',
    '<link rel="stylesheet" href="./css/theme.css">'
  ].join('\n'), 'utf8');
  assert.deepEqual(validateProjectManifest(themed, fixture), [], 'a complete hex theme with generated output must pass');
  assert.deepEqual(validateProjectManifest({ ...themed, theme: { ...theme, footer_bg: '#202020' } }, fixture), [], 'an explicit optional footer background must pass');
  assert.match(validateProjectManifest({ ...themed, theme: { ...theme, footer_bg: '#fff' } }, fixture).join('\n'), /theme.footer_bg must use #RRGGBB syntax when declared/, 'an explicit footer background must use long hex');
  writeFileSync(join(fixture, 'index.html'), '<link rel="stylesheet" href="../../dist/css/tokens.css">\n<link rel="stylesheet" href="./css/theme.css">', 'utf8');
  assert.match(validateProjectManifest(themed, fixture).join('\n'), /must link tokens\.css, core\.css, components\.css, blocks\.css, then css\/theme\.css/, 'a theme before core CSS must fail the manifest contract');
  assert.match(validateProjectManifest({ ...themed, theme: { ...theme, primary: '#fff' } }, fixture).join('\n'), /theme.primary must use #RRGGBB syntax/, 'short hex values must fail');
  assert.match(validateProjectManifest({ ...themed, files: valid.files }, fixture).join('\n'), /theme requires files to declare generated css\/theme\.css/, 'theme output ownership must be explicit');
  console.log('check-project-manifest: schema contract passed');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
