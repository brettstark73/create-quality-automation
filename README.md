# QA Architect

Quality automation CLI for JavaScript/TypeScript and Python projects. One command adds ESLint, Prettier, Husky, lint-staged, and GitHub Actions. Pro tiers add security scanning (Gitleaks), Smart Test Strategy, and multi-language support.

**This repo = the free CLI.** For the Pro dashboard with repo analytics, CI integration, and automation workflows, see [QA Architect Pro](https://vibebuildlab.com/qa-architect) (included in VBL Starter Kit).

---

> **Maintainer & Ownership**
> This project is maintained by **Vibe Build Lab LLC**, a studio focused on AI-assisted product development, micro-SaaS, and "vibe coding" workflows for solo founders and small teams.
> Learn more at **https://www.vibebuildlab.com**.

---

## Features

- **Prettier Code Formatting** - Consistent code style across your project
- **Husky Git Hooks** - Pre-commit (lint-staged) and pre-push (validation)
- **lint-staged Processing** - Only process changed files for speed
- **Pre-push Validation** - Prevents broken code from reaching CI
- **GitHub Actions** - Automated quality checks in CI/CD
- **TypeScript Smart** - Auto-detects and configures TypeScript projects
- **Python Support** - Complete Python toolchain with Black, Ruff, isort, mypy, pytest
- **Security Automation** - npm audit (Free), Gitleaks + ESLint security (Pro)
- **Progressive Quality** - Adaptive checks based on project maturity
- **Smart Test Strategy** - Risk-based pre-push validation (Pro feature)

## Target Users

- **Developers** who want quality automation without manual setup
- **Teams** standardizing code quality across multiple projects
- **Open source maintainers** enforcing contribution standards
- **Agencies** shipping consistent quality across client projects

## Demo / Live Links

```bash
# Try it on any project
npx create-qa-architect@latest
```

## Pricing

| Tier           | Price             | What You Get                                                                                       |
| -------------- | ----------------- | -------------------------------------------------------------------------------------------------- |
| **Free**       | $0                | CLI tool, basic linting/formatting, npm audit (capped: 1 private repo, 50 runs/mo)                 |
| **Pro**        | $19/mo or $190/yr | **Security scanning (Gitleaks + ESLint security)**, Smart Test Strategy, multi-language, unlimited |
| **Team**       | Contact us        | + RBAC, Slack alerts, multi-repo dashboard, team audit log _(coming soon)_                         |
| **Enterprise** | Contact us        | + SSO/SAML, custom policies, compliance pack, dedicated TAM _(coming soon)_                        |

> **Pro included in [VBL Starter Kit](https://vibebuildlab.com/starter-kit)** — Team/Enterprise are standalone purchases.

### Security Features by Tier

| Feature                     | Free | Pro+ |
| --------------------------- | ---- | ---- |
| npm audit (basic)           | ✅   | ✅   |
| Gitleaks (secrets scanning) | ❌   | ✅   |
| ESLint security rules       | ❌   | ✅   |

### License

**Commercial License (freemium)** — free tier covers the basic CLI; Pro/Team/Enterprise features require a paid subscription. See [LICENSE](LICENSE).

## Tech Stack

| Component       | Technology                                         |
| --------------- | -------------------------------------------------- |
| **Runtime**     | Node.js 20+                                        |
| **Linting**     | ESLint 9 (flat config)                             |
| **Formatting**  | Prettier 3                                         |
| **CSS Linting** | Stylelint 16                                       |
| **Git Hooks**   | Husky 9 + lint-staged 15                           |
| **Python**      | Black, Ruff, mypy, pytest                          |
| **Performance** | Lighthouse CI                                      |
| **Security**    | npm audit (Free), Gitleaks + ESLint security (Pro) |

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 10+ (installed automatically with Node 20)
- Git repository (required for hooks)

### Quick Start

```bash
# Navigate to your project
cd your-project/

# Bootstrap quality automation
npx create-qa-architect@latest

# Install new dependencies
npm install

# Set up pre-commit hooks
npm run prepare
```

### Update Existing Setup

```bash
npx create-qa-architect@latest --update
npm install
npm run lint
```

### Dependency Monitoring (Free)

```bash
npx create-qa-architect@latest --deps
```

## Usage Examples

### Check Project Maturity

```bash
npx create-qa-architect@latest --check-maturity
```

**Output:**

```
Project Maturity Report

Maturity Level: Development
Description: Active development - has source files and tests

Quality Checks:
  Required: prettier, eslint, stylelint, tests
  Optional: security-audit
  Disabled: coverage, documentation
```

### Security Validation

```bash
# Check configuration security
npx create-qa-architect@latest --security-config

# Validate documentation
npx create-qa-architect@latest --validate-docs

# Comprehensive validation
npx create-qa-architect@latest --comprehensive
```

### Custom Templates

```bash
# Use organization-specific standards
npx create-qa-architect@latest --template ./my-org-templates
```

## What Gets Added

```
your-project/
├── .github/
│   └── workflows/
│       └── quality.yml          # GitHub Actions workflow
├── .husky/                      # Pre-commit hooks
├── .editorconfig                # Editor defaults
├── .eslintignore                # ESLint ignore patterns
├── .lighthouserc.js             # Lighthouse CI config
├── .npmrc                       # npm configuration
├── .nvmrc                       # Node version pinning
├── .prettierrc                  # Prettier configuration
├── .stylelintrc.json            # Stylelint rules
├── eslint.config.cjs            # ESLint flat config
└── package.json                 # Updated scripts
```

## Available Scripts (After Setup)

```bash
npm run format              # Format all files
npm run format:check        # Check formatting (CI)
npm run lint                # ESLint + Stylelint
npm run lint:fix            # Auto-fix linting
npm run security:audit      # Vulnerability check
npm run security:secrets    # Scan for secrets
npm run validate:pre-push   # Pre-push validation
```

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and strategic direction.

## Contributing

Want to improve this tool?

1. Fork the repository
2. Make your changes
3. Test with a sample project
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Support

1. Review GitHub Actions logs
2. Open an issue in this repository

## License

Commercial freemium license — the base CLI is free to use; Pro/Team/Enterprise features require a paid subscription. See [LICENSE](LICENSE) for details.

## Legal

- [Privacy Policy](https://vibebuildlab.com/privacy-policy)
- [Terms of Service](https://vibebuildlab.com/terms)

---

> **Vibe Build Lab LLC** · [vibebuildlab.com](https://vibebuildlab.com)
