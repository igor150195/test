import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProjectManifest } from './check-project-manifest.mjs';
import { iconPrefix, rewriteIconSpriteUrls } from './site-build-utils.mjs';
import { debtReviewWarning } from './known-issues.mjs';

const defaultRepositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dsCssFiles = ['tokens.css', 'core.css', 'components.css', 'blocks.css'];
const dsLinkPrefix = '../../dist/css/';
const generatedStyleLink = '<link rel="stylesheet" href="./css/site.css">';
const knownResourceIssues = JSON.parse(readFileSync(join(defaultRepositoryRoot, 'scripts', 'known-resource-issues.json'), 'utf8'));

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

function assertInsideProject(projectDirectory, candidate) {
  const normalizedProject = normalize(projectDirectory + '\\');
  const normalizedCandidate = normalize(candidate);
  if (!normalizedCandidate.startsWith(normalizedProject)) {
    throw new Error(`Path escapes project directory: ${candidate}`);
  }
}

function copyResource(source, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}

export function knownMissingResource(cssFile, resource) {
  return knownResourceIssues.missing.find((issue) => issue.resource === resource && issue.css_files.includes(cssFile));
}

export function rewriteStyleLinks(html, localStylePaths) {
  let output = html;
  const expectedDsLinks = dsCssFiles.map((file) => `<link rel="stylesheet" href="${dsLinkPrefix}${file}">`);
  expectedDsLinks.forEach((link) => {
    const matches = output.split(link).length - 1;
    if (matches !== 1) {
      throw new Error(`Expected exactly one stylesheet link: ${link}`);
    }
  });

  output = output.replace(expectedDsLinks[0], generatedStyleLink);
  expectedDsLinks.slice(1).forEach((link) => {
    output = output.replace(link, '');
  });

  localStylePaths.forEach((path) => {
    const link = `<link rel="stylesheet" href="./${path}">`;
    const matches = output.split(link).length - 1;
    if (matches !== 1) {
      throw new Error(`Expected exactly one declared project stylesheet link: ${link}`);
    }
    output = output.replace(link, '');
  });

  if (output.includes(dsLinkPrefix)) {
    throw new Error('Output HTML retains a repository CSS path.');
  }
  return output;
}

export function collectLocalResourcePaths(html) {
  const resources = new Set();
  for (const match of html.matchAll(/\s(?:src|poster)="([^"]+)"/g)) {
    const resource = match[1];
    if (
      resource.startsWith('data:') ||
      resource.startsWith('http://') ||
      resource.startsWith('https://') ||
      resource.startsWith('/') ||
      resource.startsWith('#')
    ) continue;
    resources.add(resource);
  }
  return [...resources].sort();
}

export function collectLocalCssResourcePaths(css) {
  return [...css.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)]
    .map((match) => match[1].split('#', 1)[0])
    .filter((resource) => resource && !/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(resource))
    .sort();
}

