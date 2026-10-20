import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createSubpathServer } from './check-site-build.mjs';
import { debtReviewWarning } from './known-issues.mjs';
import { themeKeys } from './project-styles.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const defaultPrimary = '#7042f4';
const knownIssues = JSON.parse(readFileSync(join(repositoryRoot, 'scripts', 'known-theme-issues.json'), 'utf8'));

function hexRgb(hex) {
  const value = hex.slice(1);
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}

function rgba(hex, opacity) {
  const [red, green, blue] = hexRgb(hex);
  return opacity === 10 ? `rgb(${red}, ${green}, ${blue})` : `rgba(${red}, ${green}, ${blue}, ${opacity / 10})`;
}

function normalizeColor(value) {
  return String(value).replaceAll(/\s+/g, '').toLowerCase();
}

function themedTokenValues(theme) {
  const values = {};
  for (const name of ['primary', 'on_primary', 'accent', 'on_accent', 'on_bg_main', 'on_bg_main_accent']) {
    values[`--${name}`] = rgba(theme[name], 10);
    for (let opacity = 9; opacity >= 1; opacity -= 1) values[`--${name}_${opacity}`] = rgba(theme[name], opacity);
  }
  values['--primary_surface'] = rgba(theme.primary_surface, 10);
  values['--accent_surface'] = rgba(theme.accent_surface, 10);
  values['--bg_main'] = rgba(theme.bg_main, 10);
  values['--bg_main_surface'] = rgba(theme.bg_main_surface, 10);
  return values;
}

function defaultPrimaryValues() {
  return new Set(Array.from({ length: 10 }, (_, index) => normalizeColor(rgba(defaultPrimary, index + 1))));
}

function findingIsKnown(slug, finding, issues) {
  return issues.issues?.find((issue) =>
    issue.slug === slug &&
    (!issue.selector || issue.selector === finding.selector) &&
    (!issue.property || issue.property === finding.property) &&
    (!issue.value || normalizeColor(issue.value) === normalizeColor(finding.value))
  );
}

function addFinding(result, slug, finding, issues) {
  const known = findingIsKnown(slug, finding, issues);
  const entry = { ...finding, status: known ? 'warning' : 'error' };
  if (known) {
    entry.reason = known.reason;
    const reviewWarning = debtReviewWarning(known, `known theme debt ${slug}/${finding.selector}/${finding.property}`);
    if (reviewWarning) entry.review_warning = reviewWarning;
  }
  result.findings.push(entry);
}

async function inspectThemePage(page) {
  return page.evaluate(() => {
    const probe = document.createElement('i');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;visibility:hidden;color:transparent';
    document.body.append(probe);
    const resolveColor = (value) => {
      probe.style.color = value;
      return getComputedStyle(probe).color;
    };
    const root = getComputedStyle(document.documentElement);
    const tokenNames = [...document.documentElement.style]
      .filter((name) => name.startsWith('--'));
    const allThemeTokens = [
      '--primary', ...Array.from({ length: 9 }, (_, index) => `--primary_${9 - index}`), '--primary_surface',
      '--on_primary', ...Array.from({ length: 9 }, (_, index) => `--on_primary_${9 - index}`),
      '--accent', ...Array.from({ length: 9 }, (_, index) => `--accent_${9 - index}`), '--accent_surface',
      '--on_accent', ...Array.from({ length: 9 }, (_, index) => `--on_accent_${9 - index}`),
      '--bg_main', '--bg_main_surface', '--on_bg_main', ...Array.from({ length: 9 }, (_, index) => `--on_bg_main_${9 - index}`),
      '--on_bg_main_accent', ...Array.from({ length: 9 }, (_, index) => `--on_bg_main_accent_${9 - index}`)
    ];
    const tokens = Object.fromEntries(allThemeTokens.map((name) => [name, resolveColor(`var(${name})`)]));
    const describe = (element) => {
      const classes = [...element.classList].filter((name) => name.startsWith('ds-')).slice(0, 3);
      return `${element.tagName.toLowerCase()}${classes.map((name) => `.${name}`).join('')}`;
    };
    const styles = (element, state) => {
      const computed = getComputedStyle(element);
      const values = [
        ['color', computed.color],
        ['background-color', computed.backgroundColor],
        ['box-shadow', computed.boxShadow]
      ];
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        if (computed[`border${side}Style`] !== 'none' && computed[`border${side}Width`] !== '0px') {
          values.push([`border-${side.toLowerCase()}-color`, computed[`border${side}Color`]]);
        }
      }
      if (computed.outlineStyle !== 'none' && computed.outlineWidth !== '0px') values.push(['outline-color', computed.outlineColor]);
      return values.map(([property, value]) => ({ selector: describe(element), property, value, state }));
    };
    const elements = [...document.querySelectorAll('[class]')].filter((element) => [...element.classList].some((name) => name.startsWith('ds-')));
    const appearances = elements.flatMap((element) => styles(element, 'default'));
    for (const element of elements) {
      if (typeof element.focus !== 'function' || element.tabIndex < 0 && !/^(a|button|input|select|textarea)$/i.test(element.tagName)) continue;
      element.focus();
      if (element.matches(':focus-visible')) appearances.push(...styles(element, 'focus-visible'));
    }
    probe.remove();
    return { tokens, appearances, ds_element_count: elements.length, declared_theme_token_count: tokenNames.length };
  });
}

