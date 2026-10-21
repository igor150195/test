import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssDefinesClass, customPropertyAssignments } from './css-contracts.mjs';

export const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const knowledgeRoot = resolve(repositoryRoot, 'design-system/docs/generation/knowledge');

function parseFailure(path, line, message) {
  throw new Error(`${path}:${line}: unsupported YAML frontmatter: ${message}`);
}

function parseScalar(raw, path, line) {
  const value = raw.trim();
  if (!value) parseFailure(path, line, 'empty scalar');
  if (/^[&*!]|[|>]/.test(value)) parseFailure(path, line, 'anchors, aliases, tags and multiline scalars are not supported');
  if (value.startsWith('{') || value.endsWith('}') || value.startsWith('[') || value.endsWith(']')) {
    if (!(value.startsWith('[') && value.endsWith(']'))) parseFailure(path, line, 'inline objects and malformed arrays are not supported');
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((item) => {
      const scalar = item.trim();
      if (!scalar || /[\[\]{}&*!|>]/.test(scalar)) parseFailure(path, line, 'array items must be plain strings');
      return scalar;
    });
  }
  if (value.startsWith('{') || value.endsWith('}')) parseFailure(path, line, 'inline mappings are not supported');
  return value;
}

/**
 * Parses the intentionally small YAML subset documented in knowledge/README.
 * It accepts root scalar/array keys and one nested map or list level only.
 */
export function parseKnowledgeFrontmatter(contents, path = '<memory>') {
  const lines = contents.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines[0] !== '---') throw new Error(`${path}:1: expected opening --- frontmatter delimiter`);
  const closingIndex = lines.slice(1).findIndex((line) => line === '---');
  if (closingIndex === -1) throw new Error(`${path}: missing closing --- frontmatter delimiter`);
  const end = closingIndex + 1;
  const record = {};
  let pending = null;

  for (let index = 1; index < end; index += 1) {
    const line = lines[index];
    const number = index + 1;
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (line.includes('\t')) parseFailure(path, number, 'tabs are not supported');
    const indent = line.match(/^ */)[0].length;
    const text = line.trim();
    if (indent === 0) {
      const match = text.match(/^([a-z][a-z0-9_]*)\s*:(.*)$/);
      if (!match) parseFailure(path, number, 'expected a root key');
      const [, key, raw] = match;
      if (Object.hasOwn(record, key)) parseFailure(path, number, `duplicate key ${key}`);
      const value = raw.trim();
      if (value) {
        record[key] = parseScalar(value, path, number);
        pending = null;
      } else {
        record[key] = undefined;
        pending = { key, line: number, type: null };
      }
      continue;
    }
    if (indent !== 2 || !pending) parseFailure(path, number, 'only one nested indentation level of two spaces is supported');
    if (text.startsWith('- ')) {
      if (pending.type && pending.type !== 'array') parseFailure(path, number, `cannot mix a map and list under ${pending.key}`);
      pending.type = 'array';
      record[pending.key] ??= [];
      record[pending.key].push(parseScalar(text.slice(2), path, number));
      continue;
    }
    const nested = text.match(/^([a-z][a-z0-9_]*)\s*:(.*)$/);
    if (!nested) parseFailure(path, number, 'expected a nested key or list item');
    if (pending.type && pending.type !== 'map') parseFailure(path, number, `cannot mix a map and list under ${pending.key}`);
    pending.type = 'map';
    record[pending.key] ??= {};
    const [, nestedKey, raw] = nested;
    if (Object.hasOwn(record[pending.key], nestedKey)) parseFailure(path, number, `duplicate nested key ${nestedKey}`);
    if (!raw.trim()) parseFailure(path, number, 'nested mappings and lists deeper than one level are not supported');
    record[pending.key][nestedKey] = parseScalar(raw, path, number);
  }
  if (pending && record[pending.key] === undefined) parseFailure(path, pending.line, `key ${pending.key} has no value`);
  return record;
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

export function loadKnowledgeEntries({ root = knowledgeRoot } = {}) {
  const patternsRoot = resolve(root, 'patterns');
  return walk(patternsRoot)
    .filter((file) => extname(file) === '.md')
    .sort()
    .map((file) => ({
      file,
      path: relative(root, file).replaceAll('\\', '/'),
      entry: parseKnowledgeFrontmatter(readFileSync(file, 'utf8'), relative(repositoryRoot, file).replaceAll('\\', '/'))
    }));
}

