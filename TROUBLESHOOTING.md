# Troubleshooting Guide

Common issues and solutions when using create-quality-automation.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Setup Errors](#setup-errors)
- [Validation Failures](#validation-failures)
- [Tool-Specific Issues](#tool-specific-issues)
- [Platform-Specific Issues](#platform-specific-issues)
- [Getting Help](#getting-help)

## Installation Issues

### Error: Node.js version not supported

**Symptom:**

```
❌ Node.js v18.x.x is not supported. This tool requires Node.js 20 or higher.
```

**Solution:**

1. Upgrade Node.js to version 20 or higher
2. Visit https://nodejs.org/ to download the latest LTS version
3. Or use a version manager like nvm:
   ```bash
   nvm install 20
   nvm use 20
   ```

### Error: Failed to load package.json utilities

**Symptom:**

```
❌ Failed to load package.json utilities: ...
This tool requires Node.js 20+ with modern module support.
```

**Solution:**

- Ensure you're using Node.js 20 or higher
- Try clearing npm cache: `npm cache clean --force`
- Reinstall the package: `npx clear-npx-cache && npx create-quality-automation@latest`

## Setup Errors

### Error: No package.json found

**Symptom:**

```
❌ No package.json found. Dependency monitoring requires an npm project.
```

**Solution:**

1. Initialize an npm project first:
   ```bash
   npm init -y
   ```
2. Then run the quality automation setup:
   ```bash
   npx create-quality-automation@latest
   ```

### Error: Malformed package.json

**Symptom:**

- Setup crashes with JSON parsing errors
- "Unexpected token" errors

**Solution:**

1. Validate your package.json syntax:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"
   ```
2. Use a JSON validator or linter
3. Check for:
   - Trailing commas
   - Missing quotes around keys
   - Unescaped special characters

### Error: Permission denied

**Symptom:**

```
EACCES: permission denied, open '.prettierrc'
EPERM: operation not permitted
```

**Solution:**

1. Check file/directory permissions:
   ```bash
   ls -la
   ```
2. Ensure you have write access to the project directory
3. On Unix/macOS, try:
   ```bash
   chmod -R u+w .
   ```
4. On Windows, run terminal as Administrator (only if necessary)
5. If in a shared directory, ensure you're the owner

### Error: Git not initialized

**Symptom:**

- Husky setup fails
- Pre-commit hooks not working

**Solution:**

1. Initialize git first:
   ```bash
   git init
   ```
2. Then run setup:
   ```bash
   npx create-quality-automation@latest
   ```
3. Or skip Husky if not using git:
   - Edit package.json to remove `"prepare": "husky"` script

## Validation Failures

### Error: Configuration security validation failed

**Symptom:**

```
❌ Configuration security validation failed
```

**Solution:**

1. Check which specific config is insecure:
   ```bash
   npx create-quality-automation@latest --security-config
   ```
2. Common issues:
   - `dangerouslySetInnerHTML` in Next.js/Vite config
   - Disabled security features
   - Unsafe `eval()` usage
3. Review the flagged configuration file and remove unsafe patterns
4. Or skip security checks (not recommended):
   ```bash
   npx create-quality-automation@latest --no-eslint-security
   ```

### Error: Documentation validation failed

**Symptom:**

```
❌ Documentation validation failed
README.md references non-existent file: some-file.txt
```

**Solution:**

1. Review your README.md for references to files that don't exist
2. Either:
   - Create the missing files
   - Remove references from README
   - Use placeholder markers like `[file-to-be-created]`
3. Skip documentation validation if needed:
   ```bash
   npx create-quality-automation@latest --comprehensive --no-markdownlint
   ```

### Error: ESLint not installed

**Symptom:**

```
ESLint is not installed or not found in PATH
```

**Solution:**

1. The tool should install ESLint automatically, but if it doesn't:
   ```bash
   npm install --save-dev eslint
   ```
2. Or skip ESLint security checks:
   ```bash
   npx create-quality-automation@latest --security-config --no-eslint-security
   ```
3. After setup completes, run:
   ```bash
   npm install
   ```

## Tool-Specific Issues

### Prettier conflicts with existing configuration

**Symptom:**

- Files formatted differently than expected
- Conflicts between .prettierrc and other configs

**Solution:**

1. Review your existing `.prettierrc` or `prettier.config.js`
2. The tool won't overwrite existing Prettier configs
3. To use the tool's config, remove your existing one first
4. Or manually merge configurations

### Stylelint not detecting CSS files

**Symptom:**

- No CSS files being linted
- Stylelint shows no output

**Solution:**

1. Check that CSS files exist in the project
2. Verify file extensions match: `.css`, `.scss`, `.sass`, `.less`, `.pcss`
3. Check `.stylelintrc.json` configuration
4. Run manually to test:
   ```bash
   npx stylelint "**/*.css"
   ```

### Husky hooks not running

**Symptom:**

- Pre-commit hook doesn't run on `git commit`
- lint-staged not executing

**Solution:**

1. Ensure Husky is installed:
   ```bash
   npm run prepare
   ```
2. Check if `.husky/pre-commit` exists and is executable:
   ```bash
   ls -la .husky/
   chmod +x .husky/pre-commit
   ```
3. Verify git hooks path:
   ```bash
   git config core.hooksPath
   ```
   Should output: `.husky`

### lint-staged runs on all files instead of staged

**Symptom:**

- lint-staged processes entire codebase
- Pre-commit takes too long

**Solution:**

1. Check `lint-staged` configuration in package.json
2. Ensure patterns use glob syntax correctly
3. Test lint-staged manually:
   ```bash
   npx lint-staged
   ```

## Platform-Specific Issues

### Windows: Command not recognized

**Symptom:**

```
'grep' is not recognized as an internal or external command
```

**Solution:**

- This is fixed in recent versions (v2.1+)
- Update to latest version:
  ```bash
  npx create-quality-automation@latest
  ```
- The tool now uses Node.js APIs instead of shell commands

### Windows: Line ending issues

**Symptom:**

- Git shows all files as modified
- CRLF vs LF warnings

**Solution:**

1. Configure git line endings:
   ```bash
   git config core.autocrlf true
   ```
2. The `.editorconfig` file sets `end_of_line = lf`
3. Let Prettier normalize line endings:
   ```bash
   npm run format
   ```

### macOS/Linux: Permission denied on pre-commit

**Symptom:**

```
.husky/pre-commit: Permission denied
```

**Solution:**

1. Make hook executable:
   ```bash
   chmod +x .husky/pre-commit
   ```
2. Or reinstall Husky:
   ```bash
   npm run prepare
   ```

## Performance Issues

### Setup is very slow

**Symptom:**

- `npm install` takes a long time
- Tool hangs during setup

**Solution:**

1. Use `--dry-run` to preview changes first:
   ```bash
   npx create-quality-automation@latest --dry-run
   ```
2. Check network connection (npm registry access)
3. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
4. Try using a different npm registry:
   ```bash
   npm config set registry https://registry.npmmirror.com
   ```

### Validation takes too long

**Symptom:**

- `--comprehensive` validation hangs or is slow

**Solution:**

1. Run individual validation checks:
   ```bash
   npx create-quality-automation@latest --security-config
   npx create-quality-automation@latest --validate-docs
   ```
2. Disable slow tools:
   ```bash
   npx create-quality-automation@latest --comprehensive --no-gitleaks --no-actionlint
   ```
3. Check for large files in project that tools are scanning

## Getting Help

### Still having issues?

1. **Check the version:**

   ```bash
   npx create-quality-automation@latest --help
   ```

   Ensure you're using the latest version.

2. **Review the documentation:**
   - [README.md](./README.md) - Full usage guide
   - [CHANGELOG.md](./CHANGELOG.md) - Recent changes and fixes

3. **Enable verbose output:**

   Run with Node.js debug flags:

   ```bash
   NODE_DEBUG=* npx create-quality-automation@latest
   ```

4. **Report an issue:**

   If you've found a bug, please report it:
   - GitHub Issues: https://github.com/brettstark73/quality-automation-template/issues
   - Include:
     - Node.js version (`node --version`)
     - npm version (`npm --version`)
     - Operating system
     - Full error message
     - Steps to reproduce

5. **Common debugging steps:**

   ```bash
   # 1. Check your environment
   node --version  # Should be 20+
   npm --version
   git --version

   # 2. Try in a clean test directory
   mkdir test-qa && cd test-qa
   npm init -y
   npx create-quality-automation@latest

   # 3. Use dry-run to preview
   npx create-quality-automation@latest --dry-run

   # 4. Check for conflicting tools
   npm ls eslint prettier stylelint
   ```

## Frequently Asked Questions

### Can I use this in an existing project?

Yes! The tool is merge-safe and won't overwrite existing configurations. Use `--update` mode:

```bash
npx create-quality-automation@latest --update
```

### Can I customize the configurations?

Yes! After setup, all config files are in your project. Edit them as needed:

- `.prettierrc` - Prettier formatting rules
- `eslint.config.cjs` - ESLint linting rules
- `.stylelintrc.json` - Stylelint CSS rules
- `lint-staged` in package.json - Pre-commit file patterns

### How do I disable specific checks?

Use the granular control flags:

```bash
--no-npm-audit       # Skip npm vulnerability checks
--no-gitleaks        # Skip secret scanning
--no-actionlint      # Skip GitHub Actions validation
--no-markdownlint    # Skip markdown formatting
--no-eslint-security # Skip ESLint security rules
```

### Can I run this in CI/CD?

Yes! Use the validation modes:

```bash
# In your CI workflow
npx create-quality-automation@latest --comprehensive
```

Or run individual tools:

```bash
npm run lint
npm run format:check
npm test
```
