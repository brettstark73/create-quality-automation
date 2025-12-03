# Quality Gates & Merge Readiness (Default Recommendations)

These defaults are meant to give teams a simple, enforceable bar. They are intentionally conservative so most repos can adopt them on day one without re-architecting.

## Targets

- Coverage: **80%** (line) for critical paths; **70%** repo-wide minimum.
- Lint: **0** blocking ESLint/Stylelint errors; warnings allowed but surface in PR comment/summary.
- Secrets: **0** leaked secrets (gitleaks hard fail).
- Dependency vulns: No **high/critical** advisories (npm/yarn/pnpm audit). Medium allowed with justification.
- Performance budgets (CI): installs < 2m; test suite < 5m (already enforced in workflow).

## How to enforce

- GitHub Actions: quality.yml is wired to fail on lint/scan/test failures. Set env `MIN_COVERAGE=80` to gate on coverage (add a coverage reporter such as `c8` or `vitest --coverage`).
- Branch protection: require the “Quality Checks” workflow to pass; enable dismiss stale approvals on push.
- PR comments: run setup with `--pr-comments` to surface gate status in the PR thread.
- Alerts: run setup with `--alerts-slack` to post failures to Slack.

## Exceptions

- Allow temporary waivers via labels (e.g., `risk-accepted`) and document in the PR body.
- Lower coverage floors for greenfield proofs-of-concept (set `MIN_COVERAGE=60`) but time-box the exemption.

## Next steps

- Add repo-specific risk areas to `.qualityrc.json` under `riskAreas`.
- Track SLA drift in reports (future: audit log + team dashboard hooks).
