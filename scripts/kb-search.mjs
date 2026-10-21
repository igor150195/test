import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { knowledgeRoot, loadKnowledgeEntries } from './kb-utils.mjs';

export function searchKnowledgeEntries(entries, filters) {
  return entries.filter((entry) => (
    (!filters.status.length || filters.status.includes(entry.status)) &&
    (!filters.scope.length || filters.scope.includes(entry.scope)) &&
    (!filters.platform.length || filters.platform.includes(entry.platform)) &&
    (!filters.pageType.length || filters.pageType.some((value) => entry.page_types.includes(value))) &&
    (!filters.tag.length || filters.tag.some((value) => entry.tags.includes(value)))
  )).sort((left, right) => right.tags.filter((tag) => filters.tag.includes(tag)).length - left.tags.filter((tag) => filters.tag.includes(tag)).length || left.id.localeCompare(right.id)).slice(0, 5);
}

export function appendInboxEntries(entries, { includeInbox = false, root = knowledgeRoot } = {}) {
  if (!includeInbox) return entries;
  return [
    ...entries,
    ...loadKnowledgeEntries({ root, collection: 'inbox' }).map(({ entry, path }) => ({ ...entry, path: `inbox/${path}`, inbox: true }))
  ];
}

export function valuesFor(argv, argument) {
  const values = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === argument && argv[index + 1]) values.push(...argv[index + 1].split(',').map((value) => value.trim()).filter(Boolean));
  }
  return values;
}

const indexPath = resolve(knowledgeRoot, 'index.json');
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href && !existsSync(indexPath)) {
  console.error('kb:search prerequisite failed: knowledge/index.json is missing; run npm run kb:build first.');
  process.exitCode = 1;
} else if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  const filters = {
    status: valuesFor(process.argv, '--status'), scope: valuesFor(process.argv, '--scope'), platform: valuesFor(process.argv, '--platform'), pageType: valuesFor(process.argv, '--page-type'), tag: valuesFor(process.argv, '--tag')
  };
  const matches = searchKnowledgeEntries(appendInboxEntries(index.entries, { includeInbox: process.argv.includes('--include-inbox') }), filters);
  if (!matches.length) {
    console.log('kb:search: no matching knowledge entries. Continue without knowledge-base entries; do not invent entries or open patterns directly instead of search.');
  } else {
    matches.forEach((entry) => console.log(`${entry.id}\t${entry.inbox ? 'inbox candidate — evidence only' : entry.status === 'candidate' ? 'candidate — investigation only' : entry.status}\t${entry.title}\t${entry.path}`));
  }
}
