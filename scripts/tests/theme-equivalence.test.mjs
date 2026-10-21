import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { generateThemeCss } from '../project-styles.mjs';
import { ensurePlaywrightBrowser } from '../check-playwright-browser.mjs';

if (!ensurePlaywrightBrowser()) process.exit(1);

const defaultTheme = {
  primary: '#7042F4', primary_surface: '#4915B7', on_primary: '#FFFFFF',
  accent: '#A1F2A0', accent_surface: '#7DDD7C', on_accent: '#000000',
  bg_main: '#FFFFFF', bg_main_surface: '#F7F7F7', on_bg_main: '#000000', on_bg_main_accent: '#151037'
};
const tokensCss = readFileSync('dist/css/tokens.css', 'utf8');
const coreCss = readFileSync('dist/css/core.css', 'utf8');
const componentsCss = readFileSync('dist/css/components.css', 'utf8');
const blocksCss = readFileSync('dist/css/blocks.css', 'utf8');
const generatedTheme = generateThemeCss(defaultTheme);
const names = [...generatedTheme.matchAll(/^\s*(--[\w_]+):/gm)].map((match) => match[1]);

async function readComputedColors(page, css) {
  await page.setContent(`<style>${tokensCss}\n${coreCss}\n${componentsCss}\n${blocksCss}\n${css}</style><span id="probe"></span>`);
  return page.evaluate((tokenNames) => {
    const probe = document.querySelector('#probe');
    return Object.fromEntries(tokenNames.map((name) => {
      probe.style.color = `var(${name})`;
      return [name, getComputedStyle(probe).color];
    }));
  }, names);
}

const browser = await chromium.launch({ headless: true });
try {
  const defaultPage = await browser.newPage();
  const themedPage = await browser.newPage();
  const baseline = await readComputedColors(defaultPage, '');
  const generated = await readComputedColors(themedPage, generatedTheme);
  const differences = names
    .filter((name) => baseline[name] !== generated[name])
    .map((name) => ({ token: name, default: baseline[name], generated: generated[name] }));
  assert.deepEqual(differences, [], `default theme generated different computed values:\n${JSON.stringify(differences, null, 2)}`);
  await defaultPage.close();
  await themedPage.close();
  console.log(`theme-equivalence: ${names.length} generated tokens match the default DS palette; differences: 0`);
} finally {
  await browser.close();
}
