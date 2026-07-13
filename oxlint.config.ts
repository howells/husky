import core from "@howells/lint/oxlint/core";

const legacyCompatibilityRules = {
  "class-methods-use-this": "off",
  complexity: "off",
  curly: "off",
  "default-param-last": "off",
  "func-style": "off",
  "import/consistent-type-specifier-style": "off",
  "import/no-mutable-exports": "off",
  "import/no-named-default": "off",
  "jsdoc/check-tag-names": "off",
  "logical-assignment-operators": "off",
  "no-inline-comments": "off",
  "no-loop-func": "off",
  "no-negated-condition": "off",
  "no-nested-ternary": "off",
  "no-plusplus": "off",
  "no-unused-vars": "off",
  "no-use-before-define": "off",
  "prefer-destructuring": "off",
  "prefer-template": "off",
  "promise/avoid-new": "off",
  "promise/prefer-await-to-callbacks": "off",
  "promise/prefer-await-to-then": "off",
  "require-await": "off",
  "require-unicode-regexp": "off",
  "sort-keys": "off",
  "typescript/ban-ts-comment": "off",
  "typescript/ban-types": "off",
  "typescript/consistent-type-imports": "off",
  "typescript/no-empty-object-type": "off",
  "unicorn/catch-error-name": "off",
  "unicorn/no-array-for-each": "off",
  "unicorn/no-array-reduce": "off",
  "unicorn/no-array-sort": "off",
  "unicorn/no-await-expression-member": "off",
  "unicorn/no-hex-escape": "off",
  "unicorn/no-negated-condition": "off",
  "unicorn/no-nested-ternary": "off",
  "unicorn/no-unreadable-array-destructuring": "off",
  "unicorn/no-useless-switch-case": "off",
  "unicorn/prefer-module": "off",
  "unicorn/prefer-spread": "off",
  "unicorn/text-encoding-identifier-case": "off",
};

export default {
  extends: [core],
  ignorePatterns: [
    "coverage/**",
    "dist/**",
    "node_modules/**",
    ".next/**",
    "out/**",
  ],
  rules: {
    ...legacyCompatibilityRules,
  },
  overrides: [
    {
      // The install-time bin and its co-located tests are untyped .mjs. The
      // type-aware rules below can only ever fire as false positives against
      // JS the type checker sees as `any`, so they are disabled here by
      // explicit rule ID (never a wildcard). The two `off`s that are not
      // type-noise — no-restricted-properties (process.env reads) and
      // no-os-command-from-path (the `npx husky` fallback) — are legitimate in
      // a ~150-line installer and not worth an env-schema/abstraction.
      files: ["bin/**/*.mjs"],
      rules: {
        "typescript/no-unsafe-argument": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/no-unsafe-call": "off",
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-unsafe-return": "off",
        "typescript/strict-boolean-expressions": "off",
        // Another type-aware rule that only ever fires against the untyped
        // `any` view of this JS; the installer deliberately keeps its `||`
        // guards, whose behaviour is identical here.
        "typescript/prefer-nullish-coalescing": "off",
        "eslint/no-restricted-properties": "off",
        "sonarjs/no-os-command-from-path": "off",
        // The co-located tests use node:test + node:assert (matching the
        // @howells/lint test harness), not vitest — this rule is a false
        // positive for that deliberate, zero-dependency choice.
        "vitest/no-import-node-test": "off",
      },
    },
  ],
};
