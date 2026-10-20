import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expectedIconUrls, rewriteIconSpriteUrls } from '../site-build-utils.mjs';

const tokensCss = readFileSync(resolve('dist/css/tokens.css'), 'utf8');
const result = rewriteIconSpriteUrls(tokensCss, '../assets/');

assert.equal(result.replacements, expectedIconUrls, 'all icon URL prefixes must be rewritten');
assert.equal(result.css.includes('/design-system/'), false, 'built project token CSS must not retain repository paths');
assert.equal((result.css.match(/\.\.\/assets\/new\.sprite\.view\.svg#/g) ?? []).length, expectedIconUrls, 'each icon must point to the copied sprite');
assert.throws(
  () => rewriteIconSpriteUrls(tokensCss.replace('/design-system/sets/1/', '/unexpected/', 1), '../assets/'),
  /Expected 138 icon URL prefixes/,
  'a changed icon registry must fail loudly'
);

console.log('site-build-utils: icon URL rewrite contract passed');