function assert(condition, errors, message) {
  if (!condition) errors.push(message);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

function validateEntryShape(entry, label) {
  const errors = [];
  const allowed = new Set(['id', 'title', 'kind', 'status', 'scope', 'platform', 'industry', 'page_types', 'tags', 'requires', 'variants', 'data_needed', 'viewports_checked', 'evidence', 'review_after', 'supersedes', 'applies_when', 'not_when']);
  const required = [...allowed];
  for (const field of required) assert(Object.hasOwn(entry, field), errors, `${label}: missing required field ${field}`);
  for (const field of Object.keys(entry)) assert(allowed.has(field), errors, `${label}: unknown field ${field}`);
  assert(/^KBP-\d{4}$/.test(entry.id ?? ''), errors, `${label}: id must match KBP-0000`);
  assert(typeof entry.title === 'string' && entry.title.length > 0, errors, `${label}: title must be a non-empty string`);
  assert(['composition', 'interaction', 'technical', 'pitfall', 'token-rule', 'quality-workflow'].includes(entry.kind), errors, `${label}: invalid kind`);
  assert(['candidate', 'verified', 'approved', 'deprecated'].includes(entry.status), errors, `${label}: invalid status`);
  assert(['universal', 'platform', 'industry', 'project-only'].includes(entry.scope), errors, `${label}: invalid scope`);
  assert(['neutral', 'shop2', 'legacy'].includes(entry.platform), errors, `${label}: invalid platform`);
  for (const field of ['industry', 'page_types', 'tags', 'variants', 'data_needed', 'supersedes', 'applies_when', 'not_when']) assert(isStringArray(entry[field]), errors, `${label}: ${field} must be an array of strings`);
  assert(isStringArray(entry.viewports_checked) && entry.viewports_checked.every((viewport) => /^\d+x\d+$/.test(viewport)), errors, `${label}: viewports_checked must contain WIDTHxHEIGHT values`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.review_after ?? ''), errors, `${label}: review_after must be YYYY-MM-DD`);
  assert(entry.requires && typeof entry.requires === 'object' && !Array.isArray(entry.requires), errors, `${label}: requires must be an object`);
  const requiredKeys = ['components', 'tokens', 'optional_tokens'];
  for (const key of requiredKeys) assert(isStringArray(entry.requires?.[key]), errors, `${label}: requires.${key} must be an array of strings`);
  if (entry.requires) for (const key of Object.keys(entry.requires)) assert(requiredKeys.includes(key), errors, `${label}: unknown requires key ${key}`);
  assert(entry.evidence && typeof entry.evidence === 'object' && !Array.isArray(entry.evidence), errors, `${label}: evidence must be an object`);
  const evidenceKeys = ['implementation', 'technical_check', 'visual_check', 'projects', 'limitations'];
  for (const key of evidenceKeys) {
    const valid = ['projects', 'limitations'].includes(key) ? isStringArray(entry.evidence?.[key]) : typeof entry.evidence?.[key] === 'string';
    assert(valid, errors, `${label}: evidence.${key} has an invalid type`);
  }
  if (entry.evidence) for (const key of Object.keys(entry.evidence)) assert(evidenceKeys.includes(key), errors, `${label}: unknown evidence key ${key}`);
  return errors;
}

function safeEvidencePath(repoRoot, value) {
  const pathPart = value.split('#', 1)[0];
  if (!pathPart || pathPart.startsWith('/') || pathPart.includes('..')) return null;
  const resolved = resolve(repoRoot, pathPart);
  return resolved.startsWith(`${repoRoot}\\`) || resolved === repoRoot ? resolved : null;
}

export function knowledgeTrust(status) {
  return ({ candidate: 'low', verified: 'medium', approved: 'high', deprecated: 'low' })[status] ?? 'low';
}

export function normalizeDuplicateKey(entry) {
  const normalized = (items) => [...items].map((item) => item.toLowerCase()).sort().join('|');
  return [entry.kind, normalized(entry.tags), normalized(entry.requires.components), normalized(entry.requires.tokens), normalized(entry.requires.optional_tokens)].join('::');
}

export function validateKnowledge({ root = knowledgeRoot, repoRoot = repositoryRoot, css = null } = {}) {
  const entries = loadKnowledgeEntries({ root });
  const errors = [];
  const definedTokens = new Set();
  const builtCss = css ?? walk(resolve(repoRoot, 'dist/css')).filter((file) => extname(file) === '.css').map((file) => readFileSync(file, 'utf8')).join('\n');
  customPropertyAssignments(builtCss).forEach((token) => definedTokens.add(token));
  const ids = new Map();
  const duplicates = new Map();

  for (const { entry, file, path } of entries) {
    const label = relative(repoRoot, file).replaceAll('\\', '/');
    errors.push(...validateEntryShape(entry, label));
    if (entry.id) {
      if (ids.has(entry.id)) errors.push(`${label}: duplicate id ${entry.id}; first declared by ${ids.get(entry.id)}`);
      else ids.set(entry.id, label);
    }
    if (entry.kind && entry.tags && entry.requires) {
      const key = normalizeDuplicateKey(entry);
      if (duplicates.has(key)) errors.push(`${label}: duplicate kind+tags+requires signature; first declared by ${duplicates.get(key)}`);
      else duplicates.set(key, label);
    }
    for (const field of ['implementation', 'technical_check', 'visual_check']) {
      const resolved = safeEvidencePath(repoRoot, entry.evidence?.[field] ?? '');
      if (!resolved || !existsSync(resolved)) errors.push(`${label}: evidence.${field} does not reference an existing repository file`);
    }
    for (const token of entry.requires?.tokens ?? []) if (!definedTokens.has(token)) errors.push(`${label}: requires.tokens references undefined token ${token}`);
    for (const className of entry.requires?.components ?? []) if (!cssDefinesClass(builtCss, className.replace(/^\./, ''))) errors.push(`${label}: requires.components references undefined CSS class ${className}`);
  }
  return { entries, errors };
}

export function yamlScalar(value) {
  if (Array.isArray(value)) return `[${value.join(', ')}]`;
  return String(value);
}
