# Create Quality Automation - Quick Reference Guide

## Quality Checks Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Local Machine                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  $ git commit (on staged files)                           │
│         ↓                                                  │
│  Husky pre-commit hook → npx lint-staged                 │
│         ↓                                                  │
│  ┌─ lint-staged patterns process files:                  │
│  │  • ESLint fix on .js,.jsx,.ts,.tsx,.mjs,.cjs,.html   │
│  │  • Stylelint fix on .{css,scss,sass,less,pcss}      │
│  │  • Prettier format on all files                       │
│  │  • CLAUDE.md validation (if CLAUDE.md staged)        │
│  └─→ COMMIT BLOCKED if validation fails                  │
│                                                             │
│  On Success: Commit created with fixed files             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              GitHub Actions CI/CD (quality.yml)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Trigger: git push OR Pull Request (main/master/develop) │
│         ↓                                                  │
│  $ npm run format:check (Prettier)                        │
│         ↓                                                  │
│  $ npx eslint . --max-warnings=0 (ESLint)                │
│         ↓                                                  │
│  $ npx stylelint --allow-empty-input (Stylelint)        │
│         ↓                                                  │
│  $ npm audit --audit-level high (Security)               │
│         ↓                                                  │
│  Secret scanning (grep patterns)                         │
│         ↓                                                  │
│  XSS vulnerability patterns (grep)                       │
│         ↓                                                  │
│  Configuration security validation                        │
│         ↓                                                  │
│  Documentation validation                                │
│         ↓                                                  │
│  Lighthouse CI (if configured, optional)                 │
│         ↓                                                  │
│  ✅ All Checks Pass → Merge allowed                       │
│  ❌ Any Check Fails → Merge blocked, PR updated           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## File-by-File Mapping

| Component                | File(s)                                      | What it Does                                  | When It Runs       |
| ------------------------ | -------------------------------------------- | --------------------------------------------- | ------------------ |
| **Pre-commit Hook**      | `.husky/pre-commit`                          | Runs lint-staged                              | Every `git commit` |
| **Staged Files Handler** | `package.json` lint-staged config            | Auto-fixes & validates staged files           | Pre-commit         |
| **ESLint JS**            | `eslint.config.cjs`                          | Lints JavaScript/HTML                         | Pre-commit, CI/CD  |
| **ESLint TS**            | `eslint.config.ts.cjs`                       | Lints TypeScript (auto-loaded if TS detected) | Pre-commit, CI/CD  |
| **Stylelint**            | `.stylelintrc.json`                          | Lints CSS/SCSS/SASS/Less/PostCSS              | Pre-commit, CI/CD  |
| **Prettier**             | `.prettierrc`                                | Code formatting rules                         | Pre-commit, CI/CD  |
| **Ignore Rules**         | `.prettierignore`, `.eslintignore`           | What files to skip                            | Always             |
| **CI/CD Workflow**       | `.github/workflows/quality.yml`              | Main quality checks in GitHub                 | Push/PR            |
| **CLAUDE.md Validator**  | `.github/workflows/claude-md-validation.yml` | Keeps docs in sync                            | CLAUDE.md changes  |
| **Release Workflow**     | `.github/workflows/release.yml`              | Pre-release testing + npm publish             | Git tags v\*       |

## Key Configuration Functions

### Dynamic Stylelint Target Detection

```javascript
// Location: setup.js lines 148-197
// Scans up to 4 directory levels deep for CSS files
// Creates specific patterns for directories with CSS
// Returns ["**/*.{css,scss,...}"] if no CSS found (safe default)
```

### Conditional TypeScript Loading

```javascript
// Location: eslint.config.js, eslint.config.ts.cjs
// Attempts to load @typescript-eslint plugins
// Gracefully falls back to JS-only if not installed
// No errors if TypeScript not in project
```

### Smart Security Plugin Loading

```javascript
// Location: eslint.config.cjs, eslint.config.ts.cjs
// Tries to load eslint-plugin-security
// Continues with basic rules if not available
// Prevents breaking if security plugin missing
```

