# Ownership + Hardening Plan

## Phase 1 (now)
- [x] Clone project into local workspace for audit
- [x] Identify critical risks (command injection, path traversal, XSS, weak shell boundaries)
- [x] Patch cron job ID validation in `/api/cron` PUT/DELETE
- [x] Restrict `/api/browse` workspace parameter to an explicit allowlist pattern

## Phase 2 (next)
- [ ] Replace shell-string execution with safer process APIs (`spawn`/`execFile` + arg arrays)
- [ ] Add centralized request validation (zod schemas)
- [ ] Add CSRF protection for state-changing routes
- [ ] Replace custom markdown renderer with sanitized parser pipeline
- [ ] Harden terminal API to command-specific handlers instead of generic shell

## Phase 3 (quality gates)
- [ ] Fix lint/type errors to zero
- [ ] Add API security tests (auth, traversal, injection, xss)
- [ ] CI: lint + typecheck + tests + npm audit gate
- [ ] Release branch strategy + protected main branch

## Forking checklist
- [ ] Create GitHub fork under your org
- [ ] Rename package/app metadata
- [ ] Replace logos/branding text
- [ ] Configure secrets + environments
- [ ] Enable Dependabot + code scanning
