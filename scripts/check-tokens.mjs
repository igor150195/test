import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssDefinesClass, customPropertyAssignments, dsClassesInHtml, shouldCheckVariableReference, variableReferences } from './css-contracts.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const knownIssues = JSON.parse(readFileSync(resolve(repositoryRoot, 'scripts/known-token-issues.json'), 'utf8'));
const sourceExtensions = new Set(['.css', '.scss', '.html']);
const tokenDefinitions = new Map();
const allDefinedTokens = new Set();
const tokenReferences = new Map();
const sourceFiles = [];
const htmlFiles = [];

function walk(directory, predicate = () => true) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) return predicate(entry, entryPath) ? walk(entryPath, predicate) : [];
    return [entryPath];
  });
}

function relativePath(path) {
  return relative(repositoryRoot, path).replaceAll('\\', '/');
}

function addRecord(collection, key, record) {
  const records = collection.get(key) ?? [];
  records.push(record);
  collection.set(key, records);
}

function declarationScope(contents, offset) {
  const stack = [];
  let headerStart = 0;
  for (let index = 0; index < offset; index += 1) {
    if (contents[index] === '{') {
      const header = contents.slice(headerStart, index).trim();
      stack.push(header.startsWith('@media') ? header : '');
      headerStart = index + 1;
    } else if (contents[index] === '}') {
      stack.pop();
      headerStart = index + 1;
    }
  }
  return stack.filter(Boolean).join(' > ') || 'default';
}

for (const tokenFile of walk(resolve(repositoryRoot, 'design-system/tokens'))) {
  if (extname(tokenFile) !== '.css') continue;
  const contents = readFileSync(tokenFile, 'utf8');
  for (const match of contents.matchAll(/(--[a-zA-Z0-9_-]+)\s*:\s*([^;{}]+);/g)) {
    addRecord(tokenDefinitions, match[1], {
      value: match[2].trim(),
      path: relativePath(tokenFile),
      scope: declarationScope(contents, match.index)
    });
    allDefinedTokens.add(match[1]);
  }
}

for (const root of ['design-system', 'projects']) {
  for (const sourceFile of walk(resolve(repositoryRoot, root), (entry) => !['docs', 'artifacts', 'dist'].includes(entry.name))) {
    if (!sourceExtensions.has(extname(sourceFile))) continue;
    sourceFiles.push(sourceFile);
    if (extname(sourceFile) === '.html') htmlFiles.push(sourceFile);
  }
}

for (const sourceFile of sourceFiles) {
  const contents = readFileSync(sourceFile, 'utf8');
  for (const token of customPropertyAssignments(contents)) {
    allDefinedTokens.add(token);
  }
  for (const reference of variableReferences(contents)) {
    if (!shouldCheckVariableReference(reference, knownIssues.dynamicTokenPrefixes)) continue;
    const { token } = reference;
    addRecord(tokenReferences, token, relativePath(sourceFile));
  }
}

const warnings = [];
const errors = [];
const known = [];

for (const [token, definitions] of tokenDefinitions) {
  const definitionsByScope = new Map();
  for (const definition of definitions) {
    addRecord(definitionsByScope, definition.scope, definition);
  }
  const conflictingScope = [...definitionsByScope.entries()].find(([, scopedDefinitions]) => (
    new Set(scopedDefinitions.map((definition) => definition.value)).size > 1
  ));
  if (conflictingScope) {
    const [scope, scopedDefinitions] = conflictingScope;
    const values = [...new Set(scopedDefinitions.map((definition) => definition.value))];
    if (knownIssues.tokenConflicts[token]) {
      known.push(`known token conflict: ${token}; ${knownIssues.tokenConflicts[token].reason}`);
    } else {
      errors.push(`conflicting token values: ${token} -> ${values.join(' | ')} in ${scope} (${scopedDefinitions.map((definition) => definition.path).join(', ')})`);
    }
    continue;
  }
  if (definitions.length > 1) {
    const values = [...new Set(definitions.map((definition) => definition.value))];
    if (values.length === 1) {
    warnings.push(`duplicate token with identical values: ${token} = ${values[0]} (${definitions.map((definition) => definition.path).join(', ')})`);
    }
  }
}

for (const [token, references] of tokenReferences) {
  if (allDefinedTokens.has(token)) continue;
  if (knownIssues.undefinedTokens[token]) {
    known.push(`known undefined token: ${token}; ${knownIssues.undefinedTokens[token].reason} Referenced by: ${[...new Set(references)].join(', ')}`);
  } else {
    errors.push(`undefined token: ${token}; referenced by ${[...new Set(references)].join(', ')}`);
  }
}

const usedDsClasses = new Map();
for (const htmlFile of htmlFiles) {
  const contents = readFileSync(htmlFile, 'utf8');
  for (const className of dsClassesInHtml(contents)) {
    addRecord(usedDsClasses, className, relativePath(htmlFile));
  }
}

const builtCss = walk(resolve(repositoryRoot, 'dist/css'))
  .filter((file) => extname(file) === '.css')
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');
for (const [className, references] of usedDsClasses) {
  if (cssDefinesClass(builtCss, className)) continue;
  if (knownIssues.undefinedClasses[className]) {
    known.push(`known undefined CSS class: .${className}; ${knownIssues.undefinedClasses[className].reason} Used by: ${[...new Set(references)].join(', ')}`);
  } else {
    errors.push(`undefined CSS class: .${className}; used by ${[...new Set(references)].join(', ')}`);
  }
}

if (known.length) {
  console.warn(`Known token/CSS issues (${known.length}):`);
  known.forEach((issue) => console.warn(`- ${issue}`));
}
if (warnings.length) {
  console.warn(`Warnings (${warnings.length}):`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
if (errors.length) {
  console.error(`check:tokens failed (${errors.length} new issue${errors.length === 1 ? '' : 's'}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`check:tokens passed (${known.length} known issue${known.length === 1 ? '' : 's'} recorded).`);
}
