import { validateKnowledge } from './kb-utils.mjs';

try {
  const { entries, errors } = validateKnowledge();
  if (errors.length) {
    console.error(`kb:validate failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`kb:validate passed (${entries.length} knowledge entr${entries.length === 1 ? 'y' : 'ies'}).`);
  }
} catch (error) {
  console.error(`kb:validate failed: ${error.message}`);
  process.exitCode = 1;
}
