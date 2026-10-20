export function customPropertyAssignments(contents) {
  return [...contents.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)].map((match) => match[1]);
}

export function variableReferences(contents) {
  return [...contents.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)([^)]*)\)/g)].map((match) => ({
    token: match[1],
    remainder: match[2]
  }));
}

export function shouldCheckVariableReference({ token, remainder }, dynamicTokenPrefixes = []) {
  const hasFallback = remainder.trimStart().startsWith(',');
  return !hasFallback && !dynamicTokenPrefixes.some((prefix) => token.startsWith(prefix));
}

export function dsClassesInHtml(contents) {
  return [...contents.matchAll(/\b(ds-[a-zA-Z0-9_-]+)\b/g)].map((match) => match[1]);
}

export function cssDefinesClass(css, className) {
  return new RegExp(`\\.${className}(?![a-zA-Z0-9_-])`).test(css);
}
