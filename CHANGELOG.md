# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.1.0] - 2025-09-27

### Added

- **🔒 Enhanced Security Automation**: Comprehensive security scanning in GitHub Actions workflow
- **Blocking Security Audit**: npm audit now fails CI on high-severity vulnerabilities (removed `|| true`)
- **Hardcoded Secrets Detection**: Automated scanning for exposed passwords, API keys, and private keys
- **Improved CI Security**: Pattern matching for common secret formats and cryptographic keys

### Changed

- Updated GitHub Actions workflow template to enforce security standards
- Security checks now block deployments when vulnerabilities or secrets are detected

### Security

- Eliminated security bypass in npm audit (previously non-blocking)
- Added comprehensive secret pattern detection including:
  - Password/token/key assignments with long values
  - PEM-formatted private keys
  - Configurable exclusions for node_modules and .git directories

---

## [1.0.1] - 2025-09-27

### Changed

- Enhanced GitHub repository discoverability with comprehensive topic tags
- Updated repository metadata and documentation alignment

### Improved

- Repository now includes 14 relevant topics for better npm package discovery
- Homepage URL properly configured for GitHub repository

### Documentation

- Maintained comprehensive README with current feature set
- CHANGELOG format consistency improvements

---

## [1.0.0] - 2024-09-25

### Added

- 🎉 Initial release as npm package `create-quality-automation`
- ESLint 9 flat config support (`eslint.config.cjs`)
- Automatic TypeScript detection and configuration
- Husky v9 pre-commit hooks with lint-staged
- Prettier code formatting with sensible defaults
- Stylelint CSS/SCSS linting
- GitHub Actions quality workflow
- EditorConfig for IDE consistency
- Node 20 toolchain pinning (`.nvmrc`, `engines`, Volta)
- Comprehensive integration tests for JS and TypeScript projects
- Conservative setup that preserves existing configurations
- Idempotent operation - safe to run multiple times

### Features

- **Smart TypeScript Support**: Automatically detects TypeScript projects and configures `@typescript-eslint`
- **Modern Tooling**: ESLint 9 flat config, Husky 9, latest Prettier/Stylelint
- **Graceful Merging**: Preserves existing scripts, dependencies, and lint-staged configs
- **CLI Interface**: Run with `npx create-quality-automation@latest`
- **Update Support**: Re-run with `--update` flag for configuration updates

### Technical

- Migrated from legacy `.eslintrc.json` to modern `eslint.config.cjs`
- Replaced deprecated `husky install` with `husky` command
- Added comprehensive test coverage including idempotency checks
- Template files packaged and distributed via npm

---

## Future Releases

### Planned for v1.1.0

- commitlint integration for conventional commits
- Jest/Vitest testing templates
- React/Vue framework presets
- Workspace/monorepo support

### Planned for v1.2.0

- Custom rule presets (strict, relaxed, enterprise)
- Plugin ecosystem for extended functionality
- Integration with popular CI providers (CircleCI, GitLab)

---

## Migration Notes

### From Pre-1.0 Template

If you were using the template repository directly:

1. **New Installation Method**:

   ```bash
   # Old way
   node /path/to/template/setup.js

   # New way
   npx create-quality-automation@latest
   ```

2. **Configuration Changes**:
   - `.eslintrc.json` → `eslint.config.cjs` (automatically handled)
   - `husky install` → `husky` (automatically updated)
   - Added TypeScript-aware ESLint configs when TS detected

3. **Update Existing Projects**:
   ```bash
   npx create-quality-automation@latest --update
   ```
