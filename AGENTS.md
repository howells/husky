# husky

`@howells/husky` installs the pre-commit hook (`pnpm lint-staged` only) into other repos via `prepare`. It installs no pre-push hook.

Issues and docs live in Linear (howells, HOW).

```sh
pnpm lint
pnpm test
```

Release: bump `version` in package.json, commit, push a matching `vX.Y.Z` tag; `release.yml` publishes to npm. Don't overwrite others' uncommitted work.