export async function checkTheme(slug, {
  repositoryRoot: root = repositoryRoot,
  knownIssuesOverride = knownIssues,
  browserType = chromium
} = {}) {
  const projectDirectory = join(root, 'projects', slug);
  const manifestPath = join(projectDirectory, 'project.json');
  if (!existsSync(manifestPath)) throw new Error(`Missing project manifest: ${manifestPath}`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!manifest.theme) {
    return manifest.compliance === 'strict'
      ? { status: 'error', reason: 'Strict project manifest has no theme contract.', findings: [] }
      : { status: 'not-run', reason: 'Legacy project manifest has no theme contract.', findings: [] };
  }
  const missingThemeKeys = themeKeys.filter((key) => !manifest.theme[key]);
  if (missingThemeKeys.length) return { status: 'error', reason: `Theme is missing keys: ${missingThemeKeys.join(', ')}`, findings: [] };
  const distDirectory = join(projectDirectory, 'dist');
  if (!existsSync(distDirectory) || !existsSync(join(distDirectory, 'build.json'))) {
    return { status: 'not-run', reason: 'Portable project dist is missing. Run npm run site:build -- <slug> first.', findings: [] };
  }

  let browser;
  try {
    browser = await browserType.launch({ headless: true });
  } catch (error) {
    return { status: 'not-run', reason: `Chromium is unavailable: ${error.message}`, findings: [] };
  }
  const result = { status: 'passed', chromium_version: browser.version(), findings: [], pages: [] };
  const expected = themedTokenValues(manifest.theme);
  const defaultValues = defaultPrimaryValues();
  const defaultTheme = manifest.theme.primary.toLowerCase() === defaultPrimary;
  const server = createSubpathServer(distDirectory, 'theme');
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const port = server.address().port;
  try {
    for (const projectPage of manifest.pages) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.route('**/*', (route) => {
        const hostname = new URL(route.request().url()).hostname;
        return ['127.0.0.1', 'localhost'].includes(hostname) ? route.continue() : route.abort();
      });
      try {
        await page.goto(`http://127.0.0.1:${port}/theme/${projectPage.output}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await page.waitForFunction(() => document.styleSheets.length > 0, undefined, { timeout: 10_000 });
        const inspection = await inspectThemePage(page);
        result.pages.push({ id: projectPage.id, ds_element_count: inspection.ds_element_count });
        for (const [token, expectedValue] of Object.entries(expected)) {
          if (normalizeColor(inspection.tokens[token]) !== normalizeColor(expectedValue)) {
            addFinding(result, slug, { code: 'root-theme-token-mismatch', page: projectPage.id, selector: ':root', property: token, value: inspection.tokens[token], expected: expectedValue }, knownIssuesOverride);
          }
        }
        if (!defaultTheme) {
          for (const appearance of inspection.appearances) {
            if (!defaultValues.has(normalizeColor(appearance.value)) && !/rgba?\(\s*112\s*,\s*66\s*,\s*244\s*[,)\s]/i.test(appearance.value)) continue;
            addFinding(result, slug, { code: 'default-primary-leak', page: projectPage.id, ...appearance }, knownIssuesOverride);
          }
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await new Promise((done) => server.close(done));
    await browser.close();
  }
  result.findings.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  result.status = result.findings.some((finding) => finding.status === 'error') ? 'error' : result.findings.length ? 'warning' : 'passed';
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2];
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error('Usage: node scripts/check-theme.mjs <project-slug>');
    process.exitCode = 1;
  } else {
    try {
      const result = await checkTheme(slug);
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.status === 'error' ? 1 : 0;
    } catch (error) {
      console.error(`check:theme failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
