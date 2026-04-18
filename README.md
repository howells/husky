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
    "*.{js,ts,jsx,tsx,json,jsonc,css}": "howells-format"
  }
}
```

That's it. On `pnpm install`, the hooks are installed automatically.

## What it does

### Pre-commit

Runs `pnpm lint-staged` — formats staged files with `howells-format`.

### Pre-push

Runs `pnpm typecheck` and `pnpm lint`. Both must pass before code reaches the remote.

## Requirements

Your `package.json` must have:

- `"typecheck"` script (e.g. `tsc --noEmit` or `turbo run typecheck`)
- `"lint"` script (e.g. `howells-lint` or `turbo run lint`)
- `"lint-staged"` config using `howells-format`

## Why a package?

The hooks are shipped from the package, not stored in the project. This means:

- Agents can't weaken hooks to get code to pass
- All projects share identical gate configuration
- Upgrading the package upgrades the hooks everywhere

## Skipped environments

Hooks are skipped when `CI=true` or `VERCEL=1` (no git hooks needed in CI/deployment).
