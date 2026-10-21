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

const voidHtmlElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function classNamesInTag(tag) {
  const match = tag.match(/\bclass\s*=\s*(["'])(.*?)\1/i);
  return match ? new Set(match[2].trim().split(/\s+/).filter(Boolean)) : new Set();
}

/**
 * Returns every use of a documented structural BEM class that is not a direct
 * child of its documented parent. The parser is deliberately small: it only
 * needs start/end tags and class attributes in static project templates.
 */
export function structuralClassParentViolations(html, className, parentClass) {
  const stack = [];
  const violations = [];
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g;

  for (const match of html.matchAll(tagPattern)) {
    const [tag, rawName] = match;
    const tagName = rawName.toLowerCase();
    const isClosing = tag.startsWith('</');
    if (isClosing) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].tagName === tagName) {
          stack.length = index;
          break;
        }
      }
      continue;
    }

    const classes = classNamesInTag(tag);
    if (classes.has(className) && !stack.at(-1)?.classes.has(parentClass)) {
      violations.push({ offset: match.index, tag });
    }

    if (!tag.endsWith('/>') && !voidHtmlElements.has(tagName)) {
      stack.push({ tagName, classes });
    }
  }

  return violations;
}
