# @howells/husky

Standardised git hooks for Howells projects. Immutable pre-commit and pre-push configuration.

## Install

```bash
pnpm add -D @howells/husky
```

## Setup

In `package.json`:

```json
{
  "scripts": {
    "prepare": "howells-husky"
  },
  "lint-staged": {
    "*.{js,ts,jsx,tsx,json,jsonc,css,md,mdx}": "howells-oxfmt --write"
  }
}
```

Standard external lint-staged configuration files are supported as an alternative to the inline `package.json` entry. Use one when path-aware or computed commands are needed.

That's it. On `pnpm install`, the hooks are installed automatically.

## What it does

### Pre-commit

Runs `pnpm lint-staged` — formats staged files with the configured Howells formatter. Use `howells-oxfmt --write`.

**Staging is format-only. Never put `howells-fix` in lint-staged.** Formatting only moves whitespace, so it is safe to apply to a file you are already committing. `howells-fix` also runs `oxlint --fix`, and four rules that ultracite enables at error severity rewrite test assertions under that supposedly safe tier:

| Rule | Rewrites |
| --- | --- |
| `vitest/prefer-strict-equal` | `toEqual` → `toStrictEqual` |
| `vitest/prefer-to-be-truthy` | `toBe(true)` → `toBeTruthy()` |
| `vitest/prefer-to-be-falsy` | `toBe(false)` → `toBeFalsy()` |
| `vitest/prefer-describe-function-title` | the string title of a `describe` block |

The first three weaken what the assertion checks: `toBeTruthy()` passes on `1`, `"0"` and `{}`, which `toBe(true)` rejects. Applied on commit, they rewrite tests silently, in files the author already reviewed, and the commit still looks like the diff that was staged. One repository had 121 assertions changed this way before anyone noticed. This is an oxlint defect — `--fix` is documented as the tier that does not change behaviour — but until it is fixed, keep lint out of the commit hook. Pre-push runs the full lint and reports these as findings, which is where they belong.

The older names `howells-ox-fix` and `howells-format` are still accepted (legacy) for projects mid-migration; both format only.

### Pre-push

Runs the project's `pnpm prepush` script when one exists, so each repository can define the narrowest appropriate gate for its own architecture. Projects without that script retain the backward-compatible `pnpm typecheck` followed by `pnpm lint` fallback. The selected gate must pass before code reaches the remote.

Both run against the **working directory**, so their result only describes what is being pushed when the working directory is what is being pushed. Git names the refs on stdin, so the hook can tell:

| What you are pushing | What happens |
| --- | --- |
| The commit you have checked out | Typecheck and lint run. A failure blocks the push. |
| A ref that is not `HEAD` | Skipped, and said out loud. The checks would describe a different tree. |
| A branch deletion | Ignored; nothing is being added to check. |
| Nothing on stdin | Checked anyway. An unverified push is what this hook exists to stop. |

**Why a non-`HEAD` push is skipped rather than failed.** It is neither a pass nor a failure - it is unverifiable, and reporting the wrong tree's result is worse than admitting the hook cannot see. The case this matters for is the rescue path: work that exists in one place, in a tree that does not typecheck, is exactly what most needs pushing. The old behaviour failed that push for a reason unrelated to what was being pushed, leaving `--no-verify` as the only route - which disables every gate at once.

### The hooks are immutable, and now they say so

`.husky/pre-commit` and `.husky/pre-push` are overwritten from this package on every install. That is deliberate: a repo cannot weaken its own gate to get something to pass.

What changed is that it is no longer silent. If an install replaces a hook whose contents differ from the packaged one, it says so and names the file. Before, a customised hook vanished on the next `pnpm install` with nothing printed, so whoever wrote it believed it was in effect until it demonstrably was not.

**To change a hook, change it here and publish.** There is no per-repo override, by design.

## Requirements

Your `package.json` must have:

- a `"prepush"` script appropriate to the repository, or both:
  - a `"typecheck"` script (e.g. `tsc --noEmit` or `turbo run typecheck`)
  - a `"lint"` script (e.g. `howells-lint` or `turbo run lint`)
- inline or standard external lint-staged configuration appropriate to the project, running a formatter only

## Why a package?

The hooks are shipped from the package, not stored in the project. This means:

- Agents can't weaken hooks to get code to pass
- All projects share identical gate configuration
- Upgrading the package upgrades the hooks everywhere

## Skipped environments

Hooks are skipped when `CI=true` or `VERCEL=1` (no git hooks needed in CI/deployment).
