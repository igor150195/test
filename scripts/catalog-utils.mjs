import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssDefinesClass, customPropertyAssignments, variableReferences } from './css-contracts.mjs';
import { debtReviewWarning } from './known-issues.mjs';
import { parseKnowledgeFrontmatter } from './kb-utils.mjs';

export const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const catalogPath = resolve(repositoryRoot, 'design-system/catalog.json');
const schemaPath = resolve(repositoryRoot, 'schemas/catalog-entry.schema.json');
const structuralPath = resolve(repositoryRoot, 'scripts/documented-structural-classes.json');
const knownGapsPath = resolve(repositoryRoot, 'scripts/known-catalog-gaps.json');

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function listIndexFiles(repoRoot = repositoryRoot) {
  return ['design-system/components', 'design-system/blocks']
    .flatMap((directory) => walk(resolve(repoRoot, directory)))
    .filter((path) => path.endsWith('/index.md') || path.endsWith('\\index.md'))
    .sort();
}

function cssContract(repoRoot = repositoryRoot) {
  const css = walk(resolve(repoRoot, 'dist/css')).filter((path) => extname(path) === '.css').map((path) => readFileSync(path, 'utf8')).join('\n');
  return {
    css,
    classes: new Set([...css.matchAll(/\.(ds-[A-Za-z0-9_-]+)/g)].map((match) => match[1])),
    tokens: new Set(customPropertyAssignments(css))
  };
}

function sourceTokens(indexPath) {
  const css = walk(resolve(indexPath, '..')).filter((path) => extname(path) === '.scss').map((path) => readFileSync(path, 'utf8')).join('\n');
  return [...new Set(variableReferences(css).map((reference) => reference.token))].sort();
}

export function loadCatalogEntries({ repoRoot = repositoryRoot } = {}) {
  return listIndexFiles(repoRoot).map((file) => ({
    file,
    source: relative(repoRoot, file).replaceAll('\\', '/'),
    entry: parseKnowledgeFrontmatter(readFileSync(file, 'utf8'), relative(repoRoot, file).replaceAll('\\', '/')),
    uses_tokens: sourceTokens(file)
  }));
}

function stringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

