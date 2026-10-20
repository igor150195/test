import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { buildSite, rewriteStyleLinks, collectLocalCssResourcePaths, collectLocalResourcePaths } from '../site-build.mjs';

const html = [
  '<link rel="stylesheet" href="../../dist/css/tokens.css">',
  '<link rel="stylesheet" href="../../dist/css/core.css">',
  '<link rel="stylesheet" href="../../dist/css/components.css">',
  '<link rel="stylesheet" href="../../dist/css/blocks.css">',
  '<link rel="stylesheet" href="./css/theme.css">',
  '<link rel="stylesheet" href="./css/custom.css">',
  '<img src="./images/hero.png">',
  '<img src="data:image/svg+xml,test">',
  '<img src="https://example.com/remote.png">'
].join('\n');

const output = rewriteStyleLinks(html, ['css/theme.css', 'css/custom.css'], { themePath: 'css/theme.css' });
assert.match(output, /\.\/css\/site\.css/, 'combined stylesheet link must be emitted');
assert.equal(output.includes('../../dist/css/'), false, 'repository stylesheet links must be removed');
assert.deepEqual(collectLocalResourcePaths(html), ['./images/hero.png'], 'only relative local resources must be copied');
assert.deepEqual(collectLocalCssResourcePaths('background: url("../images/hero.png"); mask: url(data:image/svg+xml,test);'), ['../images/hero.png'], 'only relative CSS resources must be copied');
assert.throws(
  () => rewriteStyleLinks(html.replace('../../dist/css/core.css', '../../dist/css/missing.css'), ['css/theme.css', 'css/custom.css'], { themePath: 'css/theme.css' }),
  /Expected exactly one stylesheet link/,
  'unexpected legacy markup must fail instead of being rewritten loosely'
);
assert.throws(
  () => rewriteStyleLinks(html.replace('<link rel="stylesheet" href="./css/theme.css">\n', ''), ['css/theme.css', 'css/custom.css'], { themePath: 'css/theme.css' }),
  /Expected exactly one theme stylesheet link/,
  'a themed project must declare its theme link'
);

function write(path, contents) {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, contents, 'utf8');
}

function hashes(directory) {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .sort()
    .map((file) => `${relative(directory, file)} ${createHash('sha256').update(readFileSync(file)).digest('hex')}`);
}

const temporaryRepository = mkdtempSync(join(tmpdir(), 'site-build-test-'));
try {
  const cssDirectory = join(temporaryRepository, 'dist', 'css');
  const tokenUrls = Array.from({ length: 138 }, () => 'url(/design-system/sets/1/new.sprite.view.svg#icon)').join(' ');
  write(join(cssDirectory, 'tokens.css'), `.fixture { background: ${tokenUrls}; mask-image: url(../empty_color.svg); }`);
  ['core.css', 'components.css', 'blocks.css'].forEach((file) => write(join(cssDirectory, file), '.fixture {}'));
  write(join(temporaryRepository, 'design-system', 'sets', '1', 'new.sprite.view.svg'), '<svg/>');
  const projectDirectory = join(temporaryRepository, 'projects', 'fixture');
  write(join(projectDirectory, 'project.json'), JSON.stringify({
    schema_version: 1,
    slug: 'fixture',
    type: 'test',
    mode: 'brief',
    platform: 'static-html',
    generator_version: 'git:0123456789abcdef0123456789abcdef01234567',
    ds_version: 'git:0123456789abcdef0123456789abcdef01234567',
    compliance: 'strict',
    theme: {
      primary: '#7042F4', primary_surface: '#4915B7', on_primary: '#FFFFFF',
      accent: '#A1F2A0', accent_surface: '#7DDD7C', on_accent: '#000000',
      bg_main: '#FFFFFF', bg_main_surface: '#F7F7F7', on_bg_main: '#000000', on_bg_main_accent: '#151037'
    },
    pages: [{ id: 'home', source: 'index.html', output: 'index.html', route: '/' }],
    files: [{ path: 'css/theme.css', owner: 'generated' }, { path: 'css/custom.css', owner: 'generated' }],
    external_dependencies: []
  }, null, 2));
  write(join(projectDirectory, 'index.html'), `${html}\n`);
  write(join(projectDirectory, 'css', 'theme.css'), ':root { --primary: #7042F4; }');
  write(join(projectDirectory, 'css', 'custom.css'), '.project {}');
  write(join(projectDirectory, 'images', 'hero.png'), 'fixture image');
  const first = buildSite('fixture', { repositoryRoot: temporaryRepository });
  const firstHashes = hashes(first.projectDist);
  const second = buildSite('fixture', { repositoryRoot: temporaryRepository });
  assert.deepEqual(hashes(second.projectDist), firstHashes, 'two site builds must have identical output hashes');
  assert.equal(first.iconUrlReplacements, 138, 'fixture must rewrite all icon URLs');
  assert.equal(first.warnings.length, 1, 'known missing token resource must be reported but not block the build');
  const builtCss = readFileSync(join(first.projectDist, 'css', 'site.css'), 'utf8');
  assert.ok(builtCss.indexOf('/* blocks.css */') < builtCss.indexOf('/* css/theme.css */'), 'theme CSS must follow all DS CSS in the portable bundle');
  assert.ok(builtCss.indexOf('/* css/theme.css */') < builtCss.indexOf('/* css/custom.css */'), 'theme CSS must precede local project CSS in the portable bundle');
  write(join(projectDirectory, 'css', 'custom.css'), '.project { background-image: url("./new-missing.png"); }');
  assert.throws(
    () => buildSite('fixture', { repositoryRoot: temporaryRepository }),
    /Referenced local CSS resource does not exist: css\/custom\.css -> .\/new-missing\.png/,
    'a new missing resource must block the build'
  );
} finally {
  rmSync(temporaryRepository, { recursive: true, force: true });
}

console.log('site-build: strict link and resource contract passed');
