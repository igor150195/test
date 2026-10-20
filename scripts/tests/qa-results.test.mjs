import assert from 'node:assert/strict';
import { createQaResults, finaliseTechnical, recordTechnicalCheck, validateQaResults } from '../qa-results.mjs';

const sha = 'git:48699494bf7d1a41fbdea13e452b5fdb534a16e8';
const result = createQaResults({ slug: 'fixture', generatorVersion: sha, dsVersion: sha, chromiumVersion: '143.0.0.0', portable: true });
assert.deepEqual(validateQaResults(result), []);
assert.equal(result.expert.status, 'not-reviewed');
assert.equal(result.expert.score, null);
recordTechnicalCheck(result, 'skip-link', { status: 'warning', evidence: [{ page: 'home', viewport: 'desktop' }, { page: 'home', viewport: 'mobile' }] });
recordTechnicalCheck(result, 'console-errors', { status: 'passed' });
finaliseTechnical(result);
assert.equal(result.technical.status, 'not-run');
assert.equal(result.technical.checks.find((check) => check.id === 'skip-link').count, 2);
result.expert.score = 90;
assert.match(validateQaResults(result).join('\n'), /expert must remain/);
result.expert.score = null;
result.technical.a11y = { status: 'passed', violations: [], incomplete: { count: 1, findings: [] } };
assert.match(validateQaResults(result).join('\n'), /cannot pass with incomplete/);
console.log('qa-results tests passed.');
