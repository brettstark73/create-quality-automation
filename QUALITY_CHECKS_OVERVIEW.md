# Create Quality Automation - Quality Checks Comprehensive Overview

## 1. GitHub Actions Workflows (.github/workflows/)

### A. Quality Checks Workflow (quality.yml)

**Triggers**: Push/PR to main, master, develop branches

**Sequential Steps with Failure Conditions**:

1. **Checkout & Setup**
   - Checkout code
   - Setup Node.js 20
   - Install dependencies (npm ci or npm install)
2. **Dependency Integrity Checks**
   - Verify package-lock.json integrity hashes (if exists)
   - Check for known vulnerabilities: `npm audit --audit-level=moderate` (warning only)
   - Verify npm package signatures (optional, best-effort)

3. **Code Quality Checks**
   - **Prettier Check**: `npm run format:check`
     - FAILS if any files need formatting
     - Checks all file types configured
     - No conditional skip logic
   - **ESLint**: `npx eslint . --max-warnings=0`
     - FAILS on ANY warning or error
     - Includes security plugin rules
     - Strict enforcement with --max-warnings=0
   - **Stylelint**: `npx stylelint "**/*.{css,scss,sass,less,pcss}" --allow-empty-input`
     - ALLOWS empty input (safe for projects without CSS)
     - FAILS on CSS linting issues if files exist

4. **Security Checks**
   - **npm audit**: `npm audit --audit-level high` - FAILS on high/critical vulnerabilities
   - **Hardcoded Secrets Detection**: `grep` patterns for password, secret, key, token
     - Excludes: node_modules, .git, .github, tests, \*.md, package.json
     - FAILS if matches found
   - **XSS Vulnerability Patterns**: Checks for innerHTML, eval, document.write, onclick with template literals
     - Uses grep with multi-line patterns
     - FAILS if dangerous patterns detected
   - **Input Validation Check**: Looks for unvalidated user inputs (req.query/params/body)
     - Uses grep with piping
     - WARNING ONLY (does not fail)

5. **Configuration Security Check**
   - `npx create-qa-architect@latest --security-config`
   - Runs comprehensive configuration validation
   - Fails if security issues detected

6. **Documentation Validation**
   - `npx create-qa-architect@latest --validate-docs`
   - Checks documentation consistency
   - Fails on doc issues

7. **Lighthouse CI** (Optional)
   - Only runs if .lighthouserc.js/.json exists
   - Fails gracefully with `continue-on-error: true`
   - Not blocking

### B. CLAUDE.md Validation Workflow (claude-md-validation.yml)

**Triggers**: Changes to CLAUDE.md, package.json, validation script, or workflow itself

**Steps**:

1. Validate CLAUDE.md structure with validation script
2. Check CLAUDE.md formatting with Prettier
3. Cross-check package name is referenced in CLAUDE.md
4. Check for TODO/FIXME/XXX markers (FAILS if found)

### C. Release Workflow (release.yml)

**Triggers**: Git tags matching v\*

**Steps**:

1. Checkout and setup
2. Run pre-release checks: `npm run prerelease`
   - Runs: `npm run docs:check && npm test && npm run test:e2e`
   - Must pass all tests before publishing
3. Publish to npm registry
4. Create GitHub Release

---

## 2. Pre-commit Hooks (Husky + lint-staged)

**File**: .husky/pre-commit
**Command**: `npx --no -- lint-staged`

**Trigger**: On `git commit`

### lint-staged Configuration (in package.json)

```json
"lint-staged": {
  "CLAUDE.md": [
    "node scripts/validate-claude-md.js",
    "prettier --write"
  ],
  "package.json": ["prettier --write"],
  "!(node_modules)/**/*.{css,scss,sass,less,pcss}": [
    "stylelint --fix",
    "prettier --write"
  ],
  "!(node_modules)/**/*.{json,md,yml,yaml}": ["prettier --write"],
  "!(node_modules)/**/*.{js,jsx,mjs,cjs,html}": [
    "eslint --fix",
    "prettier --write"
  ],
  "**/*.{js,jsx,mjs,cjs,html}": [
    "eslint --fix",
    "prettier --write"
  ],
  "**/*.{json,md,yml,yaml}": ["prettier --write"],
  "**/*.{css,scss,sass,less,pcss}": [
    "stylelint --fix",
    "prettier --write"
  ]
}
```

