# Create Quality Automation - Claude Code Configuration

This project uses Brett Stark's global Claude Code configuration with specific adaptations for quality automation tooling.

## Project Information

- **Package:** `create-quality-automation`
- **CLI Command:** `npx create-quality-automation@latest`
- **Purpose:** Bootstrap quality automation in any project via CLI

## Project-Specific Commands

### Linting & Quality Checks

- **Lint:** `npm run lint` - Run ESLint 9 flat config and Stylelint
- **Lint Fix:** `npm run lint:fix` - Auto-fix linting issues
- **Format:** `npm run format` - Format all files with Prettier
- **Format Check:** `npm run format:check` - Check formatting without changes
- **Test:** `npm run test` - Run setup integration tests

### Development Workflow

- **Setup:** `npm run setup` - Initialize quality automation in target project
- **Prepare:** `npm run prepare` - Initialize Husky hooks
- **Validate CLAUDE.md:** `npm run validate:claude` - Validate CLAUDE.md consistency
- **Validate All:** `npm run validate:all` - Comprehensive validation including CLAUDE.md

## Quality Automation Features

- **ESLint 9 Flat Config** with automatic TypeScript support detection
- **Stylelint** for CSS/SCSS/Sass/Less/PostCSS linting
- **Prettier** for code formatting
- **Husky 9** pre-commit hooks
- **lint-staged** for staged file processing
- **GitHub Actions** workflows with quality checks

## Development Notes

- Always run `npm run lint` and `npm run format:check` before committing
- This is an npm package with CLI functionality - test with `npm run test`
- Setup script is conservative and merge-safe for existing projects
- Supports Node.js ≥20 with Volta configuration
- Package is published to npm as an unscoped CLI (`create-quality-automation`)

## CLAUDE.md Maintenance Automation

This project includes automated CLAUDE.md validation to ensure this file stays current and accurate:

- **Pre-commit Hook**: Validates CLAUDE.md on every commit via lint-staged
- **GitHub Actions**: CI/CD validation on push and PRs (`.github/workflows/claude-md-validation.yml`)
- **Manual Validation**: `npm run validate:claude` for on-demand checks
- **Validation Rules**: Checks required sections, package references, script documentation, and outdated patterns

**Validation Script**: `scripts/validate-claude-md.js`
**Documentation**: `.github/CLAUDE_MD_AUTOMATION.md`

This automation prevents documentation drift and ensures CLAUDE.md accuracy across the project lifecycle.

## Release Process

**CRITICAL**: Before any version bump or npm publish, ALWAYS run:

```bash
npm run prerelease  # Runs docs:check + tests
```

This catches documentation gaps that manual review misses. Also reference:

- `.github/RELEASE_CHECKLIST.md` - Comprehensive pre-release checklist
- `scripts/check-docs.sh` - Automated documentation consistency verification

**Why this matters**: Documentation gaps weren't caught in v2.1.0 release because we relied on manual memory instead of systematic verification.

## Bash Command Permissions

This project has approval for the following Bash commands (no permission prompts):

- `npm publish` - Publishing releases to npm registry
- `npm version` - Bumping package versions
- `npm run prerelease` - Pre-release validation

## 🚨 CRITICAL: Code Change Verification Protocol

### **When Making ANY Code Change:**

1. **Systematic Search**: Use multiple search methods to find ALL instances

   ```bash
   # Example: Removing 'grep' usage
   grep -r "grep" . --exclude-dir=node_modules --exclude-dir=.git
   rg "grep" --type js --type ts
   find . -name "*.js" -o -name "*.ts" | xargs grep "grep"
   ```

2. **Verify Complete Removal**: After edits, re-search to confirm ZERO instances

   ```bash
   # Must return NO results
   grep -r "target_pattern" . --exclude-dir=node_modules --exclude-dir=.git
   ```

3. **Test the Specific Issue**: Create minimal reproduction of the reported problem

   ```bash
   # Example: Test Windows grep issue
   node setup.js --security-config 2>&1 | grep "not recognized"
   ```

4. **Integration Test**: Run full test suite to ensure no regressions

   ```bash
   npm test
   ```

5. **Edge Case Testing**: Test the specific environment mentioned (Windows, Node versions, etc.)

### **Before Declaring "Fixed":**

- [ ] **Search Verification**: Multiple search methods confirm target is eliminated
- [ ] **Functional Test**: The reported error condition no longer occurs
- [ ] **Integration Test**: Full test suite passes
- [ ] **Documentation**: Update/add tests to prevent regression

### **Example Verification Checklist for Windows Compatibility:**

```bash
# 1. Verify no grep usage anywhere
grep -r "| grep" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "\| grep" . --exclude-dir=node_modules --exclude-dir=.git
rg "\| grep" --type js

# 2. Test the exact command that was failing
node setup.js --security-config

# 3. Simulate Windows environment (if possible)
# Or ensure cross-platform compatibility via Node.js only

# 4. Check that ESLint security actually runs and detects issues
# (not just silently skipped)
```

## Never Accept "It Should Work" - Always Verify

**Bad**: "I removed the grep, so it should work on Windows now"
**Good**: "I verified zero grep usage remains, tested the command, and confirmed ESLint security detection still functions"

---

_Inherits all global preferences from Brett Stark's universal Claude Code configuration_
