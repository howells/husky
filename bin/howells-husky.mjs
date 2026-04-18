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
import { copyFileSync, existsSync, mkdirSync, readFileSync, chmodSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const projectRoot = process.cwd();

// Skip in CI environments — hooks aren't needed there
if (process.env.CI === "true" || process.env.VERCEL === "1") {
  process.exit(0);
}

// Skip if not in a git repo (e.g. during npm pack)
if (!existsSync(join(projectRoot, ".git"))) {
  process.exit(0);
}

// Step 1: Run husky to initialise .husky/ directory
const huskyBin = resolve(packageRoot, "node_modules", ".bin", "husky");
const huskyResult = spawnSync(huskyBin, [], {
  cwd: projectRoot,
  stdio: "inherit",
  env: process.env,
});

if (huskyResult.error) {
  // Fallback: try resolving husky from the project's node_modules
  const fallbackResult = spawnSync("npx", ["husky"], {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env,
  });

  if (fallbackResult.error || (fallbackResult.status !== null && fallbackResult.status !== 0)) {
    console.error("[@howells/husky] Failed to initialise husky");
    process.exit(1);
  }
}

// Step 2: Copy canonical hook scripts
const huskyDir = join(projectRoot, ".husky");
if (!existsSync(huskyDir)) {
  mkdirSync(huskyDir, { recursive: true });
}

const hooks = ["pre-commit", "pre-push"];
const hooksDir = join(packageRoot, "hooks");

for (const hook of hooks) {
  const source = join(hooksDir, hook);
  const dest = join(huskyDir, hook);
  copyFileSync(source, dest);
  chmodSync(dest, 0o755);
}

// Step 3: Validate lint-staged config
const packageJsonPath = join(projectRoot, "package.json");
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  if (!packageJson["lint-staged"]) {
    console.warn(
      '[@howells/husky] Warning: no "lint-staged" config found in package.json.',
    );
    console.warn(
      '  Add: "lint-staged": { "*.{js,ts,jsx,tsx,json,jsonc,css}": "howells-format" }',
    );
  }

  // Check that the lint-staged command uses howells-format
  const lsConfig = packageJson["lint-staged"];
  if (lsConfig) {
    const commands = Object.values(lsConfig);
    const usesHowells = commands.some(
      (cmd) => typeof cmd === "string" && cmd.includes("howells-format"),
    );
    if (!usesHowells) {
      console.warn(
        "[@howells/husky] Warning: lint-staged should use howells-format.",
      );
      console.warn(
        '  Expected: "*.{js,ts,jsx,tsx,json,jsonc,css}": "howells-format"',
      );
    }
  }

  // Check that typecheck and lint scripts exist
  const scripts = packageJson.scripts || {};
  if (!scripts.typecheck) {
    console.warn(
      '[@howells/husky] Warning: no "typecheck" script found. Pre-push hook requires it.',
    );
  }
  if (!scripts.lint) {
    console.warn(
      '[@howells/husky] Warning: no "lint" script found. Pre-push hook requires it.',
    );
  }
}

console.log("[@howells/husky] Hooks installed.");