**Key Behaviors**:

- Only processes STAGED files (fast)
- Automatically fixes ESLint and Stylelint issues (--fix)
- Auto-formats with Prettier
- CLAUDE.md is specially handled with validation script
- FAILS if validation or formatting encounters errors
- Pattern `!(node_modules)/**/*` explicitly excludes node_modules

---

## 3. Setup Configuration (setup.js)

### What Gets Configured in New Projects

1. **Scripts Added** (via config/defaults.js):

   ```javascript
   {
     "lint": "eslint . && stylelint \"{stylelintTarget}\" --allow-empty-input",
     "lint:fix": "eslint . --fix && stylelint \"{stylelintTarget}\" --fix --allow-empty-input",
     "format": "prettier --write .",
     "format:check": "prettier --check .",
     "security:audit": "npm audit --audit-level high",
     "security:config": "npx create-qa-architect@latest --security-config",
     "validate:docs": "npx create-qa-architect@latest --validate-docs",
     "validate:comprehensive": "npx create-qa-architect@latest --comprehensive",
     "validate:all": "npm run validate:comprehensive && npm run security:audit"
   }
   ```

2. **Dev Dependencies Added**:
   - Base: husky, lint-staged, prettier, eslint, globals, stylelint, stylelint-config-standard
   - If TypeScript detected: @typescript-eslint/eslint-plugin, @typescript-eslint/parser
   - Security: eslint-plugin-security (always)

3. **Stylelint Target Detection**:
   - Scans directory structure up to 4 levels deep
   - Looks for: css, scss, sass, less, pcss files
   - Excludes: .git, .github, .husky, .next, .nuxt, build, node_modules, etc.
   - If no CSS files found: uses default `**/*.{css,scss,sass,less,pcss}`
   - If CSS found only in root: uses `*.{css,scss,sass,less,pcss}`
   - If CSS found in subdirs: creates glob patterns for each dir

4. **Lint-staged Configuration**:
   - Automatically generated based on file types detected
   - JS/TS/CSS patterns created
   - Python patterns added if Python files detected

---

## 4. ESLint Configuration

### Main Config (eslint.config.cjs)

- Includes: @eslint/js recommended rules
- Includes: eslint-plugin-security rules (when available)
- XSS prevention rules (no-eval, no-implied-eval, no-script-url)
- Ignores: node_modules, dist, build

### TypeScript Config (eslint.config.ts.cjs)

- Falls back to JS-only if TypeScript tools not installed
- Includes @typescript-eslint/eslint-plugin rules (when available)
- Same XSS prevention rules

### Key Points:

- Automatically detects TypeScript and loads appropriate config
- Security plugin is optional but recommended
- Graceful fallback if plugins missing
- ESLint 9 flat config format

---

## 5. Other Linting Configs

### Stylelint (.stylelintrc.json)

```json
{
  "extends": ["stylelint-config-standard"],
  "ignoreFiles": ["**/node_modules/**"],
  "rules": {}
}
```

### Prettier (.prettierrc)

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### Prettier Ignore (.prettierignore)

- node_modules, dist, build, coverage
- .next, .vercel, .env files
- \*.log files
- package-lock.json, yarn.lock

### ESLint Ignore (.eslintignore)

- node_modules/, dist/, build/, out/
- .next/, coverage/
- cache directories
- IDE and OS files

---

## 6. Where Early-Stage Projects Might Fail

### A. Empty Projects (No Source Files)

**Safe Scenarios**:

- Stylelint: `--allow-empty-input` flag allows this to pass
- ESLint: Will pass (no files to check)
- Prettier: Will pass on available files

**Risk Scenarios**:

