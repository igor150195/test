import { defineConfig } from 'playwright/test';

export default defineConfig({
    testDir: './scripts/visual-qa',
    testMatch: 'fashion-store.spec.mjs',
    forbidOnly: Boolean(process.env.CI),
    fullyParallel: false,
    workers: 1,
    reporter: [
        ['list'],
        ['json', { outputFile: 'projects/fashion-store/artifacts/visual-qa/latest/playwright-report.json' }],
    ],
    outputDir: 'projects/fashion-store/artifacts/visual-qa/test-results',
    snapshotPathTemplate: 'projects/fashion-store/artifacts/visual-qa/baseline/{arg}{ext}',
    use: {
        baseURL: 'http://127.0.0.1:4173',
        browserName: 'chromium',
        headless: true,
        colorScheme: 'light',
        locale: 'ru-RU',
        timezoneId: 'Asia/Tashkent',
    },
    webServer: {
        command: 'node scripts/visual-qa/static-server.mjs',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: true,
        timeout: 15_000,
    },
});
