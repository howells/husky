import assert from "node:assert/strict";
import { test } from "node:test";

import {
  fallbackFailed,
  lintStagedCommandValues,
  recommendedLintStagedCommand,
  shouldUseNpxFallback,
  usesSupportedFormatter,
} from "./detect.mjs";

const GLOB = "*.{js,ts,jsx,tsx,json,jsonc,css}";
const FIX = "howells-fix";

/**
 * Mirror of the real detection path in howells-husky.mjs: flatten a
 * lint-staged config to its command strings, then check any of them uses a
 * supported Howells formatter.
 */
function configUsesSupportedFormatter(config) {
  return lintStagedCommandValues(config).some(usesSupportedFormatter);
}

// --- Regression: the exact bug that shipped as 0.1.1 -----------------------

test("accepts a lint-staged config using howells-fix", () => {
  assert.equal(configUsesSupportedFormatter({ [GLOB]: FIX }), true);
});

test("accepts a lint-staged config using howells-ox-fix (legacy)", () => {
  assert.equal(
    configUsesSupportedFormatter({ [GLOB]: "howells-ox-fix" }),
    true
  );
});

test("accepts a lint-staged config using howells-format (legacy)", () => {
  assert.equal(
    configUsesSupportedFormatter({ [GLOB]: "howells-format" }),
    true
  );
});

test("accepts an array-valued command that includes a formatter", () => {
  const config = { [GLOB]: [FIX, "some-other-step"] };
  assert.equal(configUsesSupportedFormatter(config), true);
});

test("rejects an unsupported formatter (prettier)", () => {
  assert.equal(
    configUsesSupportedFormatter({ [GLOB]: "prettier --write" }),
    false
  );
});

test("rejects a config with no formatter command", () => {
  assert.equal(configUsesSupportedFormatter({ "*.md": "markdownlint" }), false);
});

test("recommendedLintStagedCommand is howells-fix", () => {
  assert.equal(recommendedLintStagedCommand, FIX);
});

// --- npx-fallback decision logic (task 5) ----------------------------------

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
