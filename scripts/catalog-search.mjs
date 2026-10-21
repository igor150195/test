import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { catalogPath, searchCatalog } from './catalog-utils.mjs';

export const noMatchingEntriesMessage = 'No matching entries. Retry by purpose/kind/token/a11y filters; only if no entry fits after that, classify the need as EXTEND or BLOCKED under Design System First; do not invent a local API.';

function valuesFor(argument) {
  const values = [];
  for (let index = 0; index < process.argv.length; index += 1) if (process.argv[index] === argument && process.argv[index + 1]) values.push(process.argv[index + 1]);
  return values;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!existsSync(catalogPath)) {
    console.error('catalog:search prerequisite failed: design-system/catalog.json is missing; run npm run catalog:build first.');
    process.exitCode = 1;
  } else {
    const filters = { kind: valuesFor('--kind'), maturity: valuesFor('--maturity'), platform: valuesFor('--platform'), className: valuesFor('--class'), purpose: valuesFor('--purpose'), token: valuesFor('--token'), a11y: valuesFor('--a11y') };
    const records = JSON.parse(readFileSync(catalogPath, 'utf8')).entries;
    const matches = searchCatalog(records, filters);
    if (!matches.length) console.log(`catalog:search: ${noMatchingEntriesMessage}`);
    else matches.forEach((record) => console.log(`${record.id}\t${record.kind}\t${record.maturity}\t${record.purpose}\t${record.source}`));
  }
}
