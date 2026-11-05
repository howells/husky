#!/usr/bin/env node

/**
 * @howells/husky — standardised git hooks installer.
 *
 * Usage: add `"prepare": "howells-husky"` to package.json.
 *
 * On `pnpm install`, this script:
 *   1. Runs `husky` to initialise the .husky/ directory
 *   2. Copies the canonical pre-commit hook
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
  findLintStagedConfigFile,
  recommendedLintStagedCommand,
  recommendedLintStagedGlob,
  shouldUseNpxFallback,
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

const hooks = ["pre-commit"];
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
    console.warn("  These hooks are intentionally immutable.");
    console.warn(
      "  Change them in @howells/husky and publish, or the next install reverts you again."
    );
  }
}

// Step 3: Validate lint-staged config
const packageJsonPath = path.join(projectRoot, "package.json");
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  const externalLintStagedConfig = findLintStagedConfigFile((file) =>
    existsSync(path.join(projectRoot, file))
  );

  if (!packageJson["lint-staged"] && !externalLintStagedConfig) {
    console.warn(
      "[@howells/husky] Warning: no inline or external lint-staged config found."
    );
    console.warn(
      `  Add: "lint-staged": { "${recommendedLintStagedGlob}": "${recommendedLintStagedCommand}" }`
    );
  }
}

console.error("[@howells/husky] Hooks installed.");
