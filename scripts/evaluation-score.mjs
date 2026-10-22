import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCompliance } from './check-compliance.mjs';

export const scorerVersion = '1';
export const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const evaluationRoot = resolve(repositoryRoot, 'docs/generator/evaluation-results');

const cases = {
  C1: { slug: 'test-site', status: 'prerequisite-fail', reason: 'Declared local hero MP4 is absent; the project also declares external production resources.' },
  C2: { slug: 'house-store', status: 'artifact-baseline' },
  C3: { slug: 'fashion-store', status: 'prerequisite-fail', reason: 'Production assets remain external and their rights/local copies are not confirmed.' }
};

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function gitSha(root) {
  return `git:${execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()}`;
}

function workingTreeClean(root) {
  return execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: root, encoding: 'utf8' }).trim() === '';
}

function scoreStatus(status, { warningsAreFull = false } = {}) {
  if (status === 'passed') return 1;
  if (status === 'warning') return warningsAreFull ? 1 : 0.5;
  return 0;
}

function checkMap(results) {
  return new Map(results.technical.checks.map((check) => [check.id, check]));
}

function rounded(value) {
  return Math.round(value * 100) / 100;
}

function metric(name, max, score, details) {
  return { name, max, score: rounded(score), ...details };
}

export function scoreQaArtifact({ qa, compliance, reviewerFlags = { local_extend: null, custom_styles_lost: null } }) {
  const checks = checkMap(qa);
  const technicalIds = ['console-errors', 'failed-requests', 'http-errors', 'broken-images', 'external-hosts', 'undefined-tokens', 'undefined-icons', 'undefined-ds-classes'];
  const technicalScore = technicalIds.reduce((total, id) => total + scoreStatus(checks.get(id)?.status, { warningsAreFull: true }), 0) / technicalIds.length * 15;
  const overflow = checks.get('horizontal-overflow')?.status === 'passed' ? 5 : 0;
  const staticIds = ['html-lang', 'img-alt', 'input-label', 'button-accessible-name', 'skip-link'];
  const staticScore = staticIds.reduce((total, id) => total + scoreStatus(checks.get(id)?.status), 0) / staticIds.length * 5;
  const impacts = qa.technical.a11y.violations.map((finding) => finding.impact);
  const axeScore = impacts.some((impact) => ['serious', 'critical'].includes(impact)) ? 0 : impacts.length ? 2.5 : qa.technical.a11y.status === 'passed' ? 5 : 0;
  const topLevel = compliance.metrics.top_level_sections;
  const sectionScore = topLevel ? Math.min(5, compliance.metrics.compliant_reuse_compose_sections / topLevel * 5) : 0;
  const dsUsage = qa.technical.ds_usage;
  const dsScore = dsUsage.status === 'passed' && dsUsage.all_class_uses ? Math.min(5, dsUsage.ds_class_uses / dsUsage.all_class_uses * 5) : 0;
  const portability = qa.technical.portability;
  const portabilityScore = (portability.site_build.status === 'passed' ? 4 : 0) + (portability.check_site.status === 'passed' ? 3 : 0) + (portability.external_resources.status === 'passed' ? 3 : 0);
  const metrics = [
    metric('technical-correctness', 15, technicalScore, { checks: technicalIds, warning_count_ignored: true }),
    metric('adaptivity-and-accessibility', 15, overflow + staticScore + axeScore, { overflow, static: rounded(staticScore), axe: axeScore, axe_incomplete: qa.technical.a11y.incomplete.count }),
    metric('design-system-reuse', 10, sectionScore + dsScore, { section_mapping: rounded(sectionScore), ds_class_ratio: rounded(dsScore), top_level_sections: topLevel, ds_class_uses: dsUsage.ds_class_uses, all_class_uses: dsUsage.all_class_uses }),
    metric('portability', 10, portabilityScore, { ...portability })
  ];
  const requiredChecksComplete = qa.technical.checks.every((check) => !['skipped', 'not-run'].includes(check.status));
  const hardFailures = [
    ...(portability.site_build.status === 'error' ? ['site-build-failed'] : []),
    ...(portability.external_resources.status === 'error' ? ['external-production-resource'] : []),
    ...(qa.pages.length === 0 || qa.pages.some((page) => !page.viewports?.length) ? ['required-page-unavailable'] : []),
    ...(reviewerFlags.local_extend ? ['reviewer:local-extend'] : []),
    ...(reviewerFlags.custom_styles_lost ? ['reviewer:custom-styles-lost'] : [])
  ];
  const score = metrics.reduce((total, entry) => total + entry.score, 0);
  const scoreOutOf = metrics.reduce((total, entry) => total + entry.max, 0);
  return {
    objective: { score: rounded(score), score_out_of: scoreOutOf, percentage: rounded(score / scoreOutOf * 100), metrics, not_measured: ['process-reliability', 'speed-and-cost'] },
    hard_failures: hardFailures,
    status: !hardFailures.length && requiredChecksComplete && qa.technical.status === 'pass' ? 'pass' : 'fail'
  };
}

function versionProvenance({ generatorVersion, dsVersion, projectVersion, manifest }) {
  return {
    generator: { value: generatorVersion, recorded_in_project: manifest.generator_version === generatorVersion },
    design_system: { value: dsVersion, recorded_in_project: manifest.ds_version === dsVersion },
    project: { value: projectVersion, recorded_in_project: false }
  };
}

