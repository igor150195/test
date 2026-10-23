import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const prohibitedSyntax = [
  { expression: /^\s*@use\b/i, name: '@use' },
  { expression: /^\s*@forward\b/i, name: '@forward' },
  { expression: /\bsass:/i, name: 'sass:* module namespace' }
];

function scssFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.scss'))
    .map((entry) => join(directory, entry.name));
}

export function sassCompatibilityFiles(root = repositoryRoot) {
  const projectRoot = join(root, 'projects');
  const projectFiles = existsSync(projectRoot)
    ? readdirSync(projectRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => scssFiles(join(projectRoot, entry.name, 'styles')))
    : [];
  return [
    ...projectFiles,
    ...scssFiles(join(root, 'design-system', 'templates', 'project', 'styles'))
  ].sort();
}

export function checkSassCompatibility(root = repositoryRoot) {
  const files = sassCompatibilityFiles(root);
  const findings = [];
  for (const file of files) {
    readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, index) => {
      for (const syntax of prohibitedSyntax) {
        if (syntax.expression.test(line)) {
          findings.push({
            file: relative(root, file).replaceAll('\\', '/'),
            line: index + 1,
            syntax: syntax.name
          });
        }
      }
    });
  }
  return { files, findings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = checkSassCompatibility();
  for (const finding of result.findings) {
    console.error(`${finding.file}:${finding.line}: S3/scssphp compatibility forbids ${finding.syntax}. Use @import only.`);
  }
  if (result.findings.length) {
    process.exitCode = 1;
  } else {
    console.log(`check:sass-compat passed (${result.files.length} project/template SCSS files checked).`);
  }
}
