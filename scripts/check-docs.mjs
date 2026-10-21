import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const documentationRoots = ['docs', 'design-system/docs', '.agents/skills', 'codex-site-generation-kit'];
const excludedDirectories = new Set(['.git', 'node_modules', 'dist', 'artifacts']);
const intentionallyRepeatedNames = new Set([
  'README.md',
  'index.md',
  'page-blueprint.md',
  'qa-report.md',
  'reference-analysis.md',
  'token-map.md'
]);

function walkMarkdown(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return excludedDirectories.has(entry.name) ? [] : walkMarkdown(entryPath);
    }
    return extname(entry.name).toLowerCase() === '.md' ? [entryPath] : [];
  });
}

function documentIdentity(documentPath) {
  const name = basename(documentPath);
  return name === 'SKILL.md' ? `${name}:${basename(dirname(documentPath))}` : name;
}

function markdownDestinations(contents) {
  const withoutCodeBlocks = contents.replace(/```[\s\S]*?```/g, '');
  return [...withoutCodeBlocks.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)]
    .map((match) => match[1].trim())
    .map((destination) => destination.replace(/^<(.+)>$/, '$1'))
    .map((destination) => destination.split(/\s+["']/)[0])
    .filter(Boolean);
}

function isExternal(destination) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(destination);
}

function npmCommands(contents) {
  return [...contents.matchAll(/\bnpm\s+run\s+([a-zA-Z0-9:_-]+)/g)].map((match) => match[1]);
}

export function checkDocumentation({ root = repositoryRoot, roots = documentationRoots } = {}) {
  const documents = roots.flatMap((directory) => walkMarkdown(resolve(root, directory)));
  const errors = [];
  const byName = new Map();
  const packagePath = resolve(root, 'package.json');
  const scripts = existsSync(packagePath) ? JSON.parse(readFileSync(packagePath, 'utf8')).scripts ?? {} : {};

  for (const documentPath of documents) {
    const contents = readFileSync(documentPath, 'utf8');
    const name = basename(documentPath);
    if (!intentionallyRepeatedNames.has(name)) {
      const identity = documentIdentity(documentPath);
      const records = byName.get(identity) ?? [];
      records.push({ path: documentPath, contents });
      byName.set(identity, records);
    }

    for (const destination of markdownDestinations(contents)) {
      if (isExternal(destination)) continue;
      const target = destination.split('#', 1)[0];
      if (!target) continue;
      const resolved = resolve(documentPath, '..', decodeURIComponent(target));
      if (!existsSync(resolved) || !statSync(resolved).isFile()) {
        errors.push(`${relative(root, documentPath).replaceAll('\\', '/')}: missing local link ${destination} -> ${relative(root, resolved).replaceAll('\\', '/')}`);
      }
    }

    if (documentPath.includes(`${resolve(root, '.agents/skills')}\\`) || documentPath.includes(`${resolve(root, '.agents/skills')}/`)) {
      for (const command of npmCommands(contents)) if (!Object.hasOwn(scripts, command)) errors.push(`${relative(root, documentPath).replaceAll('\\', '/')}: references missing npm script ${command}`);
    }
  }

  for (const [identity, records] of byName) {
    const distinctContents = new Set(records.map((record) => record.contents));
    if (distinctContents.size > 1) {
      errors.push(`conflicting documentation copies named ${identity}: ${records.map((record) => relative(root, record.path).replaceAll('\\', '/')).join(', ')}`);
    }
  }
  return { documents, errors };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { documents, errors } = checkDocumentation();
  if (errors.length) {
    console.error(`check:docs failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`check:docs passed (${documents.length} Markdown files checked).`);
  }
}