export function validateEvaluationResult(result) {
  const errors = [];
  if (result.schema_version !== 1) errors.push('schema_version must equal 1');
  if (!['artifact-baseline', 'generation'].includes(result.run_kind)) errors.push('invalid run_kind');
  if (!['pass', 'fail', 'prerequisite-fail', 'not-run'].includes(result.status)) errors.push('invalid status');
  if (!/^git:[0-9a-f]{40}$/.test(result.evaluated_at_commit ?? '')) errors.push('invalid evaluated_at_commit');
  if (typeof result.working_tree_clean !== 'boolean') errors.push('working_tree_clean must be boolean');
  if (result.run_kind === 'generation' && !result.evidence.brief) errors.push('generation requires brief evidence');
  if (!Array.isArray(result.measured_metrics) || !result.objective || !result.expert || result.expert.status !== 'not-reviewed') errors.push('missing objective or expert fields');
  if (!result.versions || !['generator', 'design_system', 'project'].every((key) => typeof result.versions[key]?.recorded_in_project === 'boolean')) errors.push('missing version provenance');
  if (!Object.values(result.reviewer_flags ?? {}).every((value) => value === null || typeof value === 'boolean')) errors.push('reviewer flags must be null or boolean');
  return errors;
}

export function evaluateCase(caseId, { root = repositoryRoot } = {}) {
  const definition = cases[caseId];
  if (!definition) throw new Error(`Unknown evaluation case: ${caseId}`);
  const projectDirectory = resolve(root, 'projects', definition.slug);
  const manifestPath = resolve(projectDirectory, 'project.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const projectVersion = gitSha(root);
  const evaluationCommit = gitSha(root);
  const isWorkingTreeClean = workingTreeClean(root);
  if (definition.status === 'prerequisite-fail') return {
    schema_version: 1, case_id: caseId, run: 'artifact-baseline-1', run_kind: 'artifact-baseline',
    generator_version: manifest.generator_version, ds_version: manifest.ds_version, project_version: projectVersion,
    versions: versionProvenance({ generatorVersion: manifest.generator_version, dsVersion: manifest.ds_version, projectVersion, manifest }), scorer_version: scorerVersion, evaluated_at: null, evaluated_at_commit: evaluationCommit, working_tree_clean: isWorkingTreeClean,
    status: 'prerequisite-fail', measured_metrics: [], hashes: { project_manifest: hashFile(manifestPath) },
    objective: { score: null, score_out_of: null, percentage: null, metrics: [], not_measured: ['all'] }, expert: { status: 'not-reviewed', score: null },
    reviewer_flags: { local_extend: null, custom_styles_lost: null }, evidence: { reason: definition.reason }
  };
  const qaPath = resolve(projectDirectory, 'artifacts/qa/latest/results.json');
  if (!existsSync(qaPath)) throw new Error(`Missing QA artifact: ${relative(root, qaPath)}`);
  const tokenMapPath = resolve(projectDirectory, 'docs/token-map.md');
  const qa = JSON.parse(readFileSync(qaPath, 'utf8'));
  const compliance = checkCompliance(definition.slug, { projectDirectory });
  const scored = scoreQaArtifact({ qa, compliance });
  const hashes = { project_manifest: hashFile(manifestPath), qa_results: hashFile(qaPath) };
  if (existsSync(tokenMapPath)) hashes.token_map = hashFile(tokenMapPath);
  return {
    schema_version: 1, case_id: caseId, run: 'artifact-baseline-1', run_kind: 'artifact-baseline',
    generator_version: qa.generator_version, ds_version: qa.ds_version, project_version: projectVersion,
    versions: versionProvenance({ generatorVersion: qa.generator_version, dsVersion: qa.ds_version, projectVersion, manifest }), scorer_version: scorerVersion, evaluated_at: statSync(qaPath).mtime.toISOString(), evaluated_at_commit: evaluationCommit, working_tree_clean: isWorkingTreeClean,
    status: scored.status, measured_metrics: scored.objective.metrics.map((entry) => entry.name), hashes,
    objective: scored.objective, expert: { status: 'not-reviewed', score: null }, reviewer_flags: { local_extend: null, custom_styles_lost: null },
    evidence: { qa_results: relative(root, qaPath).replaceAll('\\', '/'), compliance: compliance.metrics, hard_failures: scored.hard_failures }
  };
}

function usage() { console.error('Usage: node scripts/evaluation-score.mjs <C1|C2|C3> [--write]'); }
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const caseId = process.argv[2];
  if (!caseId) { usage(); process.exitCode = 1; }
  else {
    try {
      const result = evaluateCase(caseId);
      const errors = validateEvaluationResult(result);
      if (errors.length) throw new Error(errors.join('; '));
      if (process.argv.includes('--write')) {
        mkdirSync(evaluationRoot, { recursive: true });
        writeFileSync(resolve(evaluationRoot, `${caseId.toLowerCase()}.json`), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
      }
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.status === 'prerequisite-fail' ? 1 : 0;
    } catch (error) { console.error(`evaluation:score failed: ${error.message}`); process.exitCode = 1; }
  }
}
