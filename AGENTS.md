# Repository Guidelines

## Quick Orientation

This repo packages the `create-qa-architect` CLI and supporting assets for quality automation. Treat `setup.js` as the entrypoint, keep CLI helpers in `lib/` and `scripts/`, and look to `config/`, `templates/`, `docs/`, and `.github/workflows/` (daily deploy checks, weekly audits, Dependabot auto-merge) for defaults and CI glue.

## Project Structure & Module Organization

- `setup.js`, `create-saas-monetization.js`, and `scripts/` orchestrate CLI commands, template validation, and end-to-end helpers (e.g., `scripts/test-e2e-package.sh`).
- `lib/` holds reusable modules (validation, dependency monitoring, licensing) consumed by the CLI.
- `config/` carries defaults, command patterns, and security specs that get merged into generated projects.
- `tests/` keeps the exhaustive suite of `*.test.js` files that execute in Node (integration, CLI, security, telemetry, etc.).
- `templates/`, `docs/`, and marketing/legal subdirectories contain the public-facing documentation bundled into the scaffolded projects.
- `.github/` hosts workflows, release checklists, and automation scripts that gate merges.

## Build, Test, and Development Commands

- `npm run format` / `npm run format:check` — run Prettier across the repo. Use `npm run lint:fix` for auto-fixes.
- `npm run lint` / `npm run type-check` — flat ESLint config plus Stylelint coverage over CSS/SCSS/PCSS assets, and TS type checks via `tsconfig.json`.
- `npm test` (or `npm run test:fast`/`:medium`/`:slow`) — sequentially executes the full `tests/*.test.js` suite; `test:fast` mirrors the unit subset.
- `npm run validate:pre-push` — runs pattern checks, lint, formatting, command tests, and the core suite; mimic this before pushing PRs.
- `npm run docs:check` / `npm run validate:docs` — verify markdown and docs wiring after edits.
- `npm run security:audit|security:secrets|security:config` — run npm audit, inspect for secrets, and verify security-aware setup paths.

## Coding Style & Naming Conventions

- Follow `.editorconfig`: 2-space indentation, LF line endings, UTF-8 text, blank line at EOF.
- Prettier (v3) is the formatter; ESLint 9 flat config and Stylelint 16 enforce JS/TS and CSS style. Run `npm run lint:fix` before staging.
- File names use `kebab-case` for CLI helpers, `CamelCase` for classes, and `*.test.js` for tests. CLI flags and script arguments mirror the names in `tests/` (e.g., `--security-config`).

## Testing Guidelines

- Tests live under `tests/` (integration-heavy) and execute via `node tests/<name>.test.js`. Prefer real-world scenarios (see `tests/real-world-packages.test.js`).
- Name new suites `tests/<feature>.test.js` or extend existing `tests/cli-*.test.js` when covering commands.
- Run `npm run test:coverage` before release to ensure 75%+ coverage overall and at least 75% on critical files (`setup.js`, `lib/validation/*.js`).
- Use the TDD rhythm outlined in `CONTRIBUTING.md`: write failing tests, implement, then refactor.

## Commit & Pull Request Guidelines

- Follow the conventional commit pattern (`feat:`, `fix:`, `docs:`, `chore:`, etc.) as seen in recent history (e.g., `feat!: rename to QA Architect`).
- PRs need a clear summary, linked issue (if any), validation status (mention `npm run validate:pre-push` or relevant subset), and screenshots for UI/docs changes.
- Reference `.github/RELEASE_CHECKLIST.md` when preparing version bumps and run `npm run prerelease` as part of larger releases.

## Security & Configuration Tips

- Re-run `npm run docs:check` or `npm run validate:docs` after editing markdown assets.
- Use `npm run security:config` to regenerate ARM/OCI-friendly configs before publishing templates.
- Keep `.nvmrc` and `package.json` engines in sync (Node 20+, npm 10 via Volta) to avoid inconsistent developer environments.
