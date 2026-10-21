import { readFileSync, writeFileSync } from 'node:fs';
import { catalogPath, catalogRecords, repositoryRoot, validateCatalog } from './catalog-utils.mjs';

const checkOnly = process.argv.slice(2).includes('--check');
const normalizeLineEndings = (value) => value.replaceAll('\r\n', '\n');
const { entries, errors, warnings } = validateCatalog();
if (!checkOnly) warnings.forEach((warning) => console.warn(`warning: ${warning}`));
if (errors.length) {
  console.error(`catalog:build failed because catalog:validate found ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  const output = `${JSON.stringify({ schema_version: 1, generated_from: 'component and block index frontmatter', entries: catalogRecords(entries) }, null, 2)}\n`;
  const current = (() => { try { return readFileSync(catalogPath, 'utf8'); } catch { return null; } })();
  if (checkOnly) {
    if (current === null || normalizeLineEndings(current) !== output) {
      console.error(`catalog:build --check failed: ${catalogPath.replace(`${repositoryRoot}\\`, '')} is stale or missing.`);
      process.exitCode = 1;
    } else {
      console.log(`catalog:build --check passed (${entries.length} entries).`);
    }
  } else {
    writeFileSync(catalogPath, output);
    console.log(`catalog:build wrote design-system/catalog.json (${entries.length} entries).`);
  }
}
