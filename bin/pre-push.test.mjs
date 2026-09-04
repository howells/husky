/**
 * Tests for hooks/pre-push.
 *
 * The hook is a shell script, so it is exercised as one: a throwaway git repo,
 * a stub `pnpm` on PATH that records what it was asked to do, and the ref lines
 * git would supply on stdin.
 *
 * The case that motivated all of this is "pushes a ref that is not HEAD": work
 * existing in one place, in a tree that does not typecheck, is exactly what most
 * needs pushing, and the hook used to fail that push for a reason unrelated to
 * what was being pushed.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";

const HOOK = path.resolve(import.meta.dirname, "..", "hooks", "pre-push");
const ZERO = "0".repeat(40);
const OTHER = "1".repeat(40);

let repo;
let headSha;

/** Write a stub `pnpm` that echoes its arguments and exits with `code`. */
function stubPnpm(code) {
  writeFileSync(
    path.join(repo, "bin", "pnpm"),
    `#!/bin/sh\necho "RAN pnpm $*"\nexit ${code}\n`
  );
  chmodSync(path.join(repo, "bin", "pnpm"), 0o755);
}

function writeProjectScripts(scripts) {
  writeFileSync(path.join(repo, "package.json"), JSON.stringify({ scripts }));
}

/** Run the hook with `stdin` and return {status, out}. */
function run(stdin) {
  const result = spawnSync("sh", [HOOK], {
    cwd: repo,
    encoding: "utf-8",
    env: {
      ...process.env,
      PATH: `${path.join(repo, "bin")}:${process.env.PATH}`,
    },
    input: stdin,
  });
  return { out: `${result.stdout}${result.stderr}`, status: result.status };
}

describe("pre-push", () => {
  before(() => {
    repo = mkdtempSync(path.join(tmpdir(), "howells-husky-"));
    mkdirSync(path.join(repo, "bin"), { recursive: true });
    const git = (...args) =>
      spawnSync("git", args, { cwd: repo, encoding: "utf-8" });
    git("init", "-q", ".");
    git("commit", "-q", "--allow-empty", "-m", "init");
    headSha = git("rev-parse", "HEAD").stdout.trim();
    writeProjectScripts({ lint: "lint", typecheck: "typecheck" });
    stubPnpm(0);
  });

  after(() => {
    spawnSync("rm", ["-rf", repo]);
  });

  it("runs the checks when the pushed sha is HEAD", () => {
    const { out, status } = run(
      `refs/heads/main ${headSha} refs/heads/main ${ZERO}\n`
    );
    assert.equal(status, 0);
    assert.match(out, /RAN pnpm typecheck/);
    assert.match(out, /RAN pnpm lint/);
  });

  it("delegates to a project-owned prepush script when present", () => {
    writeProjectScripts({ prepush: "node scripts/pre-push-check.mjs" });
    try {
      const { out, status } = run(
        `refs/heads/main ${headSha} refs/heads/main ${ZERO}\n`
      );
      assert.equal(status, 0);
      assert.match(out, /RAN pnpm prepush/);
      assert.doesNotMatch(out, /RAN pnpm typecheck/);
      assert.doesNotMatch(out, /RAN pnpm lint/);
    } finally {
      writeProjectScripts({ lint: "lint", typecheck: "typecheck" });
    }
  });

  it("skips, and says so, when a pushed sha is not HEAD", () => {
    const { out, status } = run(
      `refs/heads/salvage/x ${OTHER} refs/heads/salvage/x ${ZERO}\n`
    );
    assert.equal(status, 0, "an unverifiable push is not a failure");
    assert.doesNotMatch(
      out,
      /RAN pnpm/,
      "the checks must not run against the wrong tree"
    );
    assert.match(out, /Not verified/);
    assert.match(out, /refs\/heads\/salvage\/x/, "it names the ref");
  });

  it("does not treat a branch deletion as unverifiable", () => {
    const { out, status } = run(`(delete) ${ZERO} refs/heads/gone ${OTHER}\n`);
    assert.equal(status, 0);
    assert.match(out, /RAN pnpm typecheck/);
  });

  it("checks the working directory when git supplies no refs", () => {
    const { out, status } = run("");
    assert.equal(status, 0);
    assert.match(out, /No refs on stdin/);
    assert.match(
      out,
      /RAN pnpm typecheck/,
      "an unverified push is what this hook exists to stop"
    );
  });

  it("one unverifiable ref in a batch skips the batch", () => {
    const { out } = run(
      `refs/heads/main ${headSha} refs/heads/main ${ZERO}\n` +
        `refs/heads/salvage/y ${OTHER} refs/heads/salvage/y ${ZERO}\n`
    );
    assert.doesNotMatch(out, /RAN pnpm/);
    assert.match(out, /refs\/heads\/salvage\/y/);
  });

  it("still blocks a push when typecheck fails", () => {
    stubPnpm(1);
    try {
      const { status } = run(
        `refs/heads/main ${headSha} refs/heads/main ${ZERO}\n`
      );
      assert.equal(status, 1, "the gate must still gate");
    } finally {
      stubPnpm(0);
    }
  });
});
