import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const shaPattern = /^git:[0-9a-f]{40}$/;
const slugPattern = /^[a-z0-9][a-z0-9-]*$/;

export function validateProjectManifest(manifest, projectDirectory) {
  const errors = [];
  const required = ['schema_version', 'slug', 'type', 'mode', 'platform', 'generator_version', 'ds_version', 'compliance', 'pages', 'files', 'external_dependencies'];
  required.forEach((key) => {
    if (!(key in manifest)) errors.push(`missing required property: ${key}`);
  });
  if (manifest.schema_version !== 1) errors.push('schema_version must equal 1');
  if (!slugPattern.test(manifest.slug ?? '')) errors.push('slug must be lowercase kebab-case');
  if (!['reference', 'brief'].includes(manifest.mode)) errors.push('mode must be reference or brief');
  if (manifest.platform !== 'static-html') errors.push('platform must be static-html');
  ['generator_version', 'ds_version'].forEach((key) => {
    if (!shaPattern.test(manifest[key] ?? '')) errors.push(`${key} must be a full git SHA prefixed with git:`);
  });
  if (!['legacy', 'strict'].includes(manifest.compliance)) errors.push('compliance must be legacy or strict');
  if (!Array.isArray(manifest.pages) || !manifest.pages.length) {
    errors.push('pages must contain at least one page');
  } else {
    manifest.pages.forEach((page, index) => {
      if (!page || !['id', 'source', 'output', 'route'].every((key) => typeof page[key] === 'string' && page[key])) {
        errors.push(`pages[${index}] must define id, source, output and route`);
        return;
      }
      if (!existsSync(join(projectDirectory, page.source))) errors.push(`pages[${index}].source does not exist: ${page.source}`);
    });
  }
  if (!Array.isArray(manifest.files)) {
    errors.push('files must be an array');
  } else {
    manifest.files.forEach((file, index) => {
      if (!file || typeof file.path !== 'string' || !['generated', 'owner'].includes(file.owner)) {
        errors.push(`files[${index}] must define path and owner generated|owner`);
      }
    });
  }
  if (!Array.isArray(manifest.external_dependencies)) {
    errors.push('external_dependencies must be an array');
  } else {
    manifest.external_dependencies.forEach((dependency, index) => {
      if (!dependency || !['reference', 'image', 'video', 'link', 'font', 'other'].includes(dependency.kind) || !/^https:\/\//.test(dependency.url ?? '') || typeof dependency.required !== 'boolean') {
        errors.push(`external_dependencies[${index}] must define kind, https url and required`);
      }
    });
  }
  return errors;
}

function usage() {
  console.error('Usage: node scripts/check-project-manifest.mjs <project-slug>');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2];
  if (!slug || !slugPattern.test(slug)) {
    usage();
    process.exitCode = 1;
  } else {
    const projectDirectory = join(repositoryRoot, 'projects', slug);
    const manifestPath = join(projectDirectory, 'project.json');
    if (!existsSync(manifestPath)) {
      console.error(`Missing project manifest: ${manifestPath}`);
      process.exitCode = 1;
    } else {
      let manifest;
      try {
        manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      } catch (error) {
        console.error(`Invalid JSON in ${manifestPath}: ${error.message}`);
        process.exitCode = 1;
      }
      if (manifest) {
        const errors = validateProjectManifest(manifest, projectDirectory);
        if (errors.length) {
          console.error(`check:project failed for ${slug}:`);
          errors.forEach((error) => console.error(`- ${error}`));
          process.exitCode = 1;
        } else {
          console.log(`check:project passed for ${slug}.`);
        }
      }
    }
  }
}
