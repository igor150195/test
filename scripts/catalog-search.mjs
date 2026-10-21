import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { catalogPath, searchCatalog } from './catalog-utils.mjs';

export const noMatchingEntriesMessage = 'No matching entries. Retry by purpose/kind/token/a11y filters; only if no entry fits after that, classify the need as EXTEND or BLOCKED under Design System First; do not invent a local API.';

const supportedFlags = new Set(['--kind', '--maturity', '--platform', '--class', '--purpose', '--token', '--a11y']);

function valuesFor(argv, argument) {
  const values = [];
  for (let index = 0; index < argv.length; index += 1) if (argv[index] === argument && argv[index + 1]) values.push(argv[index + 1]);
  return values;
}

export function parseCatalogSearchArgs(argv) {
  const argumentsOnly = argv.slice(2);
  for (let index = 0; index < argumentsOnly.length; index += 1) {
    const argument = argumentsOnly[index];
    if (!argument.startsWith('--')) continue;
    if (!supportedFlags.has(argument)) throw new Error(`catalog:search: unsupported flag ${argument}`);
    if (!argumentsOnly[index + 1] || argumentsOnly[index + 1].startsWith('--')) throw new Error(`catalog:search: ${argument} requires a value`);
    index += 1;
  }
  return {
    kind: valuesFor(argv, '--kind'), maturity: valuesFor(argv, '--maturity'), platform: valuesFor(argv, '--platform'),
    className: valuesFor(argv, '--class'), purpose: valuesFor(argv, '--purpose'), token: valuesFor(argv, '--token'), a11y: valuesFor(argv, '--a11y')
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!existsSync(catalogPath)) {
    console.error('catalog:search prerequisite failed: design-system/catalog.json is missing; run npm run catalog:build first.');
    process.exitCode = 1;
  } else {
    try {
      const filters = parseCatalogSearchArgs(process.argv);
      const records = JSON.parse(readFileSync(catalogPath, 'utf8')).entries;
      const matches = searchCatalog(records, filters);
      if (!matches.length) console.log(`catalog:search: ${noMatchingEntriesMessage}`);
      else matches.forEach((record) => console.log(`${record.id}\t${record.kind}\t${record.maturity}\t${record.purpose}\t${record.source}`));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
