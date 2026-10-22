import assert from 'node:assert/strict';
import { scoreQaArtifact, validateEvaluationResult } from '../evaluation-score.mjs';

const checks = ['console-errors', 'failed-requests', 'http-errors', 'broken-images', 'horizontal-overflow', 'external-hosts', 'undefined-tokens', 'undefined-icons', 'undefined-ds-classes', 'img-alt', 'img-dimensions', 'img-loading', 'html-lang', 'meta-description', 'skip-link', 'input-label', 'button-accessible-name'].map((id) => ({ id, status: 'passed', count: 0, evidence: [] }));
const qa = { technical: { status: 'pass', checks, a11y: { status: 'passed', violations: [], incomplete: { count: 0, findings: [] } }, ds_usage: { status: 'passed', all_class_uses: 10, ds_class_uses: 5 }, portability: { site_build: { status: 'passed' }, check_site: { status: 'passed' }, external_resources: { status: 'passed' } } }, pages: [{ viewports: [{}] }] };
const compliance = { metrics: { top_level_sections: 2, compliant_reuse_compose_sections: 2 } };
const first = scoreQaArtifact({ qa, compliance });
const second = scoreQaArtifact({ qa, compliance });
assert.deepEqual(first, second, 'identical inputs must score deterministically');
assert.equal(first.objective.score_out_of, 50);
assert.equal(first.status, 'pass');
qa.technical.portability.external_resources.status = 'error';
assert.match(scoreQaArtifact({ qa, compliance }).hard_failures.join(','), /external-production-resource/);
const sha = 'git:0123456789abcdef0123456789abcdef01234567';
const record = { schema_version: 1, case_id: 'C2', run: 'artifact-baseline-1', run_kind: 'artifact-baseline', generator_version: sha, ds_version: sha, project_version: sha, versions: { generator: { value: sha, recorded_in_project: true }, design_system: { value: sha, recorded_in_project: true }, project: { value: sha, recorded_in_project: false } }, scorer_version: '1', evaluated_at: '2026-10-22T04:25:07.173Z', evaluated_at_commit: sha, working_tree_clean: false, status: 'pass', measured_metrics: [], hashes: {}, objective: first.objective, expert: { status: 'not-reviewed', score: null }, reviewer_flags: { local_extend: null, custom_styles_lost: null }, evidence: {} };
assert.deepEqual(validateEvaluationResult(record), []);
assert.match(validateEvaluationResult({ ...record, reviewer_flags: { local_extend: 'unknown', custom_styles_lost: null } }).join(','), /reviewer flags/);
console.log('evaluation-score tests passed.');
