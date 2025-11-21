# CI/CD and Quality Automation Patterns

This document captures common pitfalls, anti-patterns, and best practices for setting up quality automation in modern JavaScript/TypeScript and Python projects.

## Reference Templates

create-quality-automation includes reference workflow templates that implement these patterns:

- **`.github/workflows/pnpm-ci.yml`** - Modern pnpm workflow with correct action order, caching, and monorepo support
- **`.github/workflows/python-ci.yml`** - Python CI with Ruff, Black, mypy, pytest, and matrix testing
- **`config/.pre-commit-config.yaml`** - Comprehensive pre-commit hooks for Python + JavaScript/TypeScript

These templates are included in the npm package and can be copied from:

```bash
node_modules/create-quality-automation/.github/workflows/
node_modules/create-quality-automation/config/.pre-commit-config.yaml
```

Or view them on [GitHub](https://github.com/brettstark73/create-quality-automation/tree/main/.github/workflows).

## Table of Contents

- [GitHub Actions Patterns](#github-actions-patterns)
- [pnpm Workflow Patterns](#pnpm-workflow-patterns)
- [Python CI/CD Patterns](#python-cicd-patterns)
- [Pre-commit Hook Patterns](#pre-commit-hook-patterns)
- [Monorepo Patterns](#monorepo-patterns)
- [Security Patterns](#security-patterns)

## GitHub Actions Patterns

### ✅ DO: Use Latest Action Versions

**Good:**

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
- uses: actions/setup-python@v5
```

**Bad:**

```yaml
- uses: actions/checkout@v3 # Outdated
- uses: actions/setup-node@v3 # Outdated
```

**Why:** v4/v5 includes performance improvements, security fixes, and better caching mechanisms.

### ✅ DO: Enable Dependency Caching

**Good:**

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'pnpm' # or 'npm', 'yarn'
```

**Bad:**

```yaml
- uses: actions/setup-node@v4
# No cache specified - slow CI runs
```

**Why:** Caching dependencies can reduce CI time by 60-80%.

## pnpm Workflow Patterns

### ⚠️ CRITICAL: Action Setup Order

**Good:**

```yaml
# 1. Install pnpm FIRST
- uses: pnpm/action-setup@v4
  with:
    version: 9

# 2. THEN setup Node.js with cache
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm' # Now works!
```

**Bad:**

```yaml
# 1. Setup Node.js first
- uses: actions/setup-node@v4
  with:
    cache: 'pnpm' # FAILS - pnpm not installed yet!

# 2. Install pnpm too late
- uses: pnpm/action-setup@v4
```

**Why:** `setup-node` detects package managers at runtime. If pnpm isn't installed yet, caching silently fails, causing slow CI runs.

**Error Symptoms:**

- CI runs are slow despite cache: 'pnpm'
- No "Cache restored" message in logs
- Dependencies reinstall on every run

### ✅ DO: Use Frozen Lockfiles

**Good:**

```yaml
- run: pnpm install --frozen-lockfile
```

**Bad:**

```yaml
- run: pnpm install # May update dependencies unexpectedly
```

**Why:** Ensures deterministic builds and prevents CI from passing with different versions than local development.

## Monorepo Patterns

### ⚠️ CRITICAL: Build Before Test

**Good:**

```yaml
- run: pnpm run build --if-present # Build packages first
- run: pnpm test # Tests run against built packages
```

**Bad:**

```yaml
- run: pnpm test # Tests fail - packages not built yet!
- run: pnpm run build
```

**Why:** In monorepos with internal dependencies, tests import from `dist/` folders. If packages aren't built, tests fail with "Cannot find module" errors.

**Error Symptoms:**

- Local tests pass but CI fails
- "Cannot find module" errors in CI
- Import errors from workspace packages

### ✅ DO: Use --if-present for Optional Scripts

**Good:**

```yaml
- run: pnpm run build --if-present # Skips if no build script
- run: pnpm run type-check --if-present # Optional type checking
- run: pnpm test --if-present # Some packages may not have tests
```

**Bad:**

```yaml
- run: pnpm run build # Fails if package has no build script
```

**Why:** Allows workflow to work across different project types without failing on missing scripts.

## Python CI/CD Patterns

### ✅ DO: Test Multiple Python Versions

**Good:**

```yaml
strategy:
  matrix:
    python-version: ['3.9', '3.10', '3.11', '3.12']
```

**Bad:**

```yaml
# Only testing one version
python-version: '3.11'
```

**Why:** Ensures compatibility across Python versions, catches version-specific bugs.

### ✅ DO: Use pip Cache

**Good:**

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.11'
    cache: 'pip'
```

**Bad:**

```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.11'
    # No cache - slow pip installs
```

### ✅ DO: Layer Python Quality Tools

**Good:**

```yaml
- run: ruff check . # Fast linter
- run: black --check --diff . # Formatter check
- run: isort --check-only --diff . # Import sorting
- run: mypy . # Type checking
- run: bandit -r . -ll # Security scanning
```

**Why:** Each tool catches different issues:

- Ruff: Fast linting, replaces Flake8/Pylint
- Black: Consistent formatting
- isort: Import organization
- mypy: Static type checking
- Bandit: Security vulnerabilities

### ✅ DO: Use continue-on-error Strategically

**Good:**

```yaml
- run: mypy .
  continue-on-error: true # Don't block CI on strict type errors initially
- run: bandit -r . -ll
  continue-on-error: true # Security warnings shouldn't block deploys
```

**Why:** Allows gradual adoption of strict tools without blocking development.

## Pre-commit Hook Patterns

### ✅ DO: Use Ruff Instead of Black + Flake8

**Good (Modern):**

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.9
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```

**Old (Deprecated):**

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 24.10.0
    hooks:
      - id: black
  - repo: https://github.com/PyCQA/flake8
    rev: 7.1.1
    hooks:
      - id: flake8
```

**Why:** Ruff is 10-100x faster and replaces both Black and Flake8.

### ✅ DO: Configure isort for Black Compatibility

**Good:**

```yaml
- repo: https://github.com/PyCQA/isort
  rev: 5.13.2
  hooks:
    - id: isort
      args: ['--profile', 'black'] # Prevents conflicts with Black
```

**Bad:**

```yaml
- id: isort
  # No --profile black - conflicts with Black formatting
```

### ✅ DO: Use ESLint 9 Flat Config

**Good:**

```yaml
- repo: https://github.com/pre-commit/mirrors-eslint
  rev: v9.12.0
  hooks:
    - id: eslint
      args: [--fix, --max-warnings=0]
      additional_dependencies:
        - eslint@^9.12.0
```

**Bad:**

```yaml
- id: eslint
  rev: v8.x # Old config system
```

**Why:** ESLint 9 uses flat config (eslint.config.js), deprecates --ext flag, and has better performance.

## Security Patterns

### ✅ DO: Audit Production Dependencies Only

**Good:**

```bash
npm audit --audit-level high --omit=dev
pnpm audit --audit-level high --prod
```

**Bad:**

```bash
npm audit # Fails on dev dependency vulnerabilities
```

**Why:** Dev dependencies (testing tools, build tools) don't run in production. Blocking CI on dev vulnerabilities is overly strict.

### ✅ DO: Use Multiple Security Layers

**Good:**

```yaml
- run: gitleaks detect # Secret scanning
- run: npm audit --audit-level high --omit=dev # Dependency vulnerabilities
- run: eslint . # eslint-plugin-security for code issues
```

**Why:** Different tools catch different security issues:

- gitleaks: Hardcoded secrets
- npm audit: Dependency vulnerabilities
- ESLint security plugin: Code security issues

### ✅ DO: Fail Gracefully on Security Warnings

**Good:**

```yaml
- run: bandit -r . -ll
  continue-on-error: true # Warn but don't block
```

**Why:** Security tools can have false positives. Use continue-on-error for initial adoption, then tighten gradually.

## Command Execution Patterns

### ✅ DO: Validate Generated Commands

**Good:**

Create test scripts that execute generated commands in real projects:

```javascript
// test:commands
const { execSync } = require('child_process')
execSync('npm run lint', { cwd: './test-project' })
execSync('npm run format', { cwd: './test-project' })
```

**Bad:**

```javascript
// Only validate command strings, never execute
const cmd = getCommand()
assert(cmd.includes('eslint'))
```

**Why:** Command string validation doesn't catch execution errors like wrong flags, missing dependencies, or cross-platform issues.

### ✅ DO: Test Cross-Platform Compatibility

**Good:**

Use Node.js APIs instead of shell commands:

```javascript
// Good - works everywhere
const fs = require('fs')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
if (pkg.scripts['test:patterns']) {
  // Run script
}
```

**Bad:**

```bash
# Bad - Windows incompatible
if grep -q '"test:patterns"' package.json; then
  npm run test:patterns
fi
```

**Why:** Bash commands (grep, find, cat) don't work on Windows. Use Node.js APIs for portability.

## Validation Patterns

### ✅ DO: Use --if-present for Chained Scripts

**Good:**

```json
{
  "scripts": {
    "validate:pre-push": "npm run test:patterns --if-present && npm run lint && npm run format:check && npm test --if-present"
  }
}
```

**Bad:**

```json
{
  "scripts": {
    "validate:pre-push": "npm run test:patterns && npm run lint && npm test"
    // Fails if test:patterns or test scripts don't exist
  }
}
```

**Why:** Allows validation scripts to work gracefully across different project types. Returns exit code 0 when script is missing, enabling safe chaining with &&.

## Summary of Critical Patterns

| Pattern                          | Impact | Fix Difficulty |
| -------------------------------- | ------ | -------------- |
| pnpm action order (pnpm first)   | High   | Easy           |
| Build before test (monorepos)    | High   | Easy           |
| Use v4/v5 actions                | Medium | Easy           |
| Enable caching                   | High   | Easy           |
| Test command execution           | High   | Medium         |
| Cross-platform compatibility     | High   | Medium         |
| --if-present for chained scripts | Medium | Easy           |
| Multiple security layers         | Medium | Medium         |
| Frozen lockfiles                 | Medium | Easy           |

## References

- [pnpm/action-setup README](https://github.com/pnpm/action-setup)
- [ESLint 9 Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [Ruff Documentation](https://docs.astral.sh/ruff/)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/learn-github-actions/best-practices-for-github-actions)