function shapeErrors(entry, source, vocabulary) {
  const errors = [];
  const fields = ['id', 'kind', 'maturity', 'platform', 'purpose', 'classes', 'structural_classes', 'variants', 'requires', 'public_tokens', 'optional_tokens', 'a11y', 'viewports_verified', 'examples'];
  for (const field of fields) if (!Object.hasOwn(entry, field)) errors.push(`${source}: missing required field ${field}`);
  for (const field of Object.keys(entry)) if (!fields.includes(field)) errors.push(`${source}: unknown frontmatter field ${field}`);
  if (!/^DS[CB]-[a-z0-9-]+$/.test(entry.id ?? '')) errors.push(`${source}: id must match DSC-* or DSB-*`);
  if (!['component', 'block'].includes(entry.kind)) errors.push(`${source}: kind must be component or block`);
  if (!['stable', 'experimental', 'deprecated'].includes(entry.maturity)) errors.push(`${source}: invalid maturity`);
  if (!['neutral', 'shop2', 'legacy'].includes(entry.platform)) errors.push(`${source}: invalid platform`);
  if (typeof entry.purpose !== 'string' || !entry.purpose) errors.push(`${source}: purpose must be a non-empty string`);
  for (const field of ['classes', 'structural_classes']) if (!stringArray(entry[field]) || !entry[field].every((item) => /^\.ds-[a-z0-9_-]+$/.test(item))) errors.push(`${source}: ${field} must be .ds-* strings`);
  for (const field of ['variants', 'public_tokens', 'optional_tokens', 'a11y', 'viewports_verified', 'examples']) if (!stringArray(entry[field])) errors.push(`${source}: ${field} must be an array of strings`);
  if (!entry.requires || !stringArray(entry.requires.components ?? []) || Object.keys(entry.requires).some((key) => key !== 'components')) errors.push(`${source}: requires must contain only components`);
  for (const token of [...(entry.public_tokens ?? []), ...(entry.optional_tokens ?? [])]) if (!/^--[a-z0-9_-]+$/.test(token)) errors.push(`${source}: token ${token} is invalid`);
  for (const viewport of entry.viewports_verified ?? []) if (!/^\d+x\d+$/.test(viewport)) errors.push(`${source}: invalid viewport ${viewport}`);
  for (const rule of entry.a11y ?? []) if (!vocabulary.includes(rule)) errors.push(`${source}: unknown a11y rule ${rule}`);
  return errors;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function validateCatalog({ repoRoot = repositoryRoot, entries: injectedEntries, contract: injectedContract, knownGaps: injectedGaps, structuralContracts: injectedStructural } = {}) {
  const schema = readJson(resolve(repoRoot, relative(repositoryRoot, schemaPath)));
  const vocabulary = schema.$defs.a11yValue.enum;
  const contract = injectedContract ?? cssContract(repoRoot);
  const knownGaps = injectedGaps ?? readJson(resolve(repoRoot, relative(repositoryRoot, knownGapsPath))).classes;
  const structuralContracts = injectedStructural ?? readJson(resolve(repoRoot, relative(repositoryRoot, structuralPath)));
  const entries = injectedEntries ?? loadCatalogEntries({ repoRoot });
  const errors = [];
  const warnings = [];
  const owners = new Map();
  const ids = new Map();

  for (const record of entries) {
    const { entry, source, uses_tokens: usesTokens } = record;
    errors.push(...shapeErrors(entry, source, vocabulary));
    if (ids.has(entry.id)) errors.push(`${source}: duplicate catalog id ${entry.id}; first declared by ${ids.get(entry.id)}`);
    else ids.set(entry.id, source);
    for (const className of entry.classes ?? []) {
      const bare = className.slice(1);
      if (!contract.classes.has(bare)) errors.push(`${source}: classes references CSS class not in dist: ${className}`);
      if (owners.has(bare)) errors.push(`${source}: CSS class ${className} already belongs to ${owners.get(bare)}`);
      else owners.set(bare, source);
    }
    for (const className of entry.structural_classes ?? []) {
      const bare = className.slice(1);
      if (!structuralContracts[bare]) errors.push(`${source}: structural_classes references undocumented structural class ${className}`);
      if ((entry.classes ?? []).includes(className)) errors.push(`${source}: ${className} cannot be both classes and structural_classes`);
    }
    for (const dependency of entry.requires?.components ?? []) if (!cssDefinesClass(contract.css, dependency.slice(1))) errors.push(`${source}: requires.components references CSS class not in dist: ${dependency}`);
    for (const token of entry.public_tokens ?? []) {
      if (!contract.tokens.has(token)) errors.push(`${source}: public_tokens references undefined token ${token}`);
      if (!usesTokens.includes(token)) errors.push(`${source}: public_tokens ${token} is not used by this implementation`);
    }
    for (const token of entry.optional_tokens ?? []) if (!usesTokens.includes(token)) errors.push(`${source}: optional_tokens ${token} is not used by this implementation`);
    for (const example of entry.examples ?? []) {
      const examplePath = resolve(repoRoot, example);
      if (!existsSync(examplePath)) {
        errors.push(`${source}: example path does not exist: ${example}`);
      } else {
        const contents = readFileSync(examplePath, 'utf8');
        const hasOwnedClass = (entry.classes ?? []).some((className) => new RegExp(`\\b${className.slice(1)}\\b`).test(contents));
        if (!hasOwnedClass) errors.push(`${source}: example ${example} contains none of this entry's classes`);
      }
    }
  }
  for (const className of contract.classes) {
    if (owners.has(className)) continue;
    const gap = knownGaps[className];
    if (!gap) {
      errors.push(`CSS class without catalog owner: .${className}`);
      continue;
    }
    if (!gap.reason) errors.push(`known catalog gap .${className} is missing reason`);
    const review = debtReviewWarning(gap, `known catalog gap .${className}`);
    if (review) warnings.push(review);
    warnings.push(`known catalog gap: .${className}; ${gap.reason}`);
  }
  for (const className of Object.keys(knownGaps)) if (!contract.classes.has(className)) errors.push(`known catalog gap .${className} is not a class in dist`);
  return { entries, errors, warnings, unowned: [...contract.classes].filter((className) => !owners.has(className)).sort(), contract };
}

export function catalogRecords(entries) {
  return entries.map(({ entry, source, uses_tokens: usesTokens }) => ({ ...entry, source, uses_tokens: usesTokens })).sort((left, right) => left.id.localeCompare(right.id));
}

export function searchCatalog(records, filters) {
  const term = filters.purpose.map((item) => item.toLowerCase());
  return records.filter((record) => (
    (!filters.kind.length || filters.kind.includes(record.kind)) &&
    (!filters.maturity.length || filters.maturity.includes(record.maturity)) &&
    (!filters.platform.length || filters.platform.includes(record.platform)) &&
    (!filters.className.length || filters.className.some((value) => record.classes.includes(value))) &&
    (!filters.token.length || filters.token.some((value) => record.public_tokens.includes(value) || record.optional_tokens.includes(value) || record.uses_tokens.includes(value))) &&
    (!filters.a11y.length || filters.a11y.some((value) => record.a11y.includes(value))) &&
    (!term.length || term.some((value) => `${record.purpose} ${record.id} ${record.variants.join(' ')}`.toLowerCase().includes(value)))
  )).sort((left, right) => left.id.localeCompare(right.id)).slice(0, 5);
}
