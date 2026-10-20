import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkSiteBuild } from '../check-site-build.mjs';

const repositoryRoot = mkdtempSync(join(tmpdir(), 'site-transfer-test-'));
try {
  const project = join(repositoryRoot, 'projects', 'fixture');
  mkdirSync(join(project, 'dist', 'css'), { recursive: true });
  mkdirSync(join(project, 'dist', 'assets'), { recursive: true });
  writeFileSync(join(project, 'project.json'), JSON.stringify({ pages: [{ output: 'index.html' }] }), 'utf8');
  writeFileSync(join(project, 'dist', 'index.html'), '<link rel="stylesheet" href="./css/site.css"><img src="./assets/new.sprite.view.svg">', 'utf8');
  writeFileSync(join(project, 'dist', 'css', 'site.css'), '.fixture { mask-image: url("../assets/new.sprite.view.svg#icon"); background: url("../empty_color.svg"); }', 'utf8');
  writeFileSync(join(project, 'dist', 'assets', 'new.sprite.view.svg'), '<svg/>', 'utf8');
  const result = await checkSiteBuild('fixture', 'some/path', { repositoryRoot });
  assert.equal(result.basePath, '/some/path/', 'transfer check must use a non-root base path');
  assert.equal(result.responses.filter((response) => response.status >= 400).length, 1, 'only the known missing resource may return 404');
  assert.equal(result.responses.some((response) => response.url.endsWith('/assets/new.sprite.view.svg')), true, 'rewritten icon sprite must be requested');
  assert.equal(result.warnings.length, 1, 'known missing resource must be retained as a warning');
  writeFileSync(join(project, 'dist', 'css', 'site.css'), '.fixture { background: url("../new-missing.svg"); }', 'utf8');
  await assert.rejects(
    checkSiteBuild('fixture', 'some/path', { repositoryRoot }),
    /Transfer check found 1 request\(s\) with status >=400/,
    'a new missing resource must fail transfer validation'
  );
} finally {
  rmSync(repositoryRoot, { recursive: true, force: true });
}
console.log('check-site-build: subpath transfer contract passed');
