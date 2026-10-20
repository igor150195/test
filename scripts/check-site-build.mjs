import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRepositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mimeTypes = { '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4' };
const knownResourceIssues = JSON.parse(readFileSync(join(defaultRepositoryRoot, 'scripts', 'known-resource-issues.json'), 'utf8'));

function isLocalReference(value) {
  return value && !/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(value);
}

function localHtmlReferences(html) {
  return [...html.matchAll(/\s(?:href|src|poster)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter(isLocalReference);
}

function localCssReferences(css) {
  return [...css.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)]
    .map((match) => match[1])
    .filter(isLocalReference);
}

export function createSubpathServer(distDirectory, basePath) {
  const normalizedBase = `/${basePath.replace(/^\/+|\/+$/g, '')}/`;
  return createServer(async (request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url ?? '/', 'http://127.0.0.1').pathname);
    if (!requestPath.startsWith(normalizedBase)) {
      response.writeHead(404).end('Not found');
      return;
    }
    const relativeRequest = requestPath.slice(normalizedBase.length) || 'index.html';
    const filename = resolve(distDirectory, relativeRequest);
    if (!filename.startsWith(`${distDirectory}${sep}`) && filename !== distDirectory) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    try {
      const file = await stat(filename);
      if (!file.isFile()) throw new Error('Not a file');
      response.writeHead(200, { 'Content-Type': mimeTypes[extname(filename)] ?? 'application/octet-stream' });
      response.end(await readFile(filename));
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
}

function request(url) {
  return fetch(url).then(async (response) => ({ url, status: response.status, text: await response.text() }));
}

function knownMissingResponse(response) {
  const pathname = new URL(response.url).pathname.replace(/^.*\//, '');
  return knownResourceIssues.missing.find((issue) => issue.output_path === pathname);
}

export async function checkSiteBuild(slug, basePath = 'some/path', { repositoryRoot = defaultRepositoryRoot } = {}) {
  const distDirectory = resolve(repositoryRoot, 'projects', slug, 'dist');
  if (!existsSync(distDirectory)) throw new Error(`Missing project build: ${distDirectory}. Run npm run site:build -- ${slug} first.`);
  const manifest = JSON.parse(readFileSync(resolve(repositoryRoot, 'projects', slug, 'project.json'), 'utf8'));
  const server = createSubpathServer(distDirectory, basePath);
  await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));
  const { port } = server.address();
  const rootUrl = `http://127.0.0.1:${port}/${basePath.replace(/^\/+|\/+$/g, '')}/`;
  const responses = [];
  try {
    for (const page of manifest.pages) {
      const pageUrl = new URL(page.output, rootUrl).href;
      const pageResponse = await request(pageUrl);
      responses.push({ url: pageUrl, status: pageResponse.status });
      if (pageResponse.status >= 400) continue;
      const references = localHtmlReferences(pageResponse.text);
      for (const reference of references) {
        const resourceUrl = new URL(reference, pageUrl).href;
        const resourceResponse = await request(resourceUrl);
        responses.push({ url: resourceUrl, status: resourceResponse.status });
        if (resourceResponse.status < 400 && resourceUrl.endsWith('.css')) {
          for (const cssReference of localCssReferences(resourceResponse.text)) {
            const cssUrl = new URL(cssReference.split('#', 1)[0], resourceUrl).href;
            const cssResponse = await request(cssUrl);
            responses.push({ url: cssUrl, status: cssResponse.status });
          }
        }
      }
    }
  } finally {
    await new Promise((resolveServer) => server.close(resolveServer));
  }
  const warnings = [];
  const failures = responses.filter((response) => {
    if (response.status < 400) return false;
    const known = knownMissingResponse(response);
    if (!known) return true;
    warnings.push(`known missing resource: ${response.status} ${response.url}; ${known.reason}`);
    return false;
  });
  if (failures.length) throw new Error(`Transfer check found ${failures.length} request(s) with status >=400:\n${failures.map((failure) => `- ${failure.status} ${failure.url}`).join('\n')}`);
  return { slug, basePath: `/${basePath.replace(/^\/+|\/+$/g, '')}/`, responses, warnings: [...new Set(warnings)] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2];
  if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error('Usage: node scripts/check-site-build.mjs <project-slug>');
    process.exitCode = 1;
  } else {
    try {
      const result = await checkSiteBuild(slug);
      result.warnings.forEach((warning) => console.warn(`check:site warning: ${warning}`));
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`check:site failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
