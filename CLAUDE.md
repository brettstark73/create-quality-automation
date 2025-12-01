# CLAUDE.md - QA Architect

This file provides guidance to Claude Code when working with QA Architect.

## Project Information

**Product**: QA Architect (create-qa-architect)
**Type**: CLI quality automation tool
**Maintainer**: Vibe Build Lab LLC
**Repository**: https://github.com/vibebuildlab/create-qa-architect
**Runtime**: Node.js 20+

## Pricing (Source of truth: lib/licensing.js)

| Tier           | Price                     | Features                                                                                                 |
| -------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Free**       | $0                        | CLI tool, basic linting/formatting, basic npm audit (capped: 1 private repo, 50 runs/mo)                 |
| **Pro**        | $59/mo or $590/yr         | **Security scanning (Gitleaks + ESLint security)**, Smart Test Strategy, multi-language, unlimited repos |
| **Team**       | $15/user/mo (5-seat min)  | + RBAC, Slack alerts, multi-repo dashboard, team audit log                                               |
| **Enterprise** | $249/mo + $499 onboarding | + SSO/SAML, custom policies, compliance pack, dedicated TAM                                              |

**Note:** Pro is included in [Vibe Lab Pro](https://vibebuildlab.com/pro). Team/Enterprise are standalone purchases.

### Security Feature Breakdown

| Feature                     | Free | Pro+ |
| --------------------------- | ---- | ---- |
| npm audit (basic)           | ✅   | ✅   |
| Gitleaks (secrets scanning) | ❌   | ✅   |
| ESLint security rules       | ❌   | ✅   |

## Project-Specific Commands

```bash
# Development
npm run lint            # ESLint 9 flat config + Stylelint
npm run lint:fix        # Auto-fix linting issues
npm run format          # Format with Prettier
npm run format:check    # Check formatting
npm test                # Run all tests
npm run test:coverage   # Coverage report
npm run setup           # Run setup.js locally

# CLI Usage
npx create-qa-architect@latest              # Bootstrap quality automation
npx create-qa-architect@latest --update     # Update existing setup
npx create-qa-architect@latest --deps       # Dependency monitoring
npx create-qa-architect@latest --check-maturity  # Project maturity report

# Release
npm run prerelease      # Pre-release validation
npm run release:patch   # Bump patch version
```

## Development Workflow

1. Run tests: `npm test`
2. Check lint: `npm run lint`
3. Run prerelease before version bump: `npm run prerelease`
4. Use Conventional Commits

## Quality Automation Features

- **ESLint 9**: Flat config with security plugin
- **Prettier 3**: Code formatting
- **Stylelint 16**: CSS linting
- **Husky 9**: Git hooks (pre-commit, pre-push)
- **lint-staged 15**: Process only changed files
- **Smart Test Strategy** (Pro): Risk-based pre-push validation
- **Security Scanning** (Pro): Gitleaks + ESLint security rules

### Smart Test Strategy (Pro Feature)

Risk-based pre-push validation:

- Risk ≥7: Comprehensive (all tests + security)
- Risk 4-6: Medium (fast + integration)
- Risk 2-3: Fast (unit tests only)
- Risk 0-1: Minimal (lint + format)

## Development Notes

### Architecture

- `setup.js` - Main CLI entry point
- `lib/` - Core functionality modules
- `templates/` - Project templates
- `config/` - Language-specific configs
- `tests/` - Test suite

### Tech Stack

- **Runtime**: Node.js 20+
- **Linting**: ESLint 9 (flat config)
- **Formatting**: Prettier 3
- **CSS**: Stylelint 16
- **Git Hooks**: Husky 9 + lint-staged 15
- **Python**: Black, Ruff, mypy, pytest (Pro+)
- **Security**: Gitleaks + ESLint security (Pro+), npm audit (Free)

## Legal References

- Privacy: https://vibebuildlab.com/privacy-policy
- Terms: https://vibebuildlab.com/terms
