import assert from 'node:assert/strict';
import { resourcesInText } from '../check-assets.mjs';

const resources = resourcesInText(`
  <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E" alt="">
  <img src="https://example.test/image.png" alt="">
  <div style="background-image: url('./local.png')"></div>
`);

assert.deepEqual(resources, ['./local.png', 'https://example.test/image.png']);
console.log('check-assets tests passed.');
