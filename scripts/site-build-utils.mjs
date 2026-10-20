const iconPrefix = '/design-system/sets/1/';
const expectedIconUrls = 138;

export function rewriteIconSpriteUrls(css, replacementPrefix) {
  if (!replacementPrefix || replacementPrefix.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(replacementPrefix)) {
    throw new Error('Icon replacement prefix must be a relative asset path.');
  }

  let replacements = 0;
  const output = css.replaceAll(iconPrefix, () => {
    replacements += 1;
    return replacementPrefix;
  });

  if (replacements !== expectedIconUrls) {
    throw new Error(`Expected ${expectedIconUrls} icon URL prefixes, found ${replacements}.`);
  }
  if (output.includes('/design-system/')) {
    throw new Error('Rewritten token CSS still contains a design-system absolute path.');
  }

  return { css: output, replacements };
}

export { expectedIconUrls, iconPrefix };
