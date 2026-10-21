import { validateKnowledge } from './kb-utils.mjs';

try {
  const inbox = process.argv.slice(2).includes('--inbox');
  const { entries, errors } = validateKnowledge({ collection: inbox ? 'inbox' : 'patterns', inbox });
  if (errors.length) {
    console.error(`kb:validate failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`kb:validate${inbox ? ' --inbox' : ''} passed (${entries.length} knowledge entr${entries.length === 1 ? 'y' : 'ies'}).`);
  }
} catch (error) {
  console.error(`kb:validate failed: ${error.message}`);
  process.exitCode = 1;
}
