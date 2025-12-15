# QA Architect - Claude Guide

> CLI quality automation tool that bootstraps linting, formatting, security, and CI/CD for JS/TS/Python projects.

**npm**: `create-qa-architect` | **Version**: 5.0.7

## Tech Stack

| Layer    | Technology                           |
| -------- | ------------------------------------ |
| Runtime  | Node.js 20+, JavaScript (ES6+)       |
| Linting  | ESLint 9 + Prettier 3 + Stylelint 16 |
| Hooks    | Husky 9 + lint-staged 15             |
| Security | Gitleaks, ESLint security            |
| Coverage | c8 (75% lines, 70% functions)        |

## Key Commands

```bash
npm run lint             # ESLint + Stylelint
npm run format           # Prettier
npm test                 # All tests
npm run test:coverage    # Coverage report
npm run validate:all     # All validation
npm run prerelease       # Pre-release validation
```

## CLI Flags

```bash
# Setup
npx create-qa-architect          # Full setup
npx create-qa-architect --interactive
npx create-qa-architect --dry-run

# Validation
npx create-qa-architect --validate
npx create-qa-architect --validate-docs
npx create-qa-architect --validate-config
npx create-qa-architect --alerts-slack
npx create-qa-architect --pr-comments
npx create-qa-architect --check-maturity

# License
npx create-qa-architect --license-status
npx create-qa-architect --activate-license
```

## Project Structure

```
qa-architect/
├── setup.js             # Main CLI entry
├── lib/
│   ├── licensing.js     # Feature gating
│   ├── smart-strategy-generator.js
│   └── project-maturity.js
├── templates/           # Config templates
├── tests/              # 40+ test files
└── docs/               # Architecture, testing, SLA gates
```

## Coverage Thresholds

- Lines/Statements/Functions/Branches: 75%+ overall (Setup.js 80% target)

## What NOT to Do

- Don't bypass quality gates
- Don't use `--no-verify` on commits
- Don't publish without `npm run prerelease`
- Don't hardcode secrets

---

_See `docs/` for ARCHITECTURE, TESTING, SLA_GATES. Global rules in `~/.claude/CLAUDE.md`._
