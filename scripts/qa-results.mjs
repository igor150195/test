const shaPattern = /^git:[0-9a-f]{40}$/;

export const mandatoryTechnicalCheckIds = [
  'console-errors', 'failed-requests', 'http-errors', 'broken-images', 'horizontal-overflow',
  'external-hosts', 'undefined-tokens', 'undefined-icons', 'undefined-ds-classes', 'img-alt',
  'img-dimensions', 'img-loading', 'html-lang', 'meta-description', 'skip-link', 'input-label',
  'button-accessible-name'
];

function initialCheck(id) {
  return { id, status: 'not-run', count: 0, reason: 'QA has not started.', evidence: [] };
}

export function createQaResults({ slug, generatorVersion, dsVersion, chromiumVersion = null, portable }) {
  return {
    schema_version: 1,
    project: slug,
    generator_version: generatorVersion,
    ds_version: dsVersion,
    chromium_version: chromiumVersion,
    portable,
    pages: [],
    technical: {
      status: 'not-run',
      checks: mandatoryTechnicalCheckIds.map(initialCheck),
      summary: { errors: 0, warnings: 0, passed: 0, skipped: 0, not_run: mandatoryTechnicalCheckIds.length },
      ds_usage: { status: 'not-run', all_class_uses: 0, ds_class_uses: 0 },
      portability: { site_build: { status: 'not-run' }, check_site: { status: 'not-run' }, external_resources: { status: 'not-run' } },
      a11y: { status: 'not-run', violations: [], incomplete: { count: 0, findings: [] }, reason: 'QA has not started.' }
    },
    expert: { status: 'not-reviewed', score: null, findings: [] }
  };
}

export function recordDsUsage(result, { status = 'passed', allClassUses = 0, dsClassUses = 0, reason } = {}) {
  result.technical.ds_usage = { status, all_class_uses: allClassUses, ds_class_uses: dsClassUses, ...(['not-run', 'error'].includes(status) ? { reason: reason ?? 'No reason recorded.' } : {}) };
}

export function recordPortability(result, portability) {
  result.technical.portability = portability;
}

export function recordA11yReport(result, { status, violations = [], incomplete = { count: 0, findings: [] }, reason } = {}) {
  if (!['passed', 'warning', 'error', 'incomplete', 'not-run'].includes(status)) throw new Error(`Unsupported a11y status: ${status}`);
  result.technical.a11y = {
    status,
    violations,
    incomplete,
    ...(['incomplete', 'not-run'].includes(status) ? { reason: reason ?? 'No reason recorded.' } : {})
  };
}

export function technicalCheck(result, id) {
  const check = result.technical.checks.find((entry) => entry.id === id);
  if (!check) throw new Error(`Unknown technical check: ${id}`);
  return check;
}

function evidenceKey(entry) {
  const copy = { ...entry };
  delete copy.viewports;
  return JSON.stringify(copy);
}

export function recordTechnicalCheck(result, id, { status, evidence = [], reason } = {}) {
  if (!['passed', 'warning', 'error', 'skipped', 'not-run'].includes(status)) throw new Error(`Unsupported technical check status: ${status}`);
  const check = technicalCheck(result, id);
  check.status = status;
  check.reason = ['skipped', 'not-run'].includes(status) ? (reason ?? 'No reason recorded.') : undefined;
  const merged = new Map();
  for (const item of evidence) {
    const { viewport, ...rest } = item;
    const key = evidenceKey(rest);
    const current = merged.get(key) ?? { ...rest, viewports: [] };
    if (viewport && !current.viewports.includes(viewport)) current.viewports.push(viewport);
    merged.set(key, current);
  }
  check.evidence = [...merged.values()].sort((left, right) => evidenceKey(left).localeCompare(evidenceKey(right)));
  check.count = check.evidence.reduce((total, item) => total + Math.max(1, item.viewports?.length ?? 0), 0);
  if (!check.count && ['warning', 'error'].includes(status)) check.count = 1;
  return check;
}

