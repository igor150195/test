import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { debtReviewWarning } from './known-issues.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const knownIssues = JSON.parse(readFileSync(join(repositoryRoot, 'scripts', 'known-compliance-issues.json'), 'utf8'));
const statuses = new Set(['REUSE', 'COMPOSE', 'EXTEND', 'BLOCKED']);
const decisions = new Set(['pending', 'approved-partial', 'approved-extension']);

function known(issues, slug, code) {
  return issues.projects?.[slug]?.[code];
}

function addFinding(findings, issues, slug, code, message, evidence = {}, defaultStatus = 'error') {
  const debt = known(issues, slug, code);
  findings.push({ code, status: debt ? 'warning' : defaultStatus, message, reason: debt?.reason, evidence });
  const reviewWarning = debtReviewWarning(debt, `known compliance debt ${slug}/${code}`);
  if (debt && reviewWarning) findings.push({ code: 'known-debt-review', status: 'warning', message: reviewWarning });
}

function validateSection(section, index) {
  const errors = [];
  if (!section || typeof section !== 'object' || Array.isArray(section)) return [`ds-section block ${index + 1} must contain a JSON object.`];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(section.id ?? '')) errors.push(`ds-section block ${index + 1} has invalid id.`);
  if (!statuses.has(section.status)) errors.push(`ds-section ${section.id ?? index + 1} has invalid status.`);
  for (const field of ['local_selectors', 'local_files', 'ds_sources', 'knowledge_ids']) {
    if (!Array.isArray(section[field]) || section[field].some((value) => typeof value !== 'string')) errors.push(`ds-section ${section.id ?? index + 1} requires string array ${field}.`);
  }
  if (section.html_selector !== undefined && typeof section.html_selector !== 'string') errors.push(`ds-section ${section.id ?? index + 1} html_selector must be a string when provided.`);
  if (['EXTEND', 'BLOCKED'].includes(section.status) && !decisions.has(section.decision)) errors.push(`ds-section ${section.id ?? index + 1} requires decision pending, approved-partial or approved-extension.`);
  return errors;
}

export function parseTokenMap(text) {
  const entries = [];
  const errors = [];
  const blockPattern = /```ds-section\s*\r?\n([\s\S]*?)\r?\n```/g;
  let match;
  let index = 0;
  while ((match = blockPattern.exec(text))) {
    index += 1;
    try {
      const section = JSON.parse(match[1]);
      const sectionErrors = validateSection(section, index);
      if (sectionErrors.length) errors.push(...sectionErrors);
      else entries.push(section);
    } catch {
      errors.push(`ds-section block ${index} contains invalid JSON.`);
    }
  }
  return { entries, errors };
}

function selectorPattern(selector) {
  return new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('\\ ', '\\s+'));
}

function lineNumber(html, offset) {
  return html.slice(0, offset).split(/\r?\n/).length;
}

