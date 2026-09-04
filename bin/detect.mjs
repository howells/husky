/**
 * Pure formatter-detection helpers for @howells/husky.
 *
 * Kept free of side effects so the install-time bin can stay a thin shell
 * around behaviour that is unit-testable in isolation.
 */

// `howells-fix` is the current canonical @howells/lint fixer; `howells-ox-fix`
// and `howells-format` are earlier names still in use by repos mid-migration.
// Accept all three so a correct lint-staged config never draws a false warning.
export const lintStagedFormatterCommands = [
  "howells-fix",
  "howells-ox-fix",
  "howells-format",
];

export const recommendedLintStagedCommand = "howells-fix";

// Standard configuration names supported by lint-staged. Package-level files
// in a monorepo are discovered by lint-staged itself; the installer only needs
// to recognise the root configuration it is responsible for validating.
export const lintStagedConfigFileNames = [
  ".lintstagedrc",
  ".lintstagedrc.json",
  ".lintstagedrc.yaml",
  ".lintstagedrc.yml",
  ".lintstagedrc.js",
  ".lintstagedrc.mjs",
  ".lintstagedrc.cjs",
  "lint-staged.config.js",
  "lint-staged.config.mjs",
  "lint-staged.config.cjs",
  "lint-staged.config.ts",
];

export function findLintStagedConfigFile(exists) {
  return lintStagedConfigFileNames.find((file) => exists(file));
}

/**
 * Flatten a lint-staged config object into the list of command strings it runs.
 * Values may be a single command string or an array of them.
 */
export function lintStagedCommandValues(config) {
  return Object.values(config).flatMap((value) => {
    if (typeof value === "string") {
      return [value];
    }
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === "string");
    }
    return [];
  });
}

/**
 * True when a single lint-staged command invokes a supported Howells formatter.
 */
export function usesSupportedFormatter(command) {
  return lintStagedFormatterCommands.some((formatter) =>
    command.includes(formatter)
  );
}

/**
 * Decide whether the primary `husky` spawn failed to launch and we should
 * fall back to `npx husky`. A spawn that launched but exited non-zero is not a
 * launch failure — only a spawn `error` (e.g. ENOENT) warrants the fallback.
 */
export function shouldUseNpxFallback(primaryResult) {
  return Boolean(primaryResult.error);
}

/**
 * True when the npx fallback itself failed — either it could not launch, or it
 * launched and exited with a non-zero status.
 */
export function fallbackFailed(fallbackResult) {
  return Boolean(
    fallbackResult.error ||
    (fallbackResult.status !== null && fallbackResult.status !== 0)
  );
}