export function finaliseTechnical(result) {
  const checks = result.technical.checks;
  const summary = {
    errors: checks.filter((check) => check.status === 'error').length,
    warnings: checks.filter((check) => check.status === 'warning').length,
    passed: checks.filter((check) => check.status === 'passed').length,
    skipped: checks.filter((check) => check.status === 'skipped').length,
    not_run: checks.filter((check) => check.status === 'not-run').length
  };
  result.technical.summary = summary;
  result.technical.status = summary.errors ? 'fail' : summary.skipped || summary.not_run ? 'not-run' : 'pass';
}

export function markChecksNotRun(result, reason, except = []) {
  for (const id of mandatoryTechnicalCheckIds) {
    if (!except.includes(id)) recordTechnicalCheck(result, id, { status: 'not-run', reason });
  }
}

export function validateQaResults(result) {
  const errors = [];
  if (result?.schema_version !== 1) errors.push('schema_version must equal 1');
  if (typeof result?.project !== 'string' || !result.project) errors.push('project must be a non-empty string');
  ['generator_version', 'ds_version'].forEach((field) => {
    if (!shaPattern.test(result?.[field] ?? '')) errors.push(`${field} must be a full git SHA prefixed with git:`);
  });
  if (result?.chromium_version !== null && typeof result?.chromium_version !== 'string') errors.push('chromium_version must be a string or null');
  if (typeof result?.portable !== 'boolean') errors.push('portable must be boolean');
  if (!Array.isArray(result?.pages)) errors.push('pages must be an array');
  if (!result?.technical || !['pass', 'fail', 'not-run'].includes(result.technical.status)) errors.push('technical.status must be pass, fail or not-run');
  const dsUsage = result?.technical?.ds_usage;
  if (!dsUsage || !['passed', 'error', 'not-run'].includes(dsUsage.status) || !Number.isInteger(dsUsage.all_class_uses) || !Number.isInteger(dsUsage.ds_class_uses) || dsUsage.all_class_uses < dsUsage.ds_class_uses) errors.push('technical.ds_usage must contain valid class-use counts');
  const portability = result?.technical?.portability;
  if (!portability || !['site_build', 'check_site', 'external_resources'].every((key) => ['passed', 'error', 'not-run'].includes(portability[key]?.status))) errors.push('technical.portability must contain valid statuses');
  if (!Array.isArray(result?.technical?.checks)) errors.push('technical.checks must be an array');
  else {
    const ids = result.technical.checks.map((check) => check.id);
    for (const id of mandatoryTechnicalCheckIds) if (!ids.includes(id)) errors.push(`missing mandatory technical check: ${id}`);
    for (const check of result.technical.checks) {
      if (!mandatoryTechnicalCheckIds.includes(check.id)) errors.push(`unknown technical check: ${check.id}`);
      if (!['passed', 'warning', 'error', 'skipped', 'not-run'].includes(check.status)) errors.push(`invalid technical check status: ${check.id}`);
      if (!Number.isInteger(check.count) || check.count < 0) errors.push(`invalid technical check count: ${check.id}`);
      if (['skipped', 'not-run'].includes(check.status) && !check.reason) errors.push(`missing reason for ${check.status} check: ${check.id}`);
    }
    if (result.technical.status === 'pass' && result.technical.checks.some((check) => !['passed', 'warning'].includes(check.status))) {
      errors.push('technical.status pass requires every mandatory check to be passed or warning');
    }
  }
  const a11y = result?.technical?.a11y;
  if (!a11y || !['passed', 'warning', 'error', 'incomplete', 'not-run'].includes(a11y.status) || !Array.isArray(a11y.violations) || !Number.isInteger(a11y.incomplete?.count) || !Array.isArray(a11y.incomplete?.findings)) {
    errors.push('technical.a11y must contain status, violations and incomplete findings');
  } else if (['incomplete', 'not-run'].includes(a11y.status) && !a11y.reason) {
    errors.push('technical.a11y must contain a reason when incomplete or not-run');
  } else if (a11y.status === 'passed' && a11y.incomplete.count > 0) {
    errors.push('technical.a11y cannot pass with incomplete findings');
  }
  if (!result?.expert || result.expert.status !== 'not-reviewed' || result.expert.score !== null || !Array.isArray(result.expert.findings)) {
    errors.push('expert must remain an empty not-reviewed assessment until human or agent review');
  }
  return errors;
}
