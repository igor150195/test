import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { checkSiteBuild, createSubpathServer } from './check-site-build.mjs';
import { validateProjectManifest } from './check-project-manifest.mjs';
import { createQaResults, finaliseTechnical, mandatoryTechnicalCheckIds, markChecksNotRun, recordA11yReport, recordDsUsage, recordPortability, recordTechnicalCheck, validateQaResults } from './qa-results.mjs';
import { auditCssContracts, externalResourcesInBundle, htmlClassUsage } from './qa-audit.mjs';
import { debtReviewWarning } from './known-issues.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const knownTokenIssues = JSON.parse(readFileSync(join(repositoryRoot, 'scripts', 'known-token-issues.json'), 'utf8'));
const knownResourceIssues = JSON.parse(readFileSync(join(repositoryRoot, 'scripts', 'known-resource-issues.json'), 'utf8'));
const knownA11yIssues = JSON.parse(readFileSync(join(repositoryRoot, 'scripts', 'known-a11y-issues.json'), 'utf8'));
const structuralClassContracts = JSON.parse(readFileSync(join(repositoryRoot, 'scripts', 'documented-structural-classes.json'), 'utf8'));
const viewports = [
  { id: 'desktop-full-hd', width: 1920, height: 1080 },
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'mobile', width: 390, height: 844 }
];
const runtimeChecks = new Set(['console-errors', 'failed-requests', 'http-errors', 'broken-images', 'horizontal-overflow', 'img-alt', 'img-dimensions', 'img-loading', 'html-lang', 'meta-description', 'skip-link', 'input-label', 'button-accessible-name']);

function listFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function portableResource(value) {
  if (!value || /^data:/i.test(value)) return value?.length > 80 ? `${value.slice(0, 79)}…` : value;
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}`;
  } catch {
    return value;
  }
}

export function createObservations() {
  return new Map(mandatoryTechnicalCheckIds.map((id) => [id, []]));
}

function observe(observations, id, status, evidence = {}) {
  observations.get(id).push({ status, evidence });
}

export function applyObservations(result, observations, { notRunReason, notRunIds = [] } = {}) {
  for (const id of mandatoryTechnicalCheckIds) {
    if (notRunIds.includes(id)) {
      recordTechnicalCheck(result, id, { status: 'not-run', reason: notRunReason });
      continue;
    }
    const entries = observations.get(id);
    const status = entries.some((entry) => entry.status === 'error') ? 'error' : entries.some((entry) => entry.status === 'warning') ? 'warning' : 'passed';
    recordTechnicalCheck(result, id, { status, evidence: entries.map((entry) => entry.evidence) });
  }
}

function contrastEvidence(failureSummary = '') {
  const contrast = failureSummary.match(/contrast of ([\d.]+) \(foreground color: ([^,]+), background color: ([^,]+)/i);
  return contrast ? { contrast: Number(contrast[1]), foreground: contrast[2], background: contrast[3] } : {};
}

function knownA11yIssue(violation, target, issues) {
  return issues.issues?.find((issue) => issue.rule === violation.id && issue.selector === target);
}

function a11yFindingStatus(impact, compliance, known) {
  if (known) return 'warning';
  if (['critical', 'serious'].includes(impact) && compliance === 'strict') return 'error';
  return 'warning';
}

export function summariseA11yViolations(observations, { compliance = 'strict', issues = knownA11yIssues } = {}) {
  const grouped = new Map();
  for (const { page, viewport, violation } of observations) {
    for (const node of violation.nodes ?? []) {
      const target = (node.target ?? []).join(', ');
      const key = JSON.stringify([violation.id, violation.impact ?? null, target, node.failureSummary ?? '']);
      const known = knownA11yIssue(violation, target, issues);
      const status = a11yFindingStatus(violation.impact, compliance, known);
      const reviewWarning = known ? debtReviewWarning(known, `known a11y debt ${violation.id}/${target}`) : null;
      const current = grouped.get(key) ?? {
        id: violation.id,
        impact: violation.impact ?? null,
        status,
        known: Boolean(known),
        ...(known ? { reason: known.reason } : {}),
        ...(reviewWarning ? { review_warning: reviewWarning } : {}),
        help: violation.help,
        help_url: violation.helpUrl,
        target,
        node_count: 1,
        failure_summary: node.failureSummary ?? '',
        pages: [],
        viewports: [],
        viewport_details: []
      };
      if (!current.pages.includes(page)) current.pages.push(page);
      if (!current.viewports.includes(viewport)) current.viewports.push(viewport);
      if (!current.viewport_details.some((detail) => detail.page === page && detail.viewport === viewport)) {
        current.viewport_details.push({ page, viewport, ...contrastEvidence(node.failureSummary) });
      }
      grouped.set(key, current);
    }
  }
  return [...grouped.values()].sort((left, right) => `${left.id}:${left.target}`.localeCompare(`${right.id}:${right.target}`));
}

export function summariseA11yIncomplete(observations) {
  const findings = [];
  for (const { page, viewport, incomplete } of observations) {
    for (const node of incomplete.nodes ?? []) {
      findings.push({ id: incomplete.id, impact: incomplete.impact ?? null, help: incomplete.help, help_url: incomplete.helpUrl, target: (node.target ?? []).join(', '), failure_summary: node.failureSummary ?? '', page, viewport });
    }
  }
  findings.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return { count: findings.length, findings };
}

function writeResults(path, result) {
  const validationErrors = validateQaResults(result);
  if (validationErrors.length) throw new Error(`Invalid QA results: ${validationErrors.join('; ')}`);
  writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

export function outputDirectory(projectDirectory, runId) {
  if (runId && !/^[a-z0-9][a-z0-9-]*$/i.test(runId)) throw new Error('--run-id must be a safe alphanumeric identifier');
  const root = join(projectDirectory, 'artifacts', 'qa');
  const output = join(root, runId || 'latest');
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });
  return output;
}

function projectAssetPrerequisites(projectDirectory) {
  const assetsPath = join(projectDirectory, 'assets.json');
  if (!existsSync(assetsPath)) return [];
  const assets = JSON.parse(readFileSync(assetsPath, 'utf8')).assets ?? [];
  return assets.filter((asset) => /^https?:\/\//i.test(asset.source)).map((asset) => asset.source);
}

export function evaluateQaPrerequisites({ projectDirectory, distDirectory, manifest }) {
  const errors = validateProjectManifest(manifest, projectDirectory);
  if (errors.length) return errors.map((message) => ({ code: 'invalid-project-manifest', message }));
  const externalAssets = projectAssetPrerequisites(projectDirectory);
  const prerequisites = [];
  if (externalAssets.length) prerequisites.push({ code: 'external-production-assets', message: 'Project assets manifest declares external production resources.', evidence: { resources: externalAssets.map(portableResource) } });
  if (!existsSync(distDirectory)) prerequisites.push({ code: 'missing-project-dist', message: 'Project dist is missing. Run npm run site:build -- <slug> first.' });
  if (existsSync(distDirectory) && !existsSync(join(distDirectory, 'build.json'))) prerequisites.push({ code: 'missing-build-metadata', message: 'Project dist has no build.json; rebuild it with npm run site:build.' });
  return prerequisites;
}

function knownMissingResource(url) {
  const filename = new URL(url).pathname.split('/').pop();
  return knownResourceIssues.missing.find((issue) => issue.output_path === filename);
}

async function warmPage(page) {
  await page.evaluate(async () => {
    const step = Math.max(1, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) window.scrollTo(0, y);
    window.scrollTo(0, 0);
    if (document.fonts) await document.fonts.ready;
  });
  await page.waitForTimeout(250);
}

async function inspectPage(page) {
  return page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    documentHeight: document.documentElement.scrollHeight,
    brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.getAttribute('src') || image.currentSrc || image.src),
    imagesMissingAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).map((image) => image.getAttribute('src') || image.currentSrc || image.src),
    imagesWithoutDimensions: [...document.images].filter((image) => !/^data:/i.test(image.getAttribute('src') || '') && (!image.hasAttribute('width') || !image.hasAttribute('height'))).map((image) => image.getAttribute('src') || image.currentSrc || image.src),
    imagesWithoutLoading: [...document.images].filter((image) => !/^data:/i.test(image.getAttribute('src') || '') && !image.hasAttribute('loading')).map((image) => image.getAttribute('src') || image.currentSrc || image.src),
    hasMetaDescription: Boolean(document.querySelector('meta[name="description"][content]')),
    hasLang: Boolean(document.documentElement.getAttribute('lang')),
    hasSkipLink: [...document.querySelectorAll('a.skip-link[href^="#"], a[class*="skip-link"][href^="#"]')].some((link) => link.getAttribute('href') !== '#'),
    unlabeledInputs: [...document.querySelectorAll('input, select, textarea')].filter((input) => !(input.labels?.length || input.getAttribute('aria-label') || input.getAttribute('aria-labelledby'))).map((input) => input.outerHTML),
    unnamedButtons: [...document.querySelectorAll('button')].filter((button) => !(button.innerText.trim() || button.getAttribute('aria-label') || button.getAttribute('aria-labelledby') || button.getAttribute('title'))).map((button) => button.outerHTML)
  }));
}

async function captureSegments(page, directory, viewport) {
  const maxY = Math.max(0, (await page.evaluate(() => document.documentElement.scrollHeight)) - viewport.height);
  const step = Math.max(1, Math.round(viewport.height * 0.77));
  const positions = new Set([0, maxY]);
  for (let y = step; y < maxY; y += step) positions.add(Math.min(y, maxY));
  const paths = [];
  for (const [index, y] of [...positions].sort((left, right) => left - right).entries()) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(50);
    const path = join(directory, 'segments', `${String(index).padStart(4, '0')}-${y}.png`);
    mkdirSync(dirname(path), { recursive: true });
    await page.screenshot({ path, animations: 'disabled', caret: 'hide' });
    paths.push(path);
  }
  return paths;
}

function rel(projectDirectory, path) {
  return relative(projectDirectory, path).replaceAll('\\', '/');
}

export function collectPageAudit(observations, audit, page, viewport) {
  const context = { page, viewport };
  if (audit.brokenImages.length) observe(observations, 'broken-images', 'error', { ...context, images: audit.brokenImages.map(portableResource) });
  if (audit.documentWidth > audit.viewportWidth) observe(observations, 'horizontal-overflow', 'error', { ...context, document_width: audit.documentWidth, viewport_width: audit.viewportWidth });
  if (audit.imagesMissingAlt.length) observe(observations, 'img-alt', 'warning', { ...context, images: audit.imagesMissingAlt.map(portableResource) });
  if (audit.imagesWithoutDimensions.length) observe(observations, 'img-dimensions', 'warning', { ...context, images: audit.imagesWithoutDimensions.map(portableResource) });
  if (audit.imagesWithoutLoading.length) observe(observations, 'img-loading', 'warning', { ...context, images: audit.imagesWithoutLoading.map(portableResource) });
  if (!audit.hasMetaDescription) observe(observations, 'meta-description', 'warning', context);
  if (!audit.hasLang) observe(observations, 'html-lang', 'error', context);
  if (!audit.hasSkipLink) observe(observations, 'skip-link', 'warning', context);
  if (audit.unlabeledInputs.length) observe(observations, 'input-label', 'error', { ...context, inputs: audit.unlabeledInputs.map((value) => portableResource(value)) });
  if (audit.unnamedButtons.length) observe(observations, 'button-accessible-name', 'error', { ...context, buttons: audit.unnamedButtons.map((value) => portableResource(value)) });
}

export async function runQa(slug, { runId } = {}) {
  const projectDirectory = join(repositoryRoot, 'projects', slug);
  const manifestPath = join(projectDirectory, 'project.json');
  if (!existsSync(manifestPath)) throw new Error(`Missing project manifest: ${manifestPath}`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const artifactDirectory = outputDirectory(projectDirectory, runId);
  const result = createQaResults({ slug, generatorVersion: manifest.generator_version, dsVersion: manifest.ds_version, portable: false });
  const observations = createObservations();
  const a11yObservations = [];
  const a11yIncompleteObservations = [];
  const distDirectory = join(projectDirectory, 'dist');
  const prerequisites = evaluateQaPrerequisites({ projectDirectory, distDirectory, manifest });
  for (const prerequisite of prerequisites) {
    if (prerequisite.code === 'external-production-assets') observe(observations, 'external-hosts', 'error', prerequisite.evidence);
  }
  if (prerequisites.length) {
    applyObservations(result, observations, { notRunReason: `Prerequisite failed: ${prerequisites.map((entry) => entry.code).join(', ')}.`, notRunIds: mandatoryTechnicalCheckIds.filter((id) => id !== 'external-hosts') });
    finaliseTechnical(result);
    recordA11yReport(result, { status: 'not-run', reason: 'Axe analysis requires a portable build and browser run.' });
    recordPortability(result, {
      site_build: { status: existsSync(join(distDirectory, 'build.json')) ? 'passed' : 'error' },
      check_site: { status: 'not-run' },
      external_resources: { status: prerequisites.some((entry) => entry.code === 'external-production-assets') ? 'error' : 'not-run' }
    });
    writeResults(join(artifactDirectory, 'results.json'), result);
    return { result, resultsPath: join(artifactDirectory, 'results.json'), exitCode: 1 };
  }

  const htmlFiles = manifest.pages.map((page) => ({ page, source: join(distDirectory, page.output) }));
  const bundleCss = listFiles(join(distDirectory, 'css')).filter((file) => file.endsWith('.css')).map((file) => readFileSync(file, 'utf8')).join('\n');
  const bundleHtml = htmlFiles.map(({ source }) => readFileSync(source, 'utf8')).join('\n');
  const externalResources = externalResourcesInBundle(bundleHtml, bundleCss);
  const classUsage = htmlClassUsage(bundleHtml);
  recordDsUsage(result, { allClassUses: classUsage.all_class_uses, dsClassUses: classUsage.ds_class_uses });
  if (externalResources.length) observe(observations, 'external-hosts', 'error', { resources: externalResources.map(portableResource) });
  for (const finding of auditCssContracts({ html: bundleHtml, css: bundleCss, knownIssues: knownTokenIssues, structuralClassContracts })) {
    const id = finding.code.includes('ds-class') ? 'undefined-ds-classes' : finding.code.includes('icon') ? 'undefined-icons' : 'undefined-tokens';
    observe(observations, id, finding.severity, { message: finding.message });
  }
  if (externalResources.length) {
    applyObservations(result, observations, { notRunReason: 'Portable-build prerequisite failed: external HTTP(S) resources.', notRunIds: [...runtimeChecks] });
    finaliseTechnical(result);
    recordA11yReport(result, { status: 'not-run', reason: 'Axe analysis requires a production bundle without external HTTP(S) resources.' });
    recordPortability(result, { site_build: { status: 'passed' }, check_site: { status: 'not-run' }, external_resources: { status: 'error', resources: externalResources.map(portableResource) } });
    writeResults(join(artifactDirectory, 'results.json'), result);
    return { result, resultsPath: join(artifactDirectory, 'results.json'), exitCode: 1 };
  }
  result.portable = true;
  try {
    const transfer = await checkSiteBuild(slug, 'qa-transfer');
    recordPortability(result, { site_build: { status: 'passed' }, check_site: { status: 'passed', response_count: transfer.responses.length }, external_resources: { status: 'passed' } });
  } catch (error) {
    recordPortability(result, { site_build: { status: 'passed' }, check_site: { status: 'error', reason: error.message }, external_resources: { status: 'passed' } });
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    applyObservations(result, observations, { notRunReason: `Chromium is unavailable: ${error.message}`, notRunIds: [...runtimeChecks] });
    finaliseTechnical(result);
    recordA11yReport(result, { status: 'not-run', reason: `Axe analysis could not start because Chromium is unavailable: ${error.message}` });
    writeResults(join(artifactDirectory, 'results.json'), result);
    return { result, resultsPath: join(artifactDirectory, 'results.json'), exitCode: 0 };
  }
  result.chromium_version = browser.version();
  const server = createSubpathServer(distDirectory, 'qa');
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const port = server.address().port;
  try {
    for (const { page: projectPage } of htmlFiles) {
      const pageResult = { id: projectPage.id, route: projectPage.route, output: projectPage.output, viewports: [] };
      for (const viewport of viewports) {
        const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, locale: 'ru-RU', timezoneId: 'Asia/Tashkent' });
        const page = await context.newPage();
        const consoleErrors = [];
        const failedRequests = [];
        const badResponses = [];
        page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
        page.on('requestfailed', (request) => failedRequests.push({ url: portableResource(request.url()), error: request.failure()?.errorText ?? 'unknown' }));
        page.on('response', (response) => { if (response.status() >= 400) badResponses.push({ url: portableResource(response.url()), status: response.status() }); });
        const viewportDirectory = join(artifactDirectory, projectPage.id, viewport.id);
        mkdirSync(viewportDirectory, { recursive: true });
        try {
          await page.goto(`http://127.0.0.1:${port}/qa/${projectPage.output}`, { waitUntil: 'networkidle', timeout: 30_000 });
          await page.evaluate(async () => { if (document.fonts) await document.fonts.ready; });
          await page.waitForTimeout(250);
          try {
            const axe = await new AxeBuilder({ page }).analyze();
            axe.violations.forEach((violation) => a11yObservations.push({ page: projectPage.id, viewport: viewport.id, violation }));
            axe.incomplete.forEach((incomplete) => a11yIncompleteObservations.push({ page: projectPage.id, viewport: viewport.id, incomplete }));
          } catch (error) {
            a11yIncompleteObservations.push({ page: projectPage.id, viewport: viewport.id, incomplete: {
              id: 'axe-analysis-error', impact: null, help: 'Axe analysis failed', helpUrl: '', nodes: [{ target: [], failureSummary: error.message }]
            } });
          }
          const firstScreen = join(viewportDirectory, 'first-screen.png');
          await page.screenshot({ path: firstScreen, animations: 'disabled', caret: 'hide' });
          await warmPage(page);
          const fullPage = join(viewportDirectory, 'full-page.png');
          await page.screenshot({ path: fullPage, fullPage: true, animations: 'disabled', caret: 'hide' });
          const segments = await captureSegments(page, viewportDirectory, viewport);
          const audit = await inspectPage(page);
          const knownResponses = badResponses.filter((response) => knownMissingResource(`http://qa${response.url}`));
          const unknownResponses = badResponses.filter((response) => !knownMissingResource(`http://qa${response.url}`));
          const contextEvidence = { page: projectPage.id, viewport: viewport.id };
          if (consoleErrors.length) observe(observations, 'console-errors', 'error', { ...contextEvidence, errors: consoleErrors });
          if (failedRequests.length) observe(observations, 'failed-requests', 'error', { ...contextEvidence, requests: failedRequests });
          if (knownResponses.length) observe(observations, 'http-errors', 'warning', { ...contextEvidence, responses: knownResponses });
          if (unknownResponses.length) observe(observations, 'http-errors', 'error', { ...contextEvidence, responses: unknownResponses });
          collectPageAudit(observations, audit, projectPage.id, viewport.id);
          pageResult.viewports.push({ ...viewport, first_screen: rel(projectDirectory, firstScreen), full_page: rel(projectDirectory, fullPage), segments: segments.map((path) => rel(projectDirectory, path)), audit: { documentWidth: audit.documentWidth, viewportWidth: audit.viewportWidth, documentHeight: audit.documentHeight } });
        } catch (error) {
          observe(observations, 'failed-requests', 'error', { page: projectPage.id, viewport: viewport.id, error: error.message });
        } finally {
          await context.close();
        }
      }
      result.pages.push(pageResult);
    }
  } finally {
    await new Promise((done) => server.close(done));
    await browser.close();
  }
  applyObservations(result, observations);
  finaliseTechnical(result);
  const a11yViolations = summariseA11yViolations(a11yObservations, { compliance: manifest.compliance });
  const a11yIncomplete = summariseA11yIncomplete(a11yIncompleteObservations);
  const a11yStatus = a11yViolations.some((finding) => finding.status === 'error') ? 'error' : a11yIncomplete.count ? 'incomplete' : a11yViolations.length ? 'warning' : 'passed';
  const a11yReason = a11yIncomplete.count ? 'Axe could not determine every requested check; inspect technical.a11y.incomplete.' : undefined;
  recordA11yReport(result, { status: a11yStatus, violations: a11yViolations, incomplete: a11yIncomplete, reason: a11yReason });
  writeResults(join(artifactDirectory, 'results.json'), result);
  return { result, resultsPath: join(artifactDirectory, 'results.json'), exitCode: result.technical.status === 'pass' ? 0 : 1 };
}

function parseArguments(argumentsList) {
  const [slug, ...rest] = argumentsList;
  const runIdIndex = rest.indexOf('--run-id');
  return { slug, runId: runIdIndex === -1 ? undefined : rest[runIdIndex + 1] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { slug, runId } = parseArguments(process.argv.slice(2));
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error('Usage: node scripts/qa.mjs <project-slug> [--run-id <id>]');
    process.exitCode = 1;
  } else {
    try {
      const run = await runQa(slug, { runId });
      console.log(JSON.stringify({ results: relative(repositoryRoot, run.resultsPath).replaceAll('\\', '/'), technical: run.result.technical.status, portable: run.result.portable, chromium: run.result.chromium_version }, null, 2));
      process.exitCode = run.exitCode;
    } catch (error) {
      console.error(`qa failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
