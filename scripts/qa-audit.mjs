import { cssDefinesClass, customPropertyAssignments, documentedStructuralClassViolations, dsClassesInHtml, shouldCheckVariableReference, variableReferences } from './css-contracts.mjs';

function issue(code, severity, message, evidence = {}) {
  return { code, severity, message, evidence };
}

function truncate(value, length = 80) {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
}

export function externalResourcesInBundle(html, css) {
  const external = new Set();
  for (const match of html.matchAll(/\b(?:src|poster)\s*=\s*['"](https?:\/\/[^'"\s]+)/g)) external.add(match[1]);
  for (const match of css.matchAll(/url\(\s*['"]?(https?:\/\/[^'"\s)]+)/g)) external.add(match[1]);
  return [...external].sort();
}

export function htmlClassUsage(html) {
  const classes = [...html.matchAll(/\bclass\s*=\s*(["'])(.*?)\1/gi)]
    .flatMap((match) => match[2].trim().split(/\s+/).filter(Boolean));
  return { all_class_uses: classes.length, ds_class_uses: classes.filter((className) => className.startsWith('ds-')).length };
}

export function auditCssContracts({ html, css, knownIssues, structuralClassContracts = {} }) {
  const defined = new Set(customPropertyAssignments(css));
  const findings = [];
  for (const reference of [...variableReferences(css), ...variableReferences(html)]) {
    if (!shouldCheckVariableReference(reference, knownIssues.dynamicTokenPrefixes)) continue;
    if (defined.has(reference.token)) continue;
    const known = knownIssues.undefinedTokens[reference.token];
    const icon = reference.token.startsWith('--icon_');
    findings.push(known
      ? issue(icon ? 'known-undefined-icon' : 'known-undefined-token', 'warning', `${reference.token}: ${known.reason}`)
      : issue(icon ? 'undefined-icon' : 'undefined-token', 'error', `Undefined CSS token: ${reference.token}`));
  }
  for (const className of dsClassesInHtml(html)) {
    if (cssDefinesClass(css, className)) continue;
    const structuralViolations = documentedStructuralClassViolations(html, className, structuralClassContracts);
    if (structuralViolations?.length === 0) continue;
    if (structuralViolations?.length) {
      findings.push(issue('undefined-ds-class', 'error', `Structural CSS class .${className} requires its documented direct parent.`));
      continue;
    }
    const known = knownIssues.undefinedClasses[className];
    findings.push(known
      ? issue('known-undefined-ds-class', 'warning', `.${className}: ${known.reason}`)
      : issue('undefined-ds-class', 'error', `No CSS rule for .${className}`));
  }
  return findings.filter((finding, index) => findings.findIndex((candidate) => candidate.code === finding.code && candidate.message === finding.message) === index);
}

export function inspectHtmlFixture(html) {
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const hasAttribute = (tag, attribute) => new RegExp(`\\b${attribute}(?:\\s*=|\\s|>)`, 'i').test(tag);
  const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
  const labels = [...html.matchAll(/<label\b[^>]*\bfor\s*=\s*["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  const inputs = [...html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)].map((match) => match[0]);
  const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)].map((match) => ({ tag: match[0], attributes: match[1], text: match[2].replace(/<[^>]+>/g, '').trim() }));
  return {
    hasLang: /<html\b[^>]*\blang\s*=\s*["'][^"']+["']/i.test(html),
    hasMetaDescription: /<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*\bcontent\s*=\s*["'][^"']+/i.test(html),
    hasSkipLink: /<a\b(?=[^>]*\bclass\s*=\s*["'][^"']*\bskip(?:-|_)?link\b[^"']*["'])(?=[^>]*\bhref\s*=\s*["']#(?!["'])[^"']+["'])[^>]*>/i.test(html),
    imagesMissingAlt: images.filter((tag) => !hasAttribute(tag, 'alt')).map((tag) => truncate(tag)),
    imagesWithoutDimensions: images.filter((tag) => !/^data:/i.test(attribute(tag, 'src') ?? '') && (!hasAttribute(tag, 'width') || !hasAttribute(tag, 'height'))).map((tag) => truncate(tag)),
    imagesWithoutLoading: images.filter((tag) => !/^data:/i.test(attribute(tag, 'src') ?? '') && !hasAttribute(tag, 'loading')).map((tag) => truncate(tag)),
    unlabeledInputs: inputs.filter((tag) => {
      const id = attribute(tag, 'id');
      return !(hasAttribute(tag, 'aria-label') || hasAttribute(tag, 'aria-labelledby') || (id && labels.includes(id)));
    }).map((tag) => truncate(tag)),
    unnamedButtons: buttons.filter((button) => !(button.text || hasAttribute(button.attributes, 'aria-label') || hasAttribute(button.attributes, 'aria-labelledby') || hasAttribute(button.attributes, 'title'))).map((button) => truncate(button.tag))
  };
}