function readManifest(slug, repositoryRoot) {
  const projectDirectory = join(repositoryRoot, 'projects', slug);
  const manifestPath = join(projectDirectory, 'project.json');
  if (!existsSync(manifestPath)) throw new Error(`Missing project manifest: ${manifestPath}`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const errors = validateProjectManifest(manifest, projectDirectory);
  if (errors.length) throw new Error(`Invalid project manifest:\n- ${errors.join('\n- ')}`);
  return { manifest, projectDirectory };
}

function readRootCss(repositoryRoot) {
  const cssDirectory = join(repositoryRoot, 'dist', 'css');
  return dsCssFiles.map((file) => {
    const path = join(cssDirectory, file);
    if (!existsSync(path)) {
      throw new Error(`Root design-system CSS is not built: ${path}. Run npm run build first.`);
    }
    return { file, path, css: readFileSync(path, 'utf8') };
  });
}

function declaredProjectStyles(manifest, projectDirectory) {
  return manifest.files
    .filter((file) => file.path.startsWith('css/') && file.path.endsWith('.css'))
    .map((file) => file.path)
    .sort((left, right) => {
      if (left === 'css/custom.css') return -1;
      if (right === 'css/custom.css') return 1;
      return left.localeCompare(right);
    })
    .map((path) => {
      const absolutePath = resolve(projectDirectory, path);
      assertInsideProject(projectDirectory, absolutePath);
      if (!existsSync(absolutePath)) throw new Error(`Declared project stylesheet does not exist: ${path}`);
      return { path, absolutePath, css: readFileSync(absolutePath, 'utf8') };
    });
}

export function buildSite(slug, { repositoryRoot = defaultRepositoryRoot } = {}) {
  const { manifest, projectDirectory } = readManifest(slug, repositoryRoot);
  const projectDist = join(projectDirectory, 'dist');
  const rootCss = readRootCss(repositoryRoot);
  const projectStyles = declaredProjectStyles(manifest, projectDirectory);
  const inputHashes = {};
  const warnings = [];

  const outputPages = manifest.pages.map((page) => {
    const sourcePath = join(projectDirectory, page.source);
    const html = readFileSync(sourcePath, 'utf8');
    inputHashes[page.source] = sha256(html);
    return { page, html, output: rewriteStyleLinks(html, projectStyles.map((style) => style.path)) };
  });

  projectStyles.forEach((style) => { inputHashes[style.path] = sha256(style.css); });
  rootCss.forEach((style) => { inputHashes[`design-system/${style.file}`] = sha256(style.css); });

  const rewrittenRootCss = rootCss.map((style) => ({
    ...style,
    rewrite: style.css.includes(iconPrefix) ? rewriteIconSpriteUrls(style.css, '../assets/') : null
  }));
  const rewrittenTokens = rewrittenRootCss.find((style) => style.file === 'tokens.css').rewrite;
  const cssParts = rewrittenRootCss.map((style) => ({
    name: style.file,
    css: style.rewrite ? style.rewrite.css : style.css,
    resourceCss: style.css,
    sourcePath: style.path
  })).concat(projectStyles.map((style) => ({ name: style.path, css: style.css, resourceCss: style.css, sourcePath: style.absolutePath })));

  const cssResourceCopies = [];
  cssParts.forEach((part) => {
    collectLocalCssResourcePaths(part.resourceCss).forEach((resource) => {
      const source = resolve(dirname(part.sourcePath), resource);
      if (!existsSync(source) || !statSync(source).isFile()) {
        const known = knownMissingResource(part.name, resource);
        if (known) {
          warnings.push(`known missing resource: ${part.name} -> ${resource}; ${known.reason}`);
          const reviewWarning = debtReviewWarning(known, `known missing resource ${resource}`);
          if (reviewWarning) warnings.push(`known-debt review: ${reviewWarning}`);
          return;
        }
        throw new Error(`Referenced local CSS resource does not exist: ${part.name} -> ${resource}`);
      }
      const destination = resolve(projectDist, 'css', resource);
      assertInsideProject(projectDist, destination);
      cssResourceCopies.push({ source, destination });
    });
  });

  rmSync(projectDist, { recursive: true, force: true });
  mkdirSync(join(projectDist, 'css'), { recursive: true });
  mkdirSync(join(projectDist, 'assets'), { recursive: true });

  const spriteSource = join(repositoryRoot, 'design-system', 'sets', '1', 'new.sprite.view.svg');
  if (!existsSync(spriteSource)) throw new Error(`Missing SVG sprite: ${spriteSource}`);
  copyResource(spriteSource, join(projectDist, 'assets', 'new.sprite.view.svg'));
  cssResourceCopies.forEach(({ source, destination }) => copyResource(source, destination));

  outputPages.forEach(({ page, html, output }) => {
    const resources = collectLocalResourcePaths(html);
    resources.forEach((resource) => {
      const source = resolve(projectDirectory, resource);
      assertInsideProject(projectDirectory, source);
      if (!existsSync(source) || !statSync(source).isFile()) {
        throw new Error(`Declared local resource does not exist: ${resource}`);
      }
      copyResource(source, resolve(projectDist, resource));
    });
    const outputPath = resolve(projectDist, page.output);
    assertInsideProject(projectDist, outputPath);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, output, 'utf8');
  });

  const siteCss = cssParts.map(({ name, css }) => `/* ${name} */\n${css.trim()}\n`).join('\n');
  if (siteCss.includes('/design-system/')) throw new Error('Built stylesheet retains a repository design-system path.');
  writeFileSync(join(projectDist, 'css', 'site.css'), siteCss, 'utf8');

  const buildInfo = {
    schema_version: 1,
    slug: manifest.slug,
    generator_version: manifest.generator_version,
    ds_version: manifest.ds_version,
    token_icon_url_replacements: rewrittenTokens.replacements,
    total_icon_url_replacements: rewrittenRootCss.reduce((total, style) => total + (style.rewrite?.replacements ?? 0), 0),
    known_missing_resources: [...new Set(warnings)].sort(),
    inputs: Object.fromEntries(Object.entries(inputHashes).sort(([left], [right]) => left.localeCompare(right)))
  };
  writeFileSync(join(projectDist, 'build.json'), `${JSON.stringify(buildInfo, null, 2)}\n`, 'utf8');
  return { projectDist, pages: outputPages.map(({ page }) => page.output), iconUrlReplacements: rewrittenTokens.replacements, warnings: [...new Set(warnings)].sort() };
}

function usage() {
  console.error('Usage: node scripts/site-build.mjs <project-slug>');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2];
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    usage();
    process.exitCode = 1;
  } else {
    try {
      const result = buildSite(slug);
      result.warnings.forEach((warning) => console.warn(`site:build warning: ${warning}`));
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`site:build failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
