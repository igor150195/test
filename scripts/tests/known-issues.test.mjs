import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { debtReviewWarning } from '../known-issues.mjs';

assert.equal(debtReviewWarning({ reason: 'fixture', added: '2026-10-20', review_after: '2027-01-18' }, 'fixture', '2026-10-20'), null);
assert.match(debtReviewWarning({ reason: 'fixture', added: '2026-01-01', review_after: '2026-01-02' }, 'fixture', '2026-10-20'), /overdue/);
assert.match(debtReviewWarning({ reason: 'fixture' }, 'fixture', '2026-10-20'), /missing valid/);
const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const knownA11yIssues = JSON.parse(readFileSync(join(repositoryRoot, 'scripts', 'known-a11y-issues.json'), 'utf8'));
assert.equal(debtReviewWarning(knownA11yIssues.issues[0], 'known a11y issue', '2026-10-20'), null);
console.log('known-issues tests passed.');
