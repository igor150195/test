import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkSassCompatibility } from '../check-sass-compat.mjs';

const fixture = mkdtempSync(join(tmpdir(), 'sass-compat-'));

function write(relativePath, contents) {
  const file = join(fixture, relativePath);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, contents, 'utf8');
}

try {
  write('projects/fixture/styles/project.scss', '@import "shared";\n.demo { color: inherit; }\n');
  write('design-system/templates/project/styles/custom.scss', '/* owner layer */\n');
  assert.deepEqual(checkSassCompatibility(fixture).findings, [], '@import-only project styles must pass');

  write('projects/fixture/styles/project.scss', '@use "sass:math";\n');
  write('projects/second/styles/custom.scss', '@forward "tokens";\n');
  write('design-system/templates/project/styles/project.scss', '.demo { color: sass:math.div(2, 1); }\n');
  const findings = checkSassCompatibility(fixture).findings;
  assert.deepEqual(
    findings.map((finding) => `${finding.file}:${finding.line}:${finding.syntax}`),
    [
      'design-system/templates/project/styles/project.scss:1:sass:* module namespace',
      'projects/fixture/styles/project.scss:1:@use',
      'projects/fixture/styles/project.scss:1:sass:* module namespace',
      'projects/second/styles/custom.scss:1:@forward'
    ],
    'each forbidden S3-incompatible construct must identify its file and line'
  );
  console.log('check:sass-compat: fixture rejects @use, @forward, and sass:* with file/line evidence.');
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
