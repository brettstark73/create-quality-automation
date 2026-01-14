# QA Architect

Quality automation CLI for JavaScript/TypeScript, Python, and shell script projects. One command adds ESLint, Prettier, Husky, lint-staged, and GitHub Actions. Pro tiers add security scanning (Gitleaks), Smart Test Strategy, and multi-language support.

**This repo = the free CLI.** For the Pro dashboard with repo analytics, CI integration, and automation workflows, see [QA Architect Pro](https://vibebuildlab.com/qa-architect) (included in VBL Starter Kit).

---

> **Maintainer & Ownership**
> This project is maintained by **Vibe Build Lab LLC**, a studio focused on AI-assisted product development, micro-SaaS, and "vibe coding" workflows for solo founders and small teams.
> Learn more at **https://vibebuildlab.com**.

---

## Features

- **Prettier Code Formatting** - Consistent code style across your project
- **Husky Git Hooks** - Pre-commit (lint-staged) and pre-push (validation)
- **lint-staged Processing** - Only process changed files for speed
- **Pre-push Validation** - Prevents broken code from reaching CI
- **GitHub Actions** - Automated quality checks in CI/CD
- **TypeScript Smart** - Auto-detects and configures TypeScript projects
- **Python Support** - Complete Python toolchain with Black, Ruff, isort, mypy, pytest
- **Shell Script Support** - ShellCheck linting, syntax validation, permissions checks, best practices
- **Security Automation** - npm audit (Free), Gitleaks + ESLint security (Pro)
- **Progressive Quality** - Adaptive checks based on project maturity
- **Smart Test Strategy** - Risk-based pre-push validation (Pro feature)

### Quality Tools (v5.2.0+)

- **Lighthouse CI** - Performance, accessibility, SEO audits (Free: basic, Pro: thresholds)
- **Bundle Size Limits** - Enforce bundle budgets with size-limit (Pro)
- **axe-core Accessibility** - WCAG compliance testing scaffolding (Free)
- **Conventional Commits** - commitlint with commit-msg hook (Free)
- **Coverage Thresholds** - Enforce code coverage minimums (Pro)

### Pre-Launch Validation (v5.3.0+)

- **SEO Validation** - Sitemap, robots.txt, meta tags validation (Free)
- **Link Validation** - Broken link detection with linkinator (Free)
- **Accessibility Audit** - WCAG 2.1 AA compliance with pa11y-ci (Free)
- **Documentation Check** - README completeness, required sections (Free)
- **Env Vars Audit** - Validate .env.example against code usage (Pro)

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

### Quality Tools by Tier

| Feature                      | Free | Pro+ |
| ---------------------------- | ---- | ---- |
| Lighthouse CI (basic scores) | ✅   | ✅   |
| Lighthouse thresholds        | ❌   | ✅   |
| axe-core accessibility       | ✅   | ✅   |
| Conventional commits         | ✅   | ✅   |
| Bundle size limits           | ❌   | ✅   |
| Coverage thresholds          | ❌   | ✅   |

### Pre-Launch Validation by Tier

| Feature             | Free | Pro+ |
| ------------------- | ---- | ---- |
| SEO validation      | ✅   | ✅   |
| Link validation     | ✅   | ✅   |
| Accessibility audit | ✅   | ✅   |
| Documentation check | ✅   | ✅   |
| Env vars audit      | ❌   | ✅   |

### CI/CD Optimization by Tier

| Feature                      | Free | Pro+ |
| ---------------------------- | ---- | ---- |
| GitHub Actions cost analyzer | ❌   | ✅   |

## Workflow Tiers (GitHub Actions Cost Optimization)

qa-architect now defaults to **minimal CI** to avoid unexpected GitHub Actions bills. Choose the tier that matches your needs:

### Minimal (Default) - $0-5/month

**Best for:** Solo developers, side projects, open source

- Single Node version (22) testing
- Security scans run weekly (not on every commit)
- Path filters skip CI for docs/README changes
- **Runtime:** ~5-10 min/commit
- **Est. cost:** ~$0-5/mo for typical projects (2-5 commits/day)

```bash
npx create-qa-architect@latest
# or explicitly:
npx create-qa-architect@latest --workflow-minimal
```

### Standard - $5-20/month

**Best for:** Small teams, client projects, production apps

- Matrix testing (Node 20 + 22) **only on main branch**
- Security scans run weekly
- Path filters enabled
- **Runtime:** ~15-20 min/commit
- **Est. cost:** ~$5-20/mo for typical projects

```bash
npx create-qa-architect@latest --workflow-standard
```

### Comprehensive - $100-350/month

**Best for:** Enterprise teams, high-compliance projects, large teams

- Matrix testing (Node 20 + 22) on **every commit**
- Security scans inline (every commit)
- No path filters (runs on all changes)
- **Runtime:** ~50-100 min/commit
- **Est. cost:** ~$100-350/mo for typical projects

```bash
npx create-qa-architect@latest --workflow-comprehensive
```

### Switching Between Tiers

Already using qa-architect? Convert to minimal to reduce costs:

```bash
npx create-qa-architect@latest --update --workflow-minimal
```

### ⚠️ Avoid Duplicate Workflows

**qa-architect's `quality.yml` is designed to be your single CI workflow.** Do not use it alongside a separate `ci.yml` - this causes:

- **2-3x CI minutes usage** (both workflows run on every push)
- **Duplicate checks** (ESLint, tests, security scans run twice)
- **Unexpected billing** (easily exceeds GitHub's 2,000 min/month free tier)

**If you have both `ci.yml` and `quality.yml`:**

```bash
# Remove the duplicate ci.yml
rm .github/workflows/ci.yml

# Ensure quality.yml uses minimal mode
npx create-qa-architect@latest --update --workflow-minimal
```

The `quality.yml` workflow is adaptive - it runs appropriate checks based on your project's maturity level, so a separate `ci.yml` is unnecessary.

### Analyzing Your Costs (Pro Feature)

```bash
npx create-qa-architect@latest --analyze-ci
```

Shows estimated GitHub Actions usage and provides optimization recommendations.

### License

**Commercial License (freemium)** — free tier covers the basic CLI; Pro/Team/Enterprise features require a paid subscription. See [LICENSE](LICENSE).

## Tech Stack

| Component         | Technology                                         |
| ----------------- | -------------------------------------------------- |
| **Runtime**       | Node.js 20+                                        |
| **Linting**       | ESLint 9 (flat config)                             |
| **Formatting**    | Prettier 3                                         |
| **CSS Linting**   | Stylelint 16                                       |
| **Git Hooks**     | Husky 9 + lint-staged 15                           |
| **Python**        | Black, Ruff, mypy, pytest                          |
| **Shell Scripts** | ShellCheck, syntax validation, permissions checks  |
| **Performance**   | Lighthouse CI                                      |
| **Security**      | npm audit (Free), Gitleaks + ESLint security (Pro) |

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

### Pre-Launch Validation (Free)

```bash
npx create-qa-architect@latest --prelaunch
npm install
npm run validate:all
```

### Code Review (Free)

```bash
npx create-qa-architect@latest --review
```

Guides you through code review best practices:

- Detects if Claude Code CLI is available for autonomous review
- Provides instructions for using pr-review-toolkit agents
- Falls back to manual review checklist if needed

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

### GitHub Actions Cost Analysis (Pro)

```bash
# Analyze GitHub Actions usage and costs
npx create-qa-architect@latest --analyze-ci
```

**Output:**

```
📊 GitHub Actions Usage Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Repository: my-project

Estimated usage: 4,800 min/month
  Commit frequency: ~2.0 commits/day
  Workflows detected: 2

Workflow breakdown:
  ├─ ci.yml:
     • ~50 min/run
     • ~60 runs/month = 3000 min/month
  ├─ test.yml:
     • ~30 min/run
     • ~60 runs/month = 1800 min/month

💰 Cost Analysis
Free tier (2,000 min): ⚠️  EXCEEDED by 2,800 min
Overage cost: $22.40/month

Alternative options:
  Team plan ($4/user/month): Still exceeds (1,800 min overage)
    Total cost: $18.40/month
  Self-hosted runners: $0/min (but VPS costs ~$5-20/month)
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
