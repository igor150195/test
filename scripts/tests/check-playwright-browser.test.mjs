import assert from 'node:assert/strict';
import { ensurePlaywrightBrowser, missingBrowserMessage } from '../check-playwright-browser.mjs';

const messages = [];
assert.equal(ensurePlaywrightBrowser({ browserType: { executablePath: () => 'C:/missing/chromium.exe' }, exists: () => false, report: (message) => messages.push(message) }), false);
assert.deepEqual(messages, [missingBrowserMessage]);
assert.equal(ensurePlaywrightBrowser({ browserType: { executablePath: () => 'C:/present/chromium.exe' }, exists: () => true, report: () => assert.fail('installed browser must not report an error') }), true);
console.log('playwright browser preflight tests passed.');
