# Repository Guidelines

## Structure & Scope

- `setup.js` is the published CLI (`create-qa-architect`) used via `npx`; it detects `--update`, TypeScript presence, and writes configs idempotently.
- `config/defaults.js` centralises script, dependency, and lint-staged templates; adjust versions there first.
- Flat ESLint configs (`eslint.config.cjs`, `eslint.config.ts.cjs`), `.editorconfig`, Stylelint/Prettier files, and `.husky/` assets ship with the npm package (see `package.json:files`).
- Documentation lives in `README.md` and `CHANGELOG.md`; keep both aligned with any behavioural change.

## CLI & Tooling Conventions

- Run shell commands through the Codex CLI harness; prefix with `bash -lc` and always set the `workdir` parameter.
- Prefer `rg`/`rg --files` for repo searches; fall back to other tools only when ripgrep is unavailable.
- Honour the current sandbox (`workspace-write`) and approval policy (`on-request`); request elevation with a one-line justification when command failures require it.
- Network access is restricted; avoid commands that need outbound calls unless explicitly approved.

## Editing Constraints

- Default to ASCII output; only add non-ASCII when necessary and consistent with the target file.
- Add comments sparingly and only to clarify non-obvious logic.
- Never revert user-authored changes that you did not make; if unexpected diffs appear, pause and ask the user how to proceed.
- Maintain idempotent behaviour in `setup.js`; new scripts or file writes must merge safely with existing consumer state.
- Never overwrite consumer metadata when parsing fails; surface the error and exit rather than regenerating files like `package.json`.

## Development & QA Commands

- `npm test` runs the integration smoke tests for both JS and TS fixtures; add scenarios here before modifying setup behaviour.
- `npm run lint`, `npm run lint:fix`, `npm run format`, and `npm run format:check` keep sources consistent.
- `npm run setup` executes the CLI against the repo itself for manual verification; prefer this plus `npm test` before releases.
- Use `npm pack` to inspect the publishable tarball locally.

## Coding Standards

- ESLint uses flat config; edit rule sets inside `eslint.config.cjs` (and `eslint.config.ts.cjs` for TS-specific tweaks) instead of per-file overrides.
- Prettier dictates 2-space, single quotes, 80 line width; Stylelint extends `stylelint-config-standard`.
- Maintain idempotent behaviour in `setup.js`; any new file copy or script mutation must safely merge with existing consumer state.

## Release Process

- Update `CHANGELOG.md` and bump `package.json`/`package-lock.json` versions via `npm version`.
- Run `npm test`, `npm run lint`, and `npm run format:check` before tagging.
- Tag the release (`git tag vX.Y.Z`) and push tags; publish with `npm publish --access public`.
- Announce new usage (e.g., `npx create-qa-architect@latest --update`) in README when behaviour shifts.

## Pull Request Expectations

- Keep commits focused; follow the conventional summary style (`Template: …`, `Docs: …`).
- Document validation steps (commands run, npm pack hash) in PR descriptions.
- Note optional clean-up, like removing `.eslintignore` when consumers fully adopt flat config, rather than forcing it.

## Planning & Communication

- Skip the plan tool for straightforward tasks; when you do plan, avoid single-step plans and keep status updates in sync with progress.
- Follow final-response formatting: concise bullet-first updates, inline code references (`path:line`), and actionable next steps when relevant.
- Summarise command output rather than pasting raw logs; highlight only the details the user needs.
- Keep the tone collaborative and professional; ask clarifying questions only when the task cannot proceed with available information.
