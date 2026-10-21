import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

export const missingBrowserMessage = 'Playwright browser missing: run `npx playwright install chromium`';

export function ensurePlaywrightBrowser({ browserType = chromium, exists = existsSync, report = console.error } = {}) {
  if (exists(browserType.executablePath())) return true;
  report(missingBrowserMessage);
  return false;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href && !ensurePlaywrightBrowser()) process.exitCode = 1;
