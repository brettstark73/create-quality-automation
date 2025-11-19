# Quality Checks - Detailed Failure Matrix

## Check Execution Matrix

| # | Check Name | Type | Location | Trigger | Fail Mode | Fail Condition | Exclude/Skip Options |
|---|---|---|---|---|---|---|---|
| 1 | Prettier Format | Formatter | `npm run format:check` | CI/CD (quality.yml:54) | Hard Fail | Any file needs formatting | (none - always runs) |
| 2 | ESLint JS/TS | Linter | `eslint . --max-warnings=0` | CI/CD (quality.yml:57) | Hard Fail | Any warning/error with --max-warnings=0 | `--no-eslint-security` disables security rules |
| 3 | Stylelint CSS | Linter | `stylelint "**/*.{...}" --allow-empty-input` | CI/CD (quality.yml:60) | Hard Fail* | If CSS files exist with errors | (empty projects safe with --allow-empty-input) |
| 4 | npm audit | Security | `npm audit --audit-level high` | CI/CD (quality.yml:63) | Hard Fail | High or critical vulnerability found | Can run `npm audit fix` |
| 5 | Secret Scanning | Security | grep patterns | CI/CD (quality.yml:68-84) | Hard Fail | Matches: password, secret, key, token with values | False positives possible |
| 6 | XSS Pattern Detection | Security | grep patterns | CI/CD (quality.yml:92-107) | Hard Fail | innerHTML/$\{}, eval/$\{}, document.write/$\{}, onclick patterns | May flag legitimate code |
| 7 | Input Validation Check | Security | grep piped patterns | CI/CD (quality.yml:127) | Warn Only* | Potential unvalidated user inputs | Not blocking, manual review suggested |
| 8 | Config Security | Validation | `npx create-quality-automation --security-config` | CI/CD (quality.yml:141) | Hard Fail | Configuration exposure detected | Run locally to debug |
| 9 | Documentation | Validation | `npx create-quality-automation --validate-docs` | CI/CD (quality.yml:147) | Hard Fail | Doc inconsistencies detected | Only for create-quality-automation itself |
| 10 | Lighthouse CI | Performance | Conditional on .lighthouserc config | CI/CD (quality.yml:154) | Soft Fail* | Performance threshold failures | continue-on-error: true (not blocking) |
| 11 | CLAUDE.md Validation | Docs | Scripts validation | claude-md-validation.yml | Hard Fail | Structure/TODO markers fail | For create-quality-automation only |
| 12 | CLAUDE.md Prettier | Formatting | `prettier --check CLAUDE.md` | claude-md-validation.yml | Hard Fail | CLAUDE.md not formatted | For create-quality-automation only |
| 13 | CLAUDE.md Package Name | Docs | grep package name | claude-md-validation.yml | Hard Fail | Package name not in CLAUDE.md | For create-quality-automation only |

*: See notes below

## Failure Mode Legend

- **Hard Fail**: Prevents commit (pre-commit) or merge (CI/CD)
- **Soft Fail**: Logged but doesn't block pipeline (continue-on-error: true)
- **Warn Only**: Informational, no blocking

## Notes on Conditional Checks

### Stylelint (Check #3)
- `--allow-empty-input` flag = **safe for CSS-less projects**
- If CSS files exist: errors ARE blocking
- Safe scenario: No .css, .scss, .sass, .less, .pcss files found

### Input Validation (Check #7)  
- Uses grep with piping: `grep | grep -v`
- Only logs first 5 matches
- **NOT a hard failure** - warning only
- Requires manual security review

