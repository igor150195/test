import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { verifyFooterBgCompatibility } from '../footer-bg-compatibility.mjs';

const root = mkdtempSync(join(tmpdir(), 'footer-bg-compatibility-'));
const before = join(root, 'before');
const after = join(root, 'after');
const comment = '  /* Footer surface falls back to the existing main text accent. */\n';

function write(directory, file, contents) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, file), contents, 'utf8');
}

try {
  const tokenBefore = ':root {\n  --on_bg_main_accent_1: rgba(21, 16, 55, .1);\n}\n';
  const tokenAfter = ':root {\n  --on_bg_main_accent_1: rgba(21, 16, 55, .1);\n' + comment + '  --footer_bg: var(--on_bg_main_accent);\n}\n';
  const blocksBefore = '.ds-footer {\n  background-color: var(--on_bg_main_accent);\n}\n';
  const blocksAfter = '.ds-footer {\n  background-color: var(--footer_bg);\n}\n';
  for (const file of ['tokens.css', 'core.css']) {
    write(before, file, tokenBefore);
    write(after, file, tokenAfter);
  }
  write(before, 'components.css', '.ds-button {}\n');
  write(after, 'components.css', '.ds-button {}\n');
  write(before, 'blocks.css', blocksBefore);
  write(after, 'blocks.css', blocksAfter);
  assert.doesNotThrow(() => verifyFooterBgCompatibility(before, after), 'the single documented comment must be ignored');

  writeFileSync(join(after, 'blocks.css'), `${blocksAfter}/* unexpected */\n`, 'utf8');
  assert.throws(() => verifyFooterBgCompatibility(before, after), /Unexpected normalized CSS diff/, 'any additional CSS line must fail');
  console.log('footer-bg compatibility: only the documented comment is ignored.');
} finally {
  rmSync(root, { recursive: true, force: true });
}