function htmlElements(html) {
  const elements = [];
  const stack = [];
  for (const match of html.matchAll(/<\/?([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    const [raw, tagName, attributes] = match;
    const tag = tagName.toLowerCase();
    const offset = match.index;
    if (raw.startsWith('</')) {
      const index = stack.map((entry) => entry.tag).lastIndexOf(tag);
      if (index !== -1) {
        stack[index].end = offset;
        stack.splice(index);
      }
      continue;
    }
    const parent = stack.at(-1) ?? null;
    const entry = { tag, attributes, parent, start: offset, openEnd: offset + raw.length, end: html.length };
    elements.push(entry);
    if (!/\/$/.test(raw) && !['img', 'input', 'meta', 'link', 'br', 'hr'].includes(tag)) stack.push(entry);
  }
  return elements;
}

function attribute(element, name) {
  return element.attributes.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] ?? '';
}

function simpleSelectorMatches(selector, element) {
  if (!selector || /[\s>+~:[\]]/.test(selector)) return null;
  const match = selector.match(/^([a-z][a-z0-9-]*)?((?:[.#][a-zA-Z0-9_-]+)*)$/);
  if (!match) return null;
  const [, tag, suffixes] = match;
  if (tag && tag.toLowerCase() !== element.tag) return false;
  const classes = attribute(element, 'class').split(/\s+/).filter(Boolean);
  for (const suffix of suffixes.matchAll(/([.#])([a-zA-Z0-9_-]+)/g)) {
    if (suffix[1] === '#' && attribute(element, 'id') !== suffix[2]) return false;
    if (suffix[1] === '.' && !classes.includes(suffix[2])) return false;
  }
  return true;
}

function pageHtml(projectDirectory) {
  const manifestPath = join(projectDirectory, 'project.json');
  const sources = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8')).pages.map((page) => page.source)
    : ['index.html'];
  return sources.filter((source) => existsSync(join(projectDirectory, source))).map((source) => ({ source, html: readFileSync(join(projectDirectory, source), 'utf8') }));
}

function topLevelSections(pages) {
  return pages.flatMap(({ source, html }) => htmlElements(html)
    .filter((element) => {
      if (element.parent?.tag === 'main') return ['section', 'header', 'footer', 'nav', 'aside'].includes(element.tag);
      return ['header', 'footer'].includes(element.tag) && !ancestorWithTag(element, 'main');
    })
    .map((element) => ({ source, html, element })));
}

function ancestorWithTag(element, tag) {
  for (let current = element.parent; current; current = current.parent) {
    if (current.tag === tag) return true;
  }
  return false;
}

function firstHeading(html, element) {
  const match = html.slice(element.openEnd, element.end).match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
  if (!match) return '';
  return match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

function describeElement(source, html, element) {
  const id = attribute(element, 'id');
  const classes = attribute(element, 'class').split(/\s+/).filter(Boolean).slice(0, 3);
  const attributes = [id && `id="${id}"`, classes.length && `class="${classes.join(' ')}"`].filter(Boolean).join(' ');
  const heading = firstHeading(html, element);
  return `${source}:${lineNumber(html, element.start)} <${element.tag}${attributes ? ` ${attributes}` : ''}>${heading ? ` "${heading}"` : ''}`;
}

function projectComplianceMode(projectDirectory) {
  const manifestPath = join(projectDirectory, 'project.json');
  if (!existsSync(manifestPath)) return 'strict';
  return JSON.parse(readFileSync(manifestPath, 'utf8')).compliance ?? 'strict';
}

function knownKnowledgeIds() {
  const registry = readFileSync(join(repositoryRoot, 'design-system', 'docs', 'generation', 'knowledge', 'registry.yml'), 'utf8');
  return new Set([...registry.matchAll(/^\s*- id:\s*(KBP-\d{4})\s*$/gm)].map((match) => match[1]));
}

function complianceMetrics(pages, sections, errors) {
  const topLevel = topLevelSections(pages);
  const covered = topLevel.filter(({ element }) => sections.some((section) => section.html_selector && simpleSelectorMatches(section.html_selector, element) === true));
  const reusable = sections.filter((section) => ['REUSE', 'COMPOSE'].includes(section.status) && section.html_selector);
  return {
    top_level_sections: topLevel.length,
    mapped_sections: covered.length,
    reuse_compose_sections: reusable.length,
    compliant_reuse_compose_sections: errors.length ? 0 : reusable.length,
    compliance_errors: errors.length
  };
}

export function checkCompliance(slug, { projectDirectory = join(repositoryRoot, 'projects', slug), knownIssuesOverride = knownIssues } = {}) {
  const findings = [];
  const compliance = projectComplianceMode(projectDirectory);
  const strict = compliance === 'strict';
  const docsDirectory = join(projectDirectory, 'docs');
  const tokenMapPath = join(docsDirectory, 'token-map.md');
  const blueprintPath = join(docsDirectory, 'page-blueprint.md');
  const qaReportPath = join(docsDirectory, 'qa-report.md');
  for (const [code, path] of [['missing-token-map', tokenMapPath], ['missing-page-blueprint', blueprintPath], ['missing-qa-report', qaReportPath]]) {
    if (!existsSync(path)) addFinding(findings, knownIssuesOverride, slug, code, `Missing required project document: ${relative(projectDirectory, path).replaceAll('\\', '/')}`, {}, strict ? 'error' : 'warning');
  }
  if (!existsSync(tokenMapPath)) {
    const errors = findings.filter((finding) => finding.status === 'error');
    return { errors, warnings: findings.filter((finding) => finding.status === 'warning'), sections: [], metrics: complianceMetrics([], [], errors) };
  }

  const tokenMap = readFileSync(tokenMapPath, 'utf8');
  const parsed = parseTokenMap(tokenMap);
  parsed.errors.forEach((message) => addFinding(findings, knownIssuesOverride, slug, 'invalid-token-map', message));
  const legacyExtend = known(knownIssuesOverride, slug, 'legacy-extend-local-css');
  if (legacyExtend && !parsed.entries.length) {
    const gapPath = join(projectDirectory, legacyExtend.gap_report ?? '');
    const gapDeclaresExtend = existsSync(gapPath) && /\bEXTEND\b/.test(readFileSync(gapPath, 'utf8'));
    const localImplementation = (legacyExtend.local_files ?? []).some((file) => {
      const path = join(projectDirectory, file);
      return existsSync(path) && (legacyExtend.local_selectors ?? []).some((selector) => selectorPattern(selector).test(readFileSync(path, 'utf8')));
    });
    if (gapDeclaresExtend && localImplementation) addFinding(findings, knownIssuesOverride, slug, 'legacy-extend-local-css', 'A legacy EXTEND section from the gap report is implemented in local CSS.');
  }
  if (!parsed.entries.length) {
    addFinding(findings, knownIssuesOverride, slug, 'missing-token-map-statuses', 'token-map.md has no valid ds-section records.');
    const errors = findings.filter((finding) => finding.status === 'error');
    return { errors, warnings: findings.filter((finding) => finding.status === 'warning'), sections: [], metrics: complianceMetrics([], [], errors) };
  }
  const ids = new Set();
  const pages = pageHtml(projectDirectory);
  const knowledgeIds = knownKnowledgeIds();

  for (const section of parsed.entries) {
    if (ids.has(section.id)) addFinding(findings, knownIssuesOverride, slug, 'duplicate-section-id', `Duplicate ds-section id: ${section.id}.`);
    ids.add(section.id);
    for (const source of section.ds_sources) {
      if (!existsSync(join(repositoryRoot, source))) addFinding(findings, knownIssuesOverride, slug, 'missing-ds-source', `ds-section ${section.id} references missing DS source: ${source}.`);
    }
    for (const file of section.local_files) {
      if (!existsSync(join(projectDirectory, file))) addFinding(findings, knownIssuesOverride, slug, 'missing-local-file', `ds-section ${section.id} references missing local file: ${file}.`);
    }
    for (const id of section.knowledge_ids) {
      if (!knowledgeIds.has(id)) addFinding(findings, knownIssuesOverride, slug, 'unknown-knowledge-id', `ds-section ${section.id} references unknown knowledge ID: ${id}.`);
    }
    if (!section.html_selector) {
      const status = strict && ['EXTEND', 'BLOCKED'].includes(section.status) ? 'error' : 'warning';
      addFinding(findings, knownIssuesOverride, slug, 'not-verifiable', `ds-section ${section.id} has no html_selector; HTML coverage cannot be verified.`, {}, status);
      continue;
    }
    const matches = pages.flatMap(({ source, html }) => htmlElements(html).filter((element) => simpleSelectorMatches(section.html_selector, element) === true).map((element) => ({ source, element })));
    if (pages.some(({ html }) => htmlElements(html).some((element) => simpleSelectorMatches(section.html_selector, element) === null))) {
      addFinding(findings, knownIssuesOverride, slug, 'not-verifiable', `ds-section ${section.id} uses unsupported html_selector: ${section.html_selector}.`, {}, 'warning');
    }
    if (['EXTEND', 'BLOCKED'].includes(section.status)) {
      const gapReport = join(docsDirectory, 'design-system-gap-report.md');
      if (!existsSync(gapReport)) addFinding(findings, knownIssuesOverride, slug, 'missing-gap-report', `ds-section ${section.id} requires docs/design-system-gap-report.md.`);
      if (section.decision === 'pending') {
        const pendingCode = legacyExtend ? 'legacy-extend-local-css' : 'pending-section-implemented';
        if (matches.length) addFinding(findings, knownIssuesOverride, slug, pendingCode, `Pending ${section.status} section ${section.id} is present in project HTML (${section.html_selector}).`);
        for (const file of section.local_files) {
          const path = join(projectDirectory, file);
          if (!existsSync(path)) continue;
          const css = readFileSync(path, 'utf8');
          for (const selector of section.local_selectors) {
            if (selectorPattern(selector).test(css)) addFinding(findings, knownIssuesOverride, slug, legacyExtend ? 'legacy-extend-local-css' : 'pending-local-css', `Pending ${section.status} section ${section.id} is present in local CSS: ${file} (${selector}).`);
          }
        }
      }
    }
  }

  for (const { source, html, element } of topLevelSections(pages)) {
    const covered = parsed.entries.some((section) => section.html_selector && simpleSelectorMatches(section.html_selector, element) === true);
    if (!covered) addFinding(findings, knownIssuesOverride, slug, 'unmapped-html-section', `Unmapped HTML section: ${describeElement(source, html, element)}.`, {}, strict ? 'error' : 'warning');
  }

  const errors = findings.filter((finding) => finding.status === 'error');
  return { errors, warnings: findings.filter((finding) => finding.status === 'warning'), sections: parsed.entries, metrics: complianceMetrics(pages, parsed.entries, errors) };
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
    if (process.argv.includes('--json')) console.log(JSON.stringify({ slug, errors: result.errors, warnings: result.warnings, metrics: result.metrics }, null, 2));
    else if (!result.errors.length) console.log(`check:compliance passed for ${slug} (${result.warnings.length} warning(s)).`);
    process.exitCode = result.errors.length ? 1 : 0;
  }
}
