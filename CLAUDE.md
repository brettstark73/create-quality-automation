# CLAUDE.md - QA Architect

This file provides guidance to Claude Code when working with QA Architect.

## Overview

**Product**: QA Architect (create-qa-architect)
**Type**: CLI quality automation tool
**Maintainer**: Vibe Build Lab LLC
**Repository**: https://github.com/vibebuildlab/create-qa-architect

## Pricing (Reference: vibebuildlab/docs/PRICING_STRATEGY.md)

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | CLI tool, basic quality automation |
| Pro | $29/mo or $199/yr | Dashboard, Smart Test Strategy |
| Bundle | Included in Vibe Lab Pro | Full Pro access |

## Key Commands

```bash
# Development
npm run lint            # ESLint 9 flat config + Stylelint
npm run lint:fix        # Auto-fix linting issues
npm run format          # Format with Prettier
npm run format:check    # Check formatting
npm test                # Run Jest tests
npm run test:coverage   # Coverage report

# CLI Usage
npx create-qa-architect@latest              # Bootstrap quality automation
npx create-qa-architect@latest --update     # Update existing setup
npx create-qa-architect@latest --deps       # Dependency monitoring
npx create-qa-architect@latest --check-maturity  # Project maturity report

# Release
npm run prerelease      # Pre-release validation
npm run release:patch   # Bump patch version
```

## Tech Stack

- **Runtime**: Node.js 20+
- **Linting**: ESLint 9 (flat config)
- **Formatting**: Prettier 3
- **CSS**: Stylelint 16
- **Git Hooks**: Husky 9 + lint-staged 15
- **Python**: Black, Ruff, mypy, pytest
- **Security**: Gitleaks, npm audit

## Architecture

- `setup.js` - Main CLI entry point
- `lib/` - Core functionality modules
- `templates/` - Project templates
- `config/` - Language-specific configs
- `tests/` - Jest test suite

## Smart Test Strategy (Pro Feature)

Risk-based pre-push validation:
- Risk ≥7: Comprehensive (all tests + security)
- Risk 4-6: Medium (fast + integration)
- Risk 2-3: Fast (unit tests only)
- Risk 0-1: Minimal (lint + format)

## When Editing

1. Run tests: `npm test`
2. Check lint: `npm run lint`
3. Run prerelease before version bump: `npm run prerelease`
4. Use Conventional Commits

## Legal References

- Privacy: https://vibebuildlab.com/privacy-policy
- Terms: https://vibebuildlab.com/terms

