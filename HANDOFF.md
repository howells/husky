# Handoff

**Written 17 September 2026 by the cross-repo consolidation pass.** No session was
working in this repo, so this page records its state rather than work in progress.

## State

Branch `main`, working tree clean, level with `origin/main`. Nothing unpushed, no
branches outstanding, no stashes.

## What this repo is

`@howells/husky`: standardised git hooks for Howells projects, as immutable pre-commit
and pre-push configuration. It is consumed across the estate, so a change here reaches
every repo that installs it.

Recent commits, newest first: naming the repository the package is actually built from,
ignoring packed tarballs, and a fix to recommend a formatter for staging rather than a
lint fix.

## Why that last one matters

Staging through a lint autofixer rewrites code as a side effect of committing, which is
how an unreviewed change reaches a commit nobody meant to make. Several repos took the
matching change today. If you are debugging why a commit contains edits the author did
not write, start here.

## Next action

None recorded. Treat changes to these hooks as estate-wide rather than local, since
every consuming repo picks them up on install.
