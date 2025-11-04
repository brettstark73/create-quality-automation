# Comprehensive Code Review

Perform a thorough code review following this systematic checklist:

## 1. Repository Orientation

- Map the directory structure (src, templates/modules, docs, scripts, automation).
- Summarize project purpose, major features/components, and documented roadmap or TODOs.
- Note any existing issues or PRs that impact current work.

## 2. Dependency & Build Health

- Inventory runtime/dev dependencies (package managers, lockfiles) and flag:
    - Outdated or deprecated packages.
    - Known security-issue packages.
    - Version mismatches across modules.
- Execute install/build steps (use custom commands above if provided); report failures or warnings.
- Run npm audit, yarn audit, cargo audit, etc. as applicable; capture notable advisories.

## 3. Testing & Automation

- Run standard checks (lint, test, type-check, build) per the stack—or custom commands provided.
- Record results, flaky behavior, or gaps in coverage.
- Review automation scripts (e.g., CI/CD workflows, smoke-test scripts, custom runners) for accuracy, portability, and alignment with documented processes.
- Review existing tests for coverage depth; identify critical areas lacking tests.

## 4. Code Quality & Architecture

- Perform a targeted code review:
    - Project structure & module boundaries.
    - Patterns for data access, state, caching, and error handling.
    - Security posture: auth, validation, secrets management, logging.
    - Performance considerations and scalability.
- Highlight duplicated logic or refactoring opportunities.
- Recommend architectural improvements aligned with project goals.

## 5. Documentation & Operations

- Verify READMEs, setup guides, docs/ content, release notes, and operational runbooks for accuracy.
- Ensure environment examples (.env.example, config samples) match real requirements.
- Check roadmap/strategy docs (if any) for feasibility and alignment with codebase state.
- Confirm instructions exist for smoke tests, automation scripts, deployments, and dependency management.

## 6. Backlog & Recommendations

- Classify findings by severity (critical/high/medium/low).
- Suggest concrete remediations (new tests, refactors, dependency updates, doc fixes).
- Update or draft a TODO/task list; include owner/categories if known.
- Separate quick wins from longer-term initiatives.

## 7. Deliverables

- Markdown report with sections matching 1–6 above.
- Table or bullet list of commands run and their outcomes.
- Prioritized recommendations with rationale.
- Optional: open issues/PRs for urgent fixes (reference them in the report).

---

## Guidelines

- Keep assumptions explicit; note any blockers (permission errors, missing secrets).
- Attach snippets/logs where helpful (trim to essentials).
- If project uses alternative tooling, adapt commands accordingly.
- If additional review (e.g., security threat model, performance profiling) is warranted, call it out in recommendations.
