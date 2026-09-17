import assert from "node:assert/strict";
import { test } from "node:test";

import {
  fallbackFailed,
  findLintStagedConfigFile,
  recommendedLintStagedCommand,
  recommendedLintStagedGlob,
  shouldUseNpxFallback,
} from "./detect.mjs";

test("the recommended staging command formats and does not lint", () => {
  assert.equal(recommendedLintStagedCommand, "howells-oxfmt --write");
  // A lint fix in the commit hook rewrites test assertions. Guard the
  // recommendation against drifting back to one.
  assert.doesNotMatch(recommendedLintStagedCommand, /fix$|oxlint/);
});

test("the recommended glob covers the formattable file types", () => {
  assert.equal(
    recommendedLintStagedGlob,
    "*.{js,ts,jsx,tsx,json,jsonc,css,md,mdx}"
  );
});

test("recognises standard external lint-staged configuration", () => {
  const files = new Set(["package.json", "lint-staged.config.mjs"]);
  assert.equal(
    findLintStagedConfigFile((file) => files.has(file)),
    "lint-staged.config.mjs"
  );
});

test("reports no external lint-staged configuration when none exists", () => {
  assert.equal(
    findLintStagedConfigFile(() => false),
    undefined
  );
});

test("shouldUseNpxFallback is true only when the primary spawn errored", () => {
  assert.equal(shouldUseNpxFallback({ error: new Error("ENOENT") }), true);
  assert.equal(shouldUseNpxFallback({ status: 0 }), false);
  // A launch that ran but exited non-zero is NOT a launch failure.
  assert.equal(shouldUseNpxFallback({ status: 1 }), false);
});

test("fallbackFailed is true on spawn error or non-zero exit", () => {
  assert.equal(fallbackFailed({ error: new Error("ENOENT") }), true);
  assert.equal(fallbackFailed({ status: 1 }), true);
  assert.equal(fallbackFailed({ status: 0 }), false);
  // status null means the process did not exit normally via a code (e.g.
  // killed by signal); the original guard treats null as "not a status
  // failure", so only a genuine non-zero code trips it.
  assert.equal(fallbackFailed({ status: null }), false);
});
