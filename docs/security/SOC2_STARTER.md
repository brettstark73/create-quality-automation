# SOC 2 Starter (Preflight Checklist)

This starter doc is a lightweight preflight for teams using QA Architect. It is not a substitute for a real SOC 2 program, but it maps common CI/quality controls to SOC 2 CC/PII areas.

## Controls to Wire First

- **Change Management (CC8.1):** Require PR review + Quality Checks workflow pass; enable branch protection on main.
- **Secure SDLC (CC6.1):** Keep ESLint security, gitleaks, dependency audit steps enabled; document exceptions in PRs.
- **Logging & Alerts (CC7.2):** Turn on Slack alerts via `--alerts-slack` and keep CI logs for 90 days.
- **Backup of Config (CC9.2):** Check in `.qualityrc.json`, `quality.yml`, and Dependabot configs; avoid secrets in repo.
- **Access (CC6.2):** Use least-privilege GitHub tokens; rotate `GITLEAKS_TOKEN`/`SEMGREP_APP_TOKEN` every 90 days.

## Evidence You Can Collect Today

- CI run artifacts showing lint/test/security passes.
- Dependency audit reports (npm audit logs) and gitleaks scan results.
- Coverage reports (c8/Vitest/Jest) stored in artifacts.
- PR comments from quality workflow (when `--pr-comments` is enabled).

## Gaps to plan for

- **SSO/SAML & RBAC:** Future roadmap item; track in issue tracker.
- **Audit logging:** Add a central log sink (e.g., S3/CloudWatch) for CI events.
- **Vendor risk:** Document third-party actions; pin SHAs (already pinned in quality.yml) and review quarterly.

## How to use this file

- Keep it checked in; edit per repo to note exceptions and waivers.
- Link it in onboarding docs so new contributors know the expected bar.