- If project has ONLY markdown/config files, all will get prettier-checked
- If package.json exists but is malformed, will fail

### B. Projects with No TypeScript

- ESLint config gracefully falls back to JS-only
- No TypeScript extension issues

### C. Projects with No CSS/SCSS

- Stylelint will find NO CSS files and use default pattern
- With `--allow-empty-input`, this safely passes

### D. Projects with Linting Errors in Initial Commit

**WILL FAIL**:

- Any ESLint errors (--max-warnings=0 is strict)
- Any Prettier formatting issues
- Any Stylelint CSS issues (if CSS exists)

### E. Projects with Hardcoded Secrets

**WILL FAIL** during GitHub Actions quality check

### F. Projects Missing package-lock.json

**Handled gracefully**:

- Quality workflow detects missing package-lock.json
- Falls back to npm install
- Dependency integrity check shows warning but doesn't fail

### G. Projects Without npm Audit Vulnerabilities

- Passes without issue

---

## 7. Conditional Check Logic

### Explicit Allow-Empty Scenarios:

1. **Stylelint**: `--allow-empty-input` - allows projects with no CSS files
2. **Lighthouse CI**: Only runs if config file exists (continue-on-error: true)
3. **Signature verification**: Best-effort, warning if not available

### Skip/Disable Flags in setup.js:

- `--no-npm-audit`: Disable npm audit checks
- `--no-gitleaks`: Disable gitleaks scanning
- `--no-actionlint`: Disable GitHub Actions validation
- `--no-markdownlint`: Disable markdown linting
- `--no-eslint-security`: Disable security plugin rules

### Warning-Only Checks:

- Input validation check (npm audit pattern matching)
- Signature verification (if not available)

---

## 8. Validation System (lib/validation/)

### Validators:

1. **ConfigSecurityScanner**: Checks for exposed secrets in configs
2. **DocumentationValidator**: Checks README consistency, file inventory
3. **WorkflowValidator**: Validates GitHub Actions workflows syntax

### When Called:

- `npm run security:config` → ConfigSecurityScanner
- `npm run validate:docs` → DocumentationValidator
- `npm run validate:comprehensive` → All three validators
- GitHub Actions quality workflow runs these

---

## 9. Critical Failure Points Summary

### During Development (Pre-commit):

1. **lint-staged validation** (BLOCKING):
   - ESLint errors on staged JS/TS files
   - Stylelint errors on staged CSS files
   - Prettier formatting issues on staged files
   - CLAUDE.md validation failure (if committing CLAUDE.md)

### During CI/CD (GitHub Actions):

1. **Prettier check** (BLOCKING) - `npm run format:check`
2. **ESLint** (BLOCKING) - with --max-warnings=0
3. **Stylelint** (BLOCKING if CSS files exist)
4. **npm audit** (BLOCKING) - high/critical vulnerabilities
5. **Hardcoded secrets** (BLOCKING)
6. **XSS patterns** (BLOCKING)
7. **Security config** (BLOCKING)
8. **Documentation validation** (BLOCKING)

### Safe Scenarios:

1. Projects with no CSS → Stylelint passes (--allow-empty-input)
2. Projects with no linting errors → ESLint passes
3. Projects properly formatted → Prettier passes
4. Projects with no dependencies → npm audit passes

---

## 10. Special Considerations

### Python Projects:

- lint-staged adds Python patterns if Python files detected
- lint-staged uses: black, ruff, isort for Python files
- Separate validation for pyproject.toml

### Monorepos:

- Stylelint scans up to 4 directory levels deep
- Creates specific patterns for each subdirectory with CSS

### TypeScript:

- Auto-detected via tsconfig.json presence
- Extensions changed from .js,.jsx to .js,.jsx,.ts,.tsx

### Template Support:

- Can override default configs with --template flag
- Partial templates supported (missing files fall back to defaults)

### CLAUDE.md Automation:

- Validated on every commit affecting CLAUDE.md
- Validated on every push to main/master/develop
- Prevents documentation drift
