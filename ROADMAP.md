# Roadmap

> Strategic direction and planned features for QA Architect

## Development Philosophy

**AI-accelerated development**: Features are built in hours/days, not weeks/months. Traditional quarterly roadmaps don't apply when using Claude, Cursor, and AI coding tools.

- **Feature implementation**: 1-4 hours typical, 1-2 days for complex features
- **New language support**: 1 day per language
- **Integrations**: 2-4 hours each

**Business timelines may differ**: Customer acquisition, revenue ramp, and market penetration follow normal curves regardless of build speed.

## Current Version: 5.0.7

## Completed

- [x] ESLint 9 flat config support
- [x] Progressive quality (maturity detection)
- [x] Python toolchain support (Black, Ruff, mypy, pytest)
- [x] Smart Test Strategy (Pro) - risk-based pre-push validation
- [x] Monorepo support (Nx, Turborepo, Lerna, Rush, npm/pnpm/yarn workspaces)
- [x] Interactive mode with guided setup
- [x] Custom template support
- [x] License tier system (Free/Pro/Team/Enterprise)
- [x] Dependency monitoring (Dependabot integration)

## In Progress (This Week)

- [ ] Stripe payment flow for Pro tier purchases (~4 hours)
- [ ] Landing page at vibebuildlab.com/qa-architect (~2 hours)

## Ready to Build (When Prioritized)

**Language Support** (~1 day each):

- [ ] Rust support (Cargo, clippy, rustfmt)
- [ ] Go support (go mod, golangci-lint)
- [ ] Java support (Maven/Gradle integration)

**Tooling** (~2-4 hours each):

- [ ] VS Code extension
- [ ] Performance budgets (bundle size, Lighthouse, build time)

**Team Features** (~1 day):

- [ ] Team tier implementation (org dashboard, shared quotas, policy enforcement)
- [ ] Slack/email alerts

**Enterprise** (1-2 days):

- [ ] SSO/SAML integration
- [ ] Compliance pack (SOC2, GDPR templates)
- [ ] On-prem license server for air-gapped environments

---

See [BACKLOG.md](BACKLOG.md) for tactical work items.
