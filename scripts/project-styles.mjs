import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'sass';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const starter = `/**
 * Ручные изменения владельца проекта.
 *
 * Этот файл подключается после дизайн-системы и сгенерированных стилей проекта.
 * Генератор создаёт его только при отсутствии файла и никогда не перезаписывает.
 */
`;

function assertProjectSlug(slug) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error(`Invalid project slug: ${slug}`);
  }
}

export function getProjectDirectory(slug) {
  assertProjectSlug(slug);
  return join(repositoryRoot, 'projects', slug);
}

export function ensureCustomScss(projectDirectory) {
  const customScss = join(projectDirectory, 'styles', 'custom.scss');

  if (existsSync(customScss)) {
    return { path: customScss, created: false };
  }

  mkdirSync(dirname(customScss), { recursive: true });
  writeFileSync(customScss, starter, 'utf8');
  return { path: customScss, created: true };
}

export function buildCustomScss(projectDirectory, outputRelativePath = 'css/custom.css') {
  const source = ensureCustomScss(projectDirectory).path;
  const output = join(projectDirectory, outputRelativePath);
  mkdirSync(dirname(output), { recursive: true });

  const result = compile(source, { style: 'expanded', sourceMap: false });
  writeFileSync(output, result.css, 'utf8');

  return { source, output };
}

export function buildProjectScss(projectDirectory, outputRelativePath = 'css/project.css') {
  const source = join(projectDirectory, 'styles', 'project.scss');
  if (!existsSync(source)) {
    return null;
  }

  const output = join(projectDirectory, outputRelativePath);
  mkdirSync(dirname(output), { recursive: true });
  const result = compile(source, { style: 'expanded', sourceMap: false });
  writeFileSync(output, result.css, 'utf8');
  return { source, output };
}

function usage() {
  console.error('Usage: node scripts/project-styles.mjs <init|build> <project-slug> [output-relative-path]');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , command, slug, outputRelativePath] = process.argv;
  if (!command || !slug || !['init', 'build'].includes(command)) {
    usage();
    process.exitCode = 1;
  } else {
    const projectDirectory = getProjectDirectory(slug);
    if (!existsSync(projectDirectory)) {
      throw new Error(`Project directory does not exist: ${projectDirectory}`);
    }

    const result = command === 'init'
      ? ensureCustomScss(projectDirectory)
      : {
          project: buildProjectScss(projectDirectory),
          custom: buildCustomScss(projectDirectory, outputRelativePath)
        };
    console.log(JSON.stringify(result, null, 2));
  }
}
