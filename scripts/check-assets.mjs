import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { debtReviewWarning } from './known-issues.mjs';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const knownIssues = JSON.parse(readFileSync(join(repositoryRoot, 'scripts', 'known-asset-issues.json'), 'utf8'));

export function resourcesInText(text) {
  const resources = [];
  for (const match of text.matchAll(/\s(?:src|poster)="([^"]+)"|url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) {
    const resource = (match[1] ?? match[2]).split('#', 1)[0];
    if (!resource || resource.startsWith('data:')) continue;
    resources.push(resource);
  }
  return [...new Set(resources)].sort();
}

export function isExternal(resource) {
  return /^https?:\/\//i.test(resource);
}

function findAsset(assets, resource, localPath, projectDirectory) {
  return assets.find((asset) => {
    if (isExternal(resource)) return resource.startsWith(asset.source);
    return asset.local_path && resolve(projectDirectory, localPath) === resolve(projectDirectory, asset.local_path);
  });
}

export function checkAssets(slug) {
  const projectDirectory = join(repositoryRoot, 'projects', slug);
  const assetsPath = join(projectDirectory, 'assets.json');
  if (!existsSync(assetsPath)) throw new Error(`Missing assets manifest: ${assetsPath}`);
  const manifest = JSON.parse(readFileSync(assetsPath, 'utf8'));
  const errors = [];
  const warnings = [];
  const known = knownIssues[slug] ?? {};
  const reviewWarning = debtReviewWarning(known, `known asset debt for ${slug}`);
  if (reviewWarning) warnings.push(`known-debt review: ${reviewWarning}`);
  if (manifest.schema_version !== 1 || !Array.isArray(manifest.assets)) errors.push('assets.json must contain schema_version: 1 and an assets array');
  const assets = manifest.assets ?? [];
  assets.forEach((asset, index) => {
    if (!asset || !['own', 'licensed', 'placeholder', 'unknown'].includes(asset.rights) || !['id', 'source', 'local_path', 'role', 'ratio'].every((key) => key in asset)) {
      errors.push(`assets[${index}] does not match the required asset contract`);
      return;
    }
    if (asset.rights === 'unknown') {
      const message = `unknown rights: ${asset.id} (${asset.source})`;
      if (known.allow_unknown_rights) warnings.push(`known asset debt: ${message}; ${known.reason}`);
      else errors.push(message);
    }
  });

  const sourceFiles = [join(projectDirectory, 'index.html')];
  if (existsSync(join(projectDirectory, 'css', 'custom.css'))) sourceFiles.push(join(projectDirectory, 'css', 'custom.css'));
  if (existsSync(join(projectDirectory, 'css', 'custom-overrides.css'))) sourceFiles.push(join(projectDirectory, 'css', 'custom-overrides.css'));
  const resources = sourceFiles.flatMap((file) => resourcesInText(readFileSync(file, 'utf8')).map((resource) => ({ file, resource })));
  const seenResources = new Set();
  resources.forEach(({ file, resource }) => {
    const localPath = isExternal(resource) ? null : relative(projectDirectory, resolve(file, '..', resource));
    const dedupeKey = `${localPath ?? resource}`;
    if (seenResources.has(dedupeKey)) return;
    seenResources.add(dedupeKey);
    const asset = findAsset(assets, resource, localPath, projectDirectory);
    if (!asset) errors.push(`resource is missing from assets.json: ${resource}`);
    if (isExternal(resource)) {
      const message = `external production resource: ${resource}`;
      if (known.allow_external_resources) warnings.push(`known asset debt: ${message}; ${known.reason}`);
      else errors.push(message);
    } else {
      const resolvedPath = resolve(file, '..', resource);
      if (!existsSync(resolvedPath)) {
        const message = `missing local resource: ${resource}`;
        if (known.allow_missing_local_resources) warnings.push(`known asset debt: ${message}; ${known.reason}`);
        else errors.push(message);
      }
    }
  });
  return { errors, warnings, resources: [...seenResources].sort() };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2];
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error('Usage: node scripts/check-assets.mjs <project-slug>');
    process.exitCode = 1;
  } else {
    try {
      const result = checkAssets(slug);
      result.warnings.forEach((warning) => console.warn(`- ${warning}`));
      if (result.errors.length) {
        console.error(`check:assets failed for ${slug}:`);
        result.errors.forEach((error) => console.error(`- ${error}`));
        process.exitCode = 1;
      } else {
        console.log(`check:assets passed for ${slug} (${result.warnings.length} known warning(s)).`);
      }
    } catch (error) {
      console.error(`check:assets failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
