# Engineering Policy (NightshiftOS)

This repo follows a fix-first quality policy.

## Core Rule

We fix root causes before relaxing checks.

## CI Expectations

Required checks should stay meaningful:
- `build`
- `lint-changed`
- `smoke`

Security and quality checks are not ignored silently.

## Exception Rules (temporary only)

A temporary exception is allowed only when all are documented:
1. **Reason** (why immediate fix is not possible)
2. **Owner** (who will fix it)
3. **Expiry date** (when exception is removed)
4. **Tracking issue/PR**

No exception should be indefinite.

## Lint / Audit Strategy

- New/changed code must pass lint.
- Legacy debt is tracked and burned down in dedicated PRs.
- Dependency vulnerabilities are remediated with package updates/lockfile fixes.
- If a vulnerability cannot be fixed immediately, track mitigation + expiry.

## PR Standard

Each PR should include:
- What changed
- Why it changed
- Validation performed (build/tests/smoke)
- Any risk or rollback notes

## Release Standard

Before tagging a release:
1. Required checks green
2. Smoke workflow green
3. No untracked critical security exception
