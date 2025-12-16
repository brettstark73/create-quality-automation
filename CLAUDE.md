# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**npm**: `create-qa-architect` | **Version**: 5.0.7

## Project Overview

QA Architect is a CLI tool (`create-qa-architect`) that bootstraps quality automation for JS/TS/Python projects. One command adds ESLint, Prettier, Husky, lint-staged, and GitHub Actions. Pro tiers add security scanning (Gitleaks), Smart Test Strategy, and multi-language support.

## Commands

```bash
# Development
npm test                    # Run all tests (40+ test files)
npm run test:unit           # Fast unit tests only
npm run test:slow           # Integration tests (Python, monorepo, etc.)
npm run test:coverage       # Coverage report (75% lines, 70% functions required)
npm run lint                # ESLint + Stylelint
npm run format              # Prettier

# Run single test file
node tests/licensing.test.js
QAA_DEVELOPER=true node tests/setup.test.js

# Validation
npm run validate:all        # Full validation suite
npm run prerelease          # Required before publishing

# CLI testing
npx . --dry-run             # Test setup without changes
npx . --check-maturity      # Show project maturity detection
npx . --validate            # Run validation checks
```

## Architecture

```
setup.js                    # Main CLI entry - argument parsing, orchestration
├── lib/
│   ├── licensing.js        # Tier system (FREE/PRO/TEAM/ENTERPRISE), feature gating
│   ├── project-maturity.js # Detects project stage (minimal→production-ready)
│   ├── smart-strategy-generator.js  # Risk-based test selection (Pro)
│   ├── dependency-monitoring-*.js   # Dependabot config generation
│   ├── validation/         # Validators (security, docs, config)
│   ├── interactive/        # TTY prompt system
│   └── template-loader.js  # Custom template merging
├── templates/              # Config file templates
├── config/                 # Language-specific configs (Python, etc.)
└── tests/                  # 40+ test files
```

### Data Flow

1. **Parse args** → `parseArguments()` handles CLI flags
2. **Route command** → validation-only, deps, license, or full setup
3. **Detect project** → TypeScript, Python, Stylelint targets
4. **Load templates** → merge custom templates with defaults
5. **Generate configs** → ESLint, Prettier, Husky hooks, workflows
6. **Apply enhancements** → production quality fixes

### License Tier System

The tool uses a freemium model with feature gating in `lib/licensing.js`:

- **FREE**: Basic linting/formatting, 1 private repo, 50 runs/month
- **PRO**: Security scanning, Smart Test Strategy, unlimited
- **TEAM/ENTERPRISE**: RBAC, Slack alerts, multi-repo dashboard

Check tier with `hasFeature('smartTestStrategy')` or `getLicenseInfo()`.

## Key Files

- `setup.js:390-500` - Main entry, interactive mode handling
- `setup.js:985-2143` - Core setup flow (`runMainSetup`)
- `lib/licensing.js` - All tier logic, usage caps, feature gates
- `lib/project-maturity.js` - Maturity detection algorithm
- `config/defaults.js` - Default scripts, dependencies, lint-staged config

## Testing Patterns

Tests use real filesystem operations with temp directories:

```javascript
const testDir = createTempGitRepo()
execSync('node setup.js --deps', { cwd: testDir })
assert(fs.existsSync(path.join(testDir, '.github/dependabot.yml')))
```

The `QAA_DEVELOPER=true` env var bypasses license checks during testing.

## Quality Gates

- Coverage: 75% lines, 70% functions, 65% branches
- Pre-push: lint, format:check, test:patterns, test:commands, test
- Pre-release: `npm run prerelease` (docs:check + all tests + e2e)
