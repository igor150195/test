const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

export function debtReviewWarning(debt, label, today = todayUtc()) {
  if (!debt || typeof debt !== 'object') return `${label} has an invalid known-debt entry.`;
  if (!datePattern.test(debt.added ?? '') || !datePattern.test(debt.review_after ?? '')) {
    return `${label} is missing valid added/review_after dates.`;
  }
  if (debt.review_after < today) return `${label} is overdue for review since ${debt.review_after}.`;
  return null;
}
