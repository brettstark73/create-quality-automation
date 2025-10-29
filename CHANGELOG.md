# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [2.1.0] - 2025-10-28

### Added

- **🚢 Lighthouse CI Integration**: SEO and performance checking with configurable thresholds
- **SEO Validation**: Automated checking for meta descriptions, document titles, canonical URLs, and structured data
- **Performance Budgets**: Configurable thresholds for Core Web Vitals and accessibility scores

### Changed

- Enhanced GitHub Actions workflow with Lighthouse CI support
- Added `@lhci/cli` dependency for SEO and performance automation
- Setup script now creates `.lighthouserc.js` configuration automatically

### Documentation

- Updated README.md with comprehensive Python and Lighthouse CI documentation
- Added complete v2.0.0 and v2.0.1 release notes to CHANGELOG.md
- Enhanced feature documentation for multi-language support

---

## [2.0.1] - 2025-10-26

### Fixed

- **🐍 Enhanced Python lint-staged Integration**: Python files now get automatic quality checks on commit
- **Restored .eslintignore**: Added back for consistency (even though deprecated in ESLint 9)
- **Standardized Python Dependencies**: Using `~=` version pinning instead of `>=` for better stability

### Added

- Python lint-staged support for `.py` files with Black, Ruff, and isort
- Enhanced test coverage for Python lint-staged functionality

### Improved

- Python files now work with both Husky + lint-staged (JS/TS projects) and pre-commit hooks (Python-only)
- Better version consistency across Python toolchain dependencies

---

## [2.0.0] - 2025-10-26

### Added

- **🐍 Complete Python Support**: Full Python project detection and automation
- **Python Toolchain**: Black, Ruff, isort, mypy, pytest integration
- **Pre-commit Hooks**: Python-specific `.pre-commit-config.yaml` for Python projects
- **Dedicated Python Workflow**: `quality-python.yml` GitHub Actions workflow
- **Multi-language Projects**: Support for full-stack JavaScript + Python projects
- **Python Helper Scripts**: Additional package.json scripts for hybrid projects

### Infrastructure

- **Updated GitHub Actions**: Latest action versions (checkout@v5, setup-node@v6)
- **Enhanced Security**: Python-specific security pattern detection
- **Repository URLs**: Fixed package.json repository URLs
- **Comprehensive Testing**: Test coverage for Python functionality

### Technical

- **Project Detection**: Automatic detection via `.py` files, `pyproject.toml`, `requirements.txt`
- **Smart Configuration**: Python tooling only added to Python projects
- **Template Files**: `pyproject.toml`, `.pre-commit-config.yaml`, `requirements-dev.txt`
- **Workflow Integration**: Python quality checks run alongside JavaScript checks

### Breaking Changes

- **Removed Deprecated Files**: `.eslintignore` removed (restored in 2.0.1)
- **Enhanced Detection**: More comprehensive project type detection

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

### Planned for v2.1.0

- commitlint integration for conventional commits
- Jest/Vitest testing templates
- React/Vue framework presets
- Workspace/monorepo support

### Planned for v2.2.0

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
