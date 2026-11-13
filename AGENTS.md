# husky

`@howells/husky` installs the pre-commit hook (`pnpm lint-staged` only) into other repos via `prepare`. It installs no pre-push hook.

```sh
pnpm lint
pnpm test
```

Release: bump `version` in package.json, commit, push a matching `vX.Y.Z` tag; `release.yml` publishes to npm. Don't overwrite others' uncommitted work.

## Agent skills

### Issue tracker

Linear, workspace `howells`, team `HOW`. See `~/Sites/home/docs/agents/issue-tracker.md`.

### Triage labels

Default triage labels. See `~/Sites/home/docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `~/Sites/home/docs/agents/domain.md`.
