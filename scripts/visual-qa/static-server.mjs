import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const port = Number(process.env.VISUAL_QA_PORT || 4173);
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.mp4': 'video/mp4',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
};

createServer(async (request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url || '/', `http://${request.headers.host}`).pathname);
    const requestedFile = requestPath.endsWith('/') ? `${requestPath}index.html` : requestPath;
    const filename = resolve(repositoryRoot, `.${normalize(requestedFile)}`);

    if (!filename.startsWith(`${repositoryRoot}${sep}`) && filename !== repositoryRoot) {
        response.writeHead(403).end('Forbidden');
        return;
    }

    try {
        const file = await stat(filename);
        if (!file.isFile()) {
            response.writeHead(404).end('Not found');
            return;
        }

        const contentType = mimeTypes[extname(filename)] || 'application/octet-stream';
        const range = request.headers.range;

        if (range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(range);
            const start = match?.[1] ? Number(match[1]) : 0;
            const end = match?.[2] ? Number(match[2]) : file.size - 1;

            if (!match || start > end || end >= file.size) {
                response.writeHead(416, { 'Content-Range': `bytes */${file.size}` }).end();
                return;
            }

            response.writeHead(206, {
                'Accept-Ranges': 'bytes',
                'Cache-Control': 'no-store',
                'Content-Length': end - start + 1,
                'Content-Range': `bytes ${start}-${end}/${file.size}`,
                'Content-Type': contentType,
            });
            createReadStream(filename, { start, end }).pipe(response);
            return;
        }

        response.writeHead(200, {
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-store',
            'Content-Length': file.size,
            'Content-Type': contentType,
        });
        createReadStream(filename).pipe(response);
    } catch {
        response.writeHead(404).end('Not found');
    }
}).listen(port, '127.0.0.1', () => {
    console.log(`Visual QA server: http://127.0.0.1:${port}`);
});