### Lighthouse CI (Check #10)
- **Only runs if** .lighthouserc.js or .lighthouserc.json exists
- Has `continue-on-error: true` = **not blocking**
- Safe even if:
  - Config doesn't exist (skipped silently)
  - Performance thresholds fail (reported but doesn't block merge)

### CLAUDE.md Validation (Checks #11-13)
- **Only relevant for create-quality-automation package itself**
- Not part of consumer project workflows
- Consumer projects don't have CLAUDE.md

## Pre-Commit Hook Failure Matrix

All checks run during `git commit` on STAGED files only:

| Check | File Pattern | Action on Fail | Auto-Fix? | 
|-------|--------------|---|---|
| ESLint | `!(node_modules)/**/*.{js,jsx,mjs,cjs,html}` + `**/*.{js,jsx,mjs,cjs,html}` | Blocks commit | YES - runs eslint --fix |
| ESLint (TS) | `**/*.{ts,tsx}` | Blocks commit | YES - runs eslint --fix |
| Stylelint | `!(node_modules)/**/*.{css,scss,sass,less,pcss}` + `**/*.{css,scss,sass,less,pcss}` | Blocks commit | YES - runs stylelint --fix |
| Prettier | All patterns above + `!(node_modules)/**/*.{json,md,yml,yaml}` | Blocks commit | YES - runs prettier --write |
| CLAUDE.md Validation | `CLAUDE.md` | Blocks commit | NO - must fix manually |
| CLAUDE.md Prettier | `CLAUDE.md` | Blocks commit | YES - runs prettier --write |

## Failure Debugging

### To debug any check locally:

```bash
# 1. Prettier
npm run format:check

# 2. ESLint (without the strict --max-warnings=0)
npx eslint . --ext .js,.jsx,.ts,.tsx,.html

# 3. Stylelint
npx stylelint "**/*.{css,scss,sass,less,pcss}" --allow-empty-input

# 4. npm audit
npm audit

# 5. Secret scanning (exact CI command)
grep -r -E "(password|secret|key|token).*[=:].*['\"][^'\"]{8,}" . \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.github \
  --exclude-dir=tests --exclude="*.md" --exclude="package.json"

# 6. XSS patterns
grep -r -E "innerHTML.*\\\$\{" . --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules

# 7. Configuration security
npx create-quality-automation@latest --security-config

# 8. Documentation validation
npx create-quality-automation@latest --validate-docs
```

## Safe Configurations for Early-Stage Projects

### Minimal Setup (all checks pass):
1. Create package.json
2. Add JavaScript files (no linting errors)
3. No CSS files
4. No hardcoded secrets
5. No dangerous DOM manipulation patterns
6. No npm vulnerabilities

### What WILL fail early on:
1. ESLint errors in first commit (most common)
2. Prettier needs to format files
3. Any hardcoded credentials
4. Direct DOM innerHTML manipulation

## Severity Levels

| Severity | Examples | Impact |
|----------|----------|--------|
| **Critical** | Secret exposure, npm audit high/critical | Must fix before any merge |
| **High** | XSS patterns, input validation issues | Must fix for security compliance |
| **Medium** | ESLint violations, formatting issues | Blocks commit/merge but auto-fixable |
| **Low** | Documentation gaps | Blocks only for create-quality-automation |

## Performance Characteristics

| Check | Performance | Scope |
|-------|---|---|
| Prettier format:check | Fast | All files in project |
| ESLint | Medium | All JS/TS files except ignored |
| Stylelint | Fast | CSS files only (or empty input) |
| npm audit | Slow | Dependency analysis |
| Secret scanning | Medium | All files except excluded dirs |
| XSS patterns | Medium | JS/TS files via grep |
| Config security | Slow | Full project analysis |
| Docs validation | Fast | README and package.json |

## Failure Recovery Paths

| Failure | Quick Fix | Prevention |
|---------|---|---|
| Prettier | `npm run format && git add . && git commit --amend` | Run `npm run format` before committing |
| ESLint | `npm run lint:fix && git add . && git commit --amend` | Run `npm run lint:fix` before committing |
| Stylelint | `npm run lint:fix && git add . && git commit --amend` | Use `npm run lint:fix` before committing |
| Secret | Remove from code, rewrite history | Use .env files, never commit secrets |
| XSS Pattern | Refactor to safe DOM methods | Use textContent, not innerHTML with variables |
| npm audit | `npm update` or `npm audit fix` | Keep deps current, review lock files |
| Config Security | Debug with local validation | Use `npx create-quality-automation --security-config` |

