import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const knownIssues = JSON.parse(readFileSync(join(repositoryRoot, 'scripts', 'known-compliance-issues.json'), 'utf8'));
const statuses = new Set(['REUSE', 'COMPOSE', 'EXTEND', 'BLOCKED']);

function listFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function known(slug, code) {
  return knownIssues.projects?.[slug]?.[code];
}

function addFinding(findings, slug, code, message) {
  const reason = known(slug, code);
  findings.push({ code, status: reason ? 'warning' : 'error', message, reason });
}

export function parseTokenMap(text) {
  const entries = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/<!--\s*ds-section\s+id="([a-z0-9-]+)"\s+status="(REUSE|COMPOSE|EXTEND|BLOCKED)"\s+local-selectors="([^"]*)"\s+local-files="([^"]*)"\s*-->/i);
    if (match) entries.push({ id: match[1], status: match[2].toUpperCase(), selectors: match[3].split(',').map((value) => value.trim()).filter(Boolean), files: match[4].split(',').map((value) => value.trim()).filter(Boolean) });
  }
  return entries;
}

function selectorPattern(selector) {
  return new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('\\ ', '\\s+'));
}

export function checkCompliance(slug, { projectDirectory = join(repositoryRoot, 'projects', slug), knownIssuesOverride = knownIssues } = {}) {
  const originalKnown = knownIssues.projects;
  if (knownIssuesOverride !== knownIssues) knownIssues.projects = knownIssuesOverride.projects ?? {};
  try {
    const findings = [];
    const docsDirectory = join(projectDirectory, 'docs');
    const tokenMapPath = join(docsDirectory, 'token-map.md');
    const blueprintPath = join(docsDirectory, 'page-blueprint.md');
    const qaReportPath = join(docsDirectory, 'qa-report.md');
    for (const [code, path] of [['missing-token-map', tokenMapPath], ['missing-page-blueprint', blueprintPath], ['missing-qa-report', qaReportPath]]) {
      if (!existsSync(path)) addFinding(findings, slug, code, `Missing required project document: ${relative(projectDirectory, path).replaceAll('\\', '/')}`);
    }
    if (!existsSync(tokenMapPath)) return { errors: findings.filter((finding) => finding.status === 'error'), warnings: findings.filter((finding) => finding.status === 'warning'), sections: [] };
    const tokenMap = readFileSync(tokenMapPath, 'utf8');
    const detectedStatuses = [...tokenMap.matchAll(/\b(REUSE|COMPOSE|EXTEND|BLOCKED)\b/g)].map((match) => match[1]);
    if (!detectedStatuses.length) addFinding(findings, slug, 'missing-token-map-statuses', 'token-map.md has no Design System First statuses.');
    const sections = parseTokenMap(tokenMap);
    const needsGapReport = detectedStatuses.some((status) => ['EXTEND', 'BLOCKED'].includes(status));
    if (needsGapReport && !existsSync(join(docsDirectory, 'design-system-gap-report.md'))) addFinding(findings, slug, 'missing-gap-report', 'EXTEND/BLOCKED is declared but docs/design-system-gap-report.md is missing.');
    const extendSections = sections.filter((section) => section.status === 'EXTEND');
    if (detectedStatuses.includes('EXTEND') && !extendSections.length) addFinding(findings, slug, 'unverifiable-local-css', 'EXTEND is declared without machine-readable section IDs, selectors and files; local CSS ownership cannot be verified.');
    for (const section of extendSections) {
      if (!section.selectors.length || !section.files.length) {
        addFinding(findings, slug, 'unverifiable-local-css', `EXTEND section ${section.id} lacks local-selectors or local-files; local CSS ownership cannot be verified.`);
        continue;
      }
      for (const file of section.files) {
        const path = join(projectDirectory, file);
        if (!existsSync(path)) {
          addFinding(findings, slug, 'unverifiable-local-css', `EXTEND section ${section.id} declares missing local stylesheet: ${file}`);
          continue;
        }
        const css = readFileSync(path, 'utf8');
        for (const selector of section.selectors) {
          if (selectorPattern(selector).test(css)) addFinding(findings, slug, 'extend-local-css', `EXTEND section ${section.id} is implemented in local CSS: ${file} (${selector}).`);
        }
      }
    }
    return { errors: findings.filter((finding) => finding.status === 'error'), warnings: findings.filter((finding) => finding.status === 'warning'), sections };
  } finally {
    if (knownIssuesOverride !== knownIssues) knownIssues.projects = originalKnown;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2];
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error('Usage: node scripts/check-compliance.mjs <project-slug>');
    process.exitCode = 1;
  } else {
    const result = checkCompliance(slug);
    result.warnings.forEach((finding) => console.warn(`check:compliance warning: ${finding.code}: ${finding.message}${finding.reason ? `; ${finding.reason}` : ''}`));
    result.errors.forEach((finding) => console.error(`check:compliance error: ${finding.code}: ${finding.message}`));
    if (!result.errors.length) console.log(`check:compliance passed for ${slug} (${result.warnings.length} known warning(s)).`);
    process.exitCode = result.errors.length ? 1 : 0;
  }
}
