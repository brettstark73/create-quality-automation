# Roadmap

_Status updated: November 4, 2025_

## Freemium Foundations (Done)

- Dependabot + GitHub Actions bootstrap via `--deps`
- License awareness with `--license-status`
- Comprehensive validation workflows (`--comprehensive`, `--security-config`, `--validate-docs`)

## Pro Tier (Private Beta – Target Q1 2026)

- Framework-aware dependency grouping (React, Next.js, Vue, Angular)
- Multi-language package monitoring (npm + Python, Rust, Go)
- Advanced security audit workflows with custom schedules
- Breaking change detection before merge

## Enterprise Tier (Design)

- Custom notification channels (Slack, Teams, email digests)
- Portfolio-wide dependency analytics and policy enforcement
- Managed multi-repository rollouts
- Priority support backed by shared incident playbooks

## Engineering Backlog

- Refactor `setup.js` into modular command handlers
- Expand automated tests to cover licensing messaging and premium toggles
- Replace shell-based secret/XSS checks in CI with shared validators

> For questions or feedback, open a GitHub issue once authentication is restored (`gh auth status` currently shows invalid token).\*\*\*
