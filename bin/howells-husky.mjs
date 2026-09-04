#!/usr/bin/env node

/**
 * @howells/husky — standardised git hooks installer.
 *
 * Usage: add `"prepare": "howells-husky"` to package.json.
 *
 * On `pnpm install`, this script:
 *   1. Runs `husky` to initialise the .husky/ directory
 *   2. Copies the canonical pre-commit and pre-push hooks
 *   3. Validates that lint-staged config exists in package.json
 *
 * The hook scripts are immutable — they come from the package,
 * not from the project. This prevents agents or developers from
 * weakening the configuration to get things to pass.
 */

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  chmodSync,
} from "node:fs";
import path from "node:path";

import {
  fallbackFailed,
  lintStagedCommandValues,
  recommendedLintStagedCommand,
  shouldUseNpxFallback,
  usesSupportedFormatter,
} from "./detect.mjs";

const scriptDir = import.meta.dirname;
const packageRoot = path.resolve(scriptDir, "..");
const projectRoot = process.cwd();

// Skip in CI environments — hooks aren't needed there
if (
  process.env.HUSKY === "0" ||
  process.env.CI === "true" ||
  process.env.VERCEL === "1"
) {
  process.exit(0);
}

// Skip if not in a git repo (e.g. during npm pack)
if (!existsSync(path.join(projectRoot, ".git"))) {
  process.exit(0);
}

// Step 1: Run husky to initialise .husky/ directory
const huskyBin = path.resolve(packageRoot, "node_modules", ".bin", "husky");
const huskyResult = spawnSync(huskyBin, [], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

if (shouldUseNpxFallback(huskyResult)) {
  // Fallback: try resolving husky from the project's node_modules
  const fallbackResult = spawnSync("npx", ["husky"], {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
  });

  if (fallbackFailed(fallbackResult)) {
    console.error("[@howells/husky] Failed to initialise husky");
    process.exit(1);
  }
}

// Step 2: Copy canonical hook scripts
const huskyDir = path.join(projectRoot, ".husky");
if (!existsSync(huskyDir)) {
  mkdirSync(huskyDir, { recursive: true });
}

const hooks = ["pre-commit", "pre-push"];
const hooksDir = path.join(packageRoot, "hooks");

// The overwrite is deliberate: the hooks are the package's, not the project's,
// so a weakened gate cannot survive an install. What was missing is that it
// happened in silence — a customised hook vanished on the next `pnpm install`
// with nothing said, so the author believed their change was in effect until
// it demonstrably was not. Replacing is still unconditional; it is now audible.
for (const hook of hooks) {
  const source = path.join(hooksDir, hook);
  const dest = path.join(huskyDir, hook);

  let replacedLocalEdit = false;
  if (existsSync(dest)) {
    replacedLocalEdit =
      readFileSync(dest, "utf-8") !== readFileSync(source, "utf-8");
  }

  copyFileSync(source, dest);
  chmodSync(dest, 0o755);

  if (replacedLocalEdit) {
    console.warn(
      `[@howells/husky] Replaced .husky/${hook} with the packaged version; your local edits to it are gone.`
    );
    console.warn(
      "  These hooks are intentionally immutable, so a repo cannot weaken its own gate."
    );
    console.warn(
      "  Change them in @howells/husky and publish, or the next install reverts you again."
    );
  }
}

// Step 3: Validate lint-staged config
const packageJsonPath = path.join(projectRoot, "package.json");
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

  if (!packageJson["lint-staged"]) {
    console.warn(
      '[@howells/husky] Warning: no "lint-staged" config found in package.json.'
    );
    console.warn(
      `  Add: "lint-staged": { "*.{js,ts,jsx,tsx,json,jsonc,css}": "${recommendedLintStagedCommand}" }`
    );
  }

  // Check that the lint-staged command uses a supported Howells formatter.
  const lsConfig = packageJson["lint-staged"];
  if (lsConfig) {
    const commands = lintStagedCommandValues(lsConfig);
    const usesHowells = commands.some(usesSupportedFormatter);
    if (!usesHowells) {
      console.warn(
        "[@howells/husky] Warning: lint-staged should use a supported Howells formatter."
      );
      console.warn(
        `  Expected: "*.{js,ts,jsx,tsx,json,jsonc,css}": "${recommendedLintStagedCommand}"`
      );
    }
  }

  // Projects can own an appropriately scoped pre-push gate. Older projects
  // retain the package's typecheck + lint fallback until they add one.
  const scripts = packageJson.scripts || {};
  if (!scripts.prepush && !scripts.typecheck) {
    console.warn(
      '[@howells/husky] Warning: no "prepush" or "typecheck" script found. Pre-push hook requires one.'
    );
  }
  if (!scripts.prepush && !scripts.lint) {
    console.warn(
      '[@howells/husky] Warning: no "prepush" or "lint" script found. Pre-push hook requires one.'
    );
  }
}

console.log("[@howells/husky] Hooks installed.");
