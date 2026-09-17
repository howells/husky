/**
 * Pure formatter-detection helpers for @howells/husky.
 *
 * Kept free of side effects so the install-time bin can stay a thin shell
 * around behaviour that is unit-testable in isolation.
 */

// Staging formats and nothing else. `howells-fix` also runs `oxlint --fix`,
// and four vitest rules that ultracite enables at error severity rewrite test
// assertions under that tier — `toBe(true)` becomes `toBeTruthy()`, which
// passes on values the original rejected. Applied on commit that happens
// silently, inside files the author has already reviewed. Linting belongs in
// pre-push, where it reports rather than rewrites.
export const recommendedLintStagedCommand = "howells-oxfmt --write";

export const recommendedLintStagedGlob =
  "*.{js,ts,jsx,tsx,json,jsonc,css,md,mdx}";

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
