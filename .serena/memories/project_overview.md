# QA Architect - Project Overview

## Purpose

QA Architect (`create-qa-architect`) is a CLI tool that bootstraps quality automation for JavaScript/TypeScript, Python, and shell script projects. One command adds ESLint, Prettier, Husky, lint-staged, and GitHub Actions with Pro tiers adding security scanning (Gitleaks), Smart Test Strategy, and multi-language support.

## Tech Stack

- **Runtime**: Node.js 20+ (Volta pinned to 20.11.1)
- **Language**: JavaScript (Node.js) with TypeScript type checking
- **CLI Framework**: Native Node.js with `#!/usr/bin/env node` shebang
- **Package Manager**: npm 10.2.4
- **Testing**: Native Node.js assertions (no test framework)
- **Linting**: ESLint 9.x + Stylelint 16.x
- **Formatting**: Prettier 3.7.x
- **Git Hooks**: Husky 9.x + lint-staged 15.x
- **Coverage**: c8 (10.1.2)
- **Dependencies**:
  - js-yaml (YAML parsing)
  - ora (CLI spinners)
  - ajv + ajv-formats (JSON schema validation)
  - @npmcli/package-json (package.json manipulation)
  - tar (archive handling)

## Key Features

- Freemium model: FREE/PRO/TEAM/ENTERPRISE tiers
- Multi-language: JS/TS/Python/Shell scripts
- Adaptive quality: Project maturity detection (minimal→production-ready)
- Workflow tiers: Minimal/Standard/Comprehensive CI modes
- Smart Test Strategy: Risk-based pre-push validation (Pro)
- Security: Gitleaks, ESLint security rules (Pro)
