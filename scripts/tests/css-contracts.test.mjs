import assert from 'node:assert/strict';
import { cssDefinesClass, customPropertyAssignments, dsClassesInHtml, shouldCheckVariableReference, variableReferences } from '../css-contracts.mjs';

assert.deepEqual(customPropertyAssignments(':root { --defined: 1; }'), ['--defined']);
const references = variableReferences('a { color: var(--defined); border: var(--fallback, red); width: var(--gr_dynamic); }');
assert.equal(shouldCheckVariableReference(references[0], ['--gr_']), true);
assert.equal(shouldCheckVariableReference(references[1], ['--gr_']), false);
assert.equal(shouldCheckVariableReference(references[2], ['--gr_']), false);
assert.deepEqual(dsClassesInHtml('<div class="ds-button ds-button--primary"></div>'), ['ds-button', 'ds-button--primary']);
assert.equal(cssDefinesClass('.ds-button:hover {}', 'ds-button'), true);
assert.equal(cssDefinesClass('.ds-buttonish {}', 'ds-button'), false);
console.log('css-contracts tests passed.');
