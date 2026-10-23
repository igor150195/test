import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkTheme } from '../check-theme.mjs';
import { generateThemeCss } from '../project-styles.mjs';
import { ensurePlaywrightBrowser } from '../check-playwright-browser.mjs';

if (!ensurePlaywrightBrowser()) process.exit(1);

const fixture = mkdtempSync(join(tmpdir(), 'check-theme-'));
const theme = {
  primary: '#3B3027', primary_surface: '#241D17', on_primary: '#F7F1E8',
  accent: '#C48652', accent_surface: '#9C6034', on_accent: '#201712',
  bg_main: '#F2F0E9', bg_main_surface: '#E7E2D8', on_bg_main: '#20211F', on_bg_main_accent: '#574333'
};
const sha = 'git:0123456789abcdef0123456789abcdef01234567';

function writeFixture({ fixtureTheme = theme, themeCss = generateThemeCss(fixtureTheme), body = '<button class="ds-button">Button</button><span class="ds-counter">1</span><footer class="ds-footer"><a class="ds-footer__link" href="#demo">Footer link</a></footer>' } = {}) {
  const project = join(fixture, 'projects', 'fixture');
  mkdirSync(join(project, 'dist', 'css'), { recursive: true });
  writeFileSync(join(project, 'project.json'), JSON.stringify({
    schema_version: 1, slug: 'fixture', type: 'fixture', mode: 'brief', platform: 'static-html',
    generator_version: sha, ds_version: sha, compliance: 'strict', theme: fixtureTheme,
    pages: [{ id: 'home', source: 'index.html', output: 'index.html', route: '/' }],
    files: [{ path: 'css/theme.css', owner: 'generated' }], external_dependencies: []
  }), 'utf8');
  writeFileSync(join(project, 'dist', 'build.json'), '{}');
  writeFileSync(join(project, 'dist', 'index.html'), `<!doctype html><html><body>${body}<link rel="stylesheet" href="./css/site.css"></body></html>`);
  writeFileSync(join(project, 'dist', 'css', 'site.css'), `:root { --primary: #7042F4; --primary_4: rgba(112, 66, 244, .4); }\n${themeCss}\n.ds-button { color: var(--on_primary); background: var(--primary); border: 1px solid var(--primary); } .ds-counter { color: var(--on_accent); background-color: var(--accent); } .ds-footer { background-color: var(--footer_bg); } .ds-footer__link { color: var(--on_primary_8); }`);
}

try {
  writeFixture();
  const valid = await checkTheme('fixture', { repositoryRoot: fixture });
  assert.equal(valid.status, 'passed', 'a complete root theme must pass');

  const manifestPath = join(fixture, 'projects', 'fixture', 'project.json');
  const noTheme = JSON.parse(readFileSync(manifestPath, 'utf8'));
  delete noTheme.theme;
  writeFileSync(manifestPath, JSON.stringify(noTheme));
  assert.equal((await checkTheme('fixture', { repositoryRoot: fixture })).status, 'error', 'a strict project without a theme must fail');
  noTheme.compliance = 'legacy';
  writeFileSync(manifestPath, JSON.stringify(noTheme));
  assert.equal((await checkTheme('fixture', { repositoryRoot: fixture })).status, 'not-run', 'a legacy project without a theme must be reported as not-run');

  writeFixture({ themeCss: `.theme {${generateThemeCss(theme).match(/:root \{([\s\S]*)\}/)[1]}}` });
  const descendant = await checkTheme('fixture', { repositoryRoot: fixture });
  assert.equal(descendant.status, 'error', 'a theme scoped to a descendant must fail root token checks');

  writeFixture({ themeCss: ':root { --primary: #3B3027; }' });
  const incomplete = await checkTheme('fixture', { repositoryRoot: fixture });
  assert.equal(incomplete.status, 'error', 'an incomplete primary scale must fail');

  writeFixture({ fixtureTheme: { ...theme, on_accent: '#FFFFFF', accent: '#FFFFFF' } });
  const badAccent = await checkTheme('fixture', { repositoryRoot: fixture });
  assert.equal(badAccent.status, 'warning', 'Counter contrast must be a warning even for strict projects');
  assert.equal(badAccent.findings.some((finding) => finding.selector === '.ds-counter'), true, 'Counter contrast warning must identify the component');

  writeFixture({ fixtureTheme: { ...theme, footer_bg: '#888888' } });
  const badFooter = await checkTheme('fixture', { repositoryRoot: fixture });
  assert.equal(badFooter.status, 'warning', 'footer link contrast must be a warning');
  assert.equal(badFooter.findings.some((finding) => finding.selector === '.ds-footer__link'), true, 'footer link warning must identify the component');

  const fallbackTheme = { ...theme };
  writeFixture({ fixtureTheme: fallbackTheme });
  assert.equal((await checkTheme('fixture', { repositoryRoot: fixture })).status, 'passed', 'the fallback footer background must pass the root theme contract');

  writeFixture({ fixtureTheme: { ...theme, footer_bg: '#202020' } });
  assert.equal((await checkTheme('fixture', { repositoryRoot: fixture })).status, 'passed', 'an optional explicit footer background must pass the root theme contract');

  writeFixture({ body: '<button class="ds-button">Button</button><div class="ds-exception">Exception</div>' });
  const css = generateThemeCss(theme) + '\n.ds-button { color: var(--on_primary); background: var(--primary); } .ds-exception { color: #7042F4; }';
  writeFileSync(join(fixture, 'projects', 'fixture', 'dist', 'css', 'site.css'), css);
  const known = { issues: [{ slug: 'fixture', selector: 'div.ds-exception', property: 'color', value: 'rgb(112, 66, 244)', reason: 'fixture exception', added: '2026-10-20', review_after: '2027-01-18' }] };
  const exception = await checkTheme('fixture', { repositoryRoot: fixture, knownIssuesOverride: known });
  assert.equal(exception.status, 'warning', 'an allowed default-primary exception must be a warning, not an error');
  assert.equal(exception.findings[0].status, 'warning');
  console.log('check-theme: root contract, contrast warnings, scale, and known exception passed');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