## When Checks FAIL (Blocking)

### Pre-commit (Prevents commit):

1. ESLint errors on JS/TS files
2. Stylelint errors on CSS files
3. Prettier needs to format files
4. CLAUDE.md validation fails

### GitHub Actions (Prevents merge):

1. `npm run format:check` fails
2. ESLint errors (--max-warnings=0)
3. Stylelint errors (if CSS exists)
4. npm audit finds high/critical vulnerabilities
5. Hardcoded secrets detected
6. XSS patterns found
7. Configuration security issues
8. Documentation validation fails

## When Checks PASS (Safe)

### Projects with:

- NO CSS files → Stylelint passes (--allow-empty-input)
- NO source files → ESLint finds nothing to check
- Proper formatting → Prettier is satisfied
- Clean dependencies → npm audit passes
- No secrets → Secret scanning passes
- No dangerous patterns → Pattern checks pass

## Configuration Override Points

### 1. Skip Individual Checks (in setup.js)

```bash
npx create-qa-architect@latest \
  --no-npm-audit \
  --no-gitleaks \
  --no-actionlint \
  --no-markdownlint \
  --no-eslint-security
```

### 2. Custom Templates

```bash
npx create-qa-architect@latest --template ./my-org-standards
# Overrides specific configs with your own
```

### 3. Per-Project npm Scripts

```bash
npm run lint          # ESLint + Stylelint
npm run lint:fix      # Auto-fix both
npm run format        # Prettier
npm run format:check  # Check without changing
npm run security:*    # Security validations
npm run validate:*    # Various validations
```

## Special Cases

| Scenario                               | Behavior                                 | File                  |
| -------------------------------------- | ---------------------------------------- | --------------------- |
| **Empty CSS project**                  | Passes with --allow-empty-input          | quality.yml:60        |
| **No Lighthouse config**               | Skipped gracefully, not blocking         | quality.yml:158       |
| **Missing package-lock.json**          | Warning only, continues with npm install | quality.yml:39        |
| **Input validation issues**            | Warning only, not blocking               | quality.yml:127       |
| **Signature verification unavailable** | Continues with warning                   | quality.yml:50        |
| **Python files detected**              | Adds black/ruff/isort to lint-staged     | config/defaults.js:80 |
| **TypeScript files detected**          | Adds TS extensions to patterns           | config/defaults.js:97 |

## Critical Findings

### 1. ESLint is STRICT

- `--max-warnings=0` in GitHub Actions
- Any warning = build fails
- Local lint-staged runs with --fix (auto-corrects)

### 2. Stylelint is FORGIVING (for empty projects)

- `--allow-empty-input` flag means CSS-less projects pass
- But if CSS files exist, errors are still blocking

### 3. Prettier is REQUIRED

- All file types must be properly formatted
- No warning-only mode
- Both local (pre-commit) and CI/CD (format:check)

### 4. Security is COMPREHENSIVE

- npm audit vulnerabilities (high+)
- Secret pattern detection (grep-based)
- XSS vulnerability patterns
- Configuration security scanning
- But input validation is warning-only

### 5. Documentation is CRITICAL for create-qa-architect itself

- CLAUDE.md validated on every change
- Prevents drift between code and docs
- Enforces consistency across project

## Most Common Failure Scenarios in Early-Stage Projects

1. **Linting errors in first commit** (Most Common)
   - Initial code has ESLint violations
   - Fix with: `npm run lint:fix` then commit again

2. **Prettier formatting issues** (Very Common)
   - Initial code not formatted per .prettierrc
   - Fix with: `npm run format` then commit again

3. **Hardcoded secrets accidentally committed** (Serious)
   - API keys, tokens in code
   - Must remove from history and CI/CD will still block

4. **XSS patterns in new features** (Security)
   - innerHTML with template literals, etc.
   - Refactor code to use safe methods

5. **Breaking npm audit** (Less Common)
   - Dependency has high/critical vulnerability
   - Must update package or wait for patch
