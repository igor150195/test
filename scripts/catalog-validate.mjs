import { validateCatalog } from './catalog-utils.mjs';

try {
  const { entries, errors, warnings, unowned } = validateCatalog();
  warnings.forEach((warning) => console.warn(`warning: ${warning}`));
  if (errors.length) {
    console.error(`catalog:validate failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`catalog:validate passed (${entries.length} entries; ${unowned.length} known catalog gaps).`);
  }
} catch (error) {
  console.error(`catalog:validate failed: ${error.message}`);
  process.exitCode = 1;
}
