import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from 'playwright/test';
import project from '../../projects/fashion-store/visual-qa.config.mjs';

const artifactRoot = resolve(`projects/${project.slug}/artifacts/visual-qa`);
const latestDir = resolve(artifactRoot, 'latest');

const targets = [
    { name: 'desktop-1440x900', viewport: { width: 1440, height: 900 }, fullPage: false },
    { name: 'mobile-390x844', viewport: { width: 390, height: 844 }, fullPage: false },
    { name: 'desktop-full-page', viewport: { width: 1440, height: 900 }, fullPage: true },
];

async function inspectPage(page) {
    return page.evaluate(() => {
        const brokenImages = [...document.images]
            .filter((image) => !image.complete || image.naturalWidth === 0)
            .map((image) => image.currentSrc || image.src);
        const viewportWidth = window.innerWidth;
        const documentWidth = document.documentElement.scrollWidth;

        return {
            title: document.title,
            documentWidth,
            viewportWidth,
            horizontalOverflow: documentWidth > viewportWidth,
            brokenImages,
        };
    });
}

async function captureReference(context, target) {
    if (!project.referenceUrl || target.fullPage) {
        return { status: 'not-compared', reason: 'Reference capture is configured only for matching first-screen viewports.' };
    }

    const referencePage = await context.newPage({ viewport: target.viewport });
    try {
        await referencePage.goto(project.referenceUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await referencePage.waitForTimeout(1_000);
        await referencePage.screenshot({ path: resolve(latestDir, `reference-${target.name}.png`) });
        return {
            status: project.referenceComparison,
            url: project.referenceUrl,
            note: 'Reference capture is saved for human same-region review; the initial pipeline does not claim automated pixel fidelity.',
        };
    } catch (error) {
        return { status: 'unavailable', reason: error.message };
    } finally {
        await referencePage.close();
    }
}

for (const target of targets) {
    test(`${project.slug}: ${target.name}`, async ({ page, context }, testInfo) => {
        await mkdir(latestDir, { recursive: true });

        const consoleErrors = [];
        const failedRequests = [];
        const badResponses = [];
        page.on('console', (message) => {
            if (message.type() === 'error') consoleErrors.push(message.text());
        });
        page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' }));
        page.on('response', (response) => {
            if (response.status() >= 400) badResponses.push({ url: response.url(), status: response.status() });
        });

        await page.setViewportSize(target.viewport);
        await page.goto(project.pagePath, { waitUntil: 'networkidle', timeout: 30_000 });
        await page.evaluate(async () => { if (document.fonts) await document.fonts.ready; });

        const audit = await inspectPage(page);
        const screenshotPath = resolve(latestDir, `${target.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: target.fullPage, animations: 'disabled', caret: 'hide' });

        const reference = await captureReference(context, target);
        const result = {
            project: project.slug,
            target,
            checkedAt: new Date().toISOString(),
            screenshotPath,
            technical: { ...audit, consoleErrors, failedRequests, badResponses },
            visualReference: reference,
            regression: { status: 'pending-snapshot-comparison', baseline: `baseline/${target.name}.png` },
        };
        await writeFile(resolve(latestDir, `${target.name}.json`), `${JSON.stringify(result, null, 2)}\n`);

        expect(consoleErrors, 'Console errors').toEqual([]);
        expect(failedRequests, 'Failed requests').toEqual([]);
        expect(badResponses, 'HTTP responses with status >= 400').toEqual([]);
        expect(audit.brokenImages, 'Broken images').toEqual([]);
        expect(audit.horizontalOverflow, `Horizontal overflow: ${audit.documentWidth}px > ${audit.viewportWidth}px`).toBeFalsy();

        await expect(page).toHaveScreenshot(`${target.name}.png`, {
            animations: 'disabled',
            caret: 'hide',
            fullPage: target.fullPage,
            maxDiffPixelRatio: 0.005,
        });

        result.regression = { status: testInfo.config.updateSnapshots === 'all' ? 'baseline-updated' : 'pass', baseline: `baseline/${target.name}.png` };
        await writeFile(resolve(latestDir, `${target.name}.json`), `${JSON.stringify(result, null, 2)}\n`);
    });
}
