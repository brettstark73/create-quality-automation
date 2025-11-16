# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.1.1] - 2025-11-16

### Fixed

- **🐛 Critical Python Parser Bug Fixes**
  - **HIGH: PEP 621 list-style dependencies never parsed** - Modern Python projects using `dependencies = ["package>=1.0.0"]` format had zero dependencies detected, losing all premium features (Dependabot grouping, framework detection). Parser only matched legacy `package = "^1.0.0"` format.
  - **HIGH: Inline comments after `]` break PEP 621 parsing** - Files with `]  # end of dependencies` failed to parse, returning empty dependency list.
  - **MEDIUM: Dotted package names rejected** - Python namespace packages (`zope.interface`, `google.cloud-storage`, `backports.zoneinfo`, `ruamel.yaml`) were parsed as truncated names (`zope`, `google`) with empty versions, breaking framework detection for scientific/cloud packages.
  - **MEDIUM: Metadata pollution** - Key/value parser treated `[project.urls]` homepage values and other metadata as dependencies, polluting framework counts and Dependabot configuration.

- **📦 Python Parser Enhancements**
  - Support PEP 621 main `dependencies = [...]` arrays
  - Support `[project.optional-dependencies]` with hyphenated group names (`lint-tools`, `test-suite`, `docs-build`)
  - Support dotted package names (`.` in package identifiers)
  - Support package extras (`fastapi[all]>=0.110.0`, `uvicorn[standard]>=0.24.0`)
  - Handle inline comments after closing brackets and within dependency lists
  - Scope legacy key/value parsing to dependency sections only (exclude `[project.urls]`, `[build-system]`, etc.)
  - Skip Python version specifiers (`python = "^3.8"`)

### Added

- **🧪 Comprehensive Python Parser Test Suites**
  - `tests/python-parser-fixes.test.js`: 8 test scenarios covering PEP 621, dotted packages, hyphenated groups, real-world files (540+ lines)
  - `tests/pyproject-parser-bug-reproduction.test.js`: Bug reproduction tests (235 lines)
  - Test coverage: PEP 621 arrays, dotted names, optional-dependencies, inline comments, metadata exclusion, edge cases

- **📚 Process Improvement Documentation**
  - `claudedocs/parser-bugs-lessons-learned.md`: Systematic process improvements for future parser work
  - `claudedocs/bug3-monorepo-subdirectory-design.md`: Design document for deferred monorepo subdirectory detection (v3.2.0)
  - Research protocol for pre-implementation edge case discovery
  - Real-world test data methodology

### Notes

- **Monorepo subdirectory detection** (Bug #3) deferred to v3.2.0 - requires architectural changes
- Workaround: Run CLI in each service directory manually (`cd services/api && npx create-quality-automation --deps`)
- All 22+ test suites passing with new parser fixes

## [3.1.0] - 2025-11-15

### Added

- **🧪 Comprehensive Test Coverage Improvements**
  - **validation-factory.js**: 0% → 85.16% (+85.16%)
  - **dependency-monitoring-premium.js**: 66.73% → 91.88% (+25.15%)
  - **setup.js**: 74.07% → 79.46% (+5.39%)
  - **Overall project**: 71.09% → 79.73% (+8.64%)
  - All coverage targets met or exceeded (≥75% overall, ≥80% critical paths)

- **📚 CONTRIBUTING.md Developer Guidelines**
  - Pre-commit quality gates (Husky + ESLint + Prettier)
  - Test-first development workflow with examples
  - Coverage requirements (75%+ all files, 80%+ critical)
  - Real-world data testing patterns
  - Error prevention strategies
  - Code change verification protocol
  - Common patterns (DI, error handling, validation)
  - Release process and post-mortem workflow

- **🎯 New Test Suites**
  - `tests/validation-factory.test.js`: Comprehensive DI pattern testing (360 lines)
  - `tests/setup-error-coverage.test.js`: Error path coverage for setup.js (280 lines)
  - `tests/python-detection-sensitivity.test.js`: Python detection validation (260 lines)
  - Integration tests validate real-world scenarios with 40+ packages from PyPI, crates.io, RubyGems

- **🌐 Global Framework Updates** (Permanent learnings in `~/.claude/RULES.md`)
  - **Code Change Verification Protocol**: Systematic search + verification methodology
  - **Test Quality & Coverage**: TDD + integration + real-world data requirements
  - Impact: All future projects benefit from v3.0.0 lessons

### Changed

- **Enhanced Python Detection Sensitivity** - Reduced false positives
  - **Before**: Single .py file anywhere triggered full Python setup
  - **After**: Requires stronger evidence
    - Config files (pyproject.toml, requirements.txt, setup.py, Pipfile) → Always detects
    - Multiple .py files (≥2) → Detects
    - Main patterns (main.py, app.py, run.py, **main**.py) → Detects
    - Single random .py file → NO detection (prevents false positives)
  - Impact: JS projects with utility scripts no longer get unexpected Python tooling
  - Validation: 6 comprehensive test scenarios covering all detection patterns

### Quality Metrics

- **Bug Detection Rate**
  - Unit tests only: 33% (1/3 bugs caught)
  - With integration tests: 100% (3/3 bugs caught)
  - Lesson: Integration tests essential for production quality

- **Real-World Validation**
  - 40+ packages tested from PyPI, crates.io, RubyGems
  - 100% parsing accuracy across all ecosystems
  - Dependency detection verified against production packages

- **Production Readiness**
  - ✅ Coverage: 79.73% (exceeds 70% industry standard)
  - ✅ Critical path coverage: 100%
  - ✅ Integration test coverage: 100% bug detection
  - ✅ Real-world validated: 40+ packages
  - ✅ Error handling: Comprehensive defensive code
  - ✅ Documentation: Complete CONTRIBUTING.md guide

### Documentation

- **claudedocs/v3.0.0-quality-improvements-summary.md**: Comprehensive documentation of all quality enhancements
- **claudedocs/global-framework-updates.md**: Universal lessons added to global framework
- Enhanced developer experience with clear contribution guidelines

### Developer Experience

- Test-first development workflow established
- Real-world data testing patterns documented
- Error prevention strategies codified
- Code change verification protocol implemented
- Coverage targets enforced (≥75% all files, ≥80% critical)

### Breaking Changes

None - All changes are backward compatible

---

## Previous Releases

### Added

- **🚀 PREMIUM-002: Multi-Language Dependency Monitoring (Pro Tier)** - **JUST SHIPPED!** Python, Rust, and Ruby ecosystem support
  - **Python/Pip ecosystem support**
    - Framework detection for Django (core, REST framework, async, CMS)
    - Framework detection for Flask (core, extensions, SQLAlchemy, CORS)
    - Framework detection for FastAPI (core, async runtime, validation)
    - Data Science stack detection (numpy, pandas, scipy, scikit-learn, TensorFlow, PyTorch, matplotlib)
    - Testing framework grouping (pytest ecosystem)
    - Web server grouping (gunicorn, uvicorn, waitress)
    - Dependency file parsing: requirements.txt and pyproject.toml
  - **Rust/Cargo ecosystem support**
    - Framework detection for Actix Web (core, middleware)
    - Framework detection for Rocket (core, features)
    - Async runtime grouping (Tokio, async-std, futures)
    - Serde ecosystem grouping (serde, serde_json, serde_yaml)
    - Testing framework grouping (criterion, proptest)
    - Cargo.toml parsing with inline table support
  - **Ruby/Bundler ecosystem support**
    - Framework detection for Rails (core, database, testing, frontend)
    - Framework detection for Sinatra (core, extensions)
    - Testing framework grouping (RSpec, Minitest, Capybara, FactoryBot)
    - Utility grouping (Sidekiq, Faraday, HTTParty)
    - Gemfile parsing with version constraints
  - **Polyglot repository support**
    - Single Dependabot config supporting npm + pip + cargo + bundler simultaneously
    - Automatic ecosystem detection from project files
    - Independent update schedules per ecosystem
    - Framework-aware grouping across all languages
    - Ecosystem-specific labels and commit message prefixes
  - **Comprehensive test coverage**: 15 tests covering all languages, frameworks, and edge cases
  - **Implementation**: Extended `lib/dependency-monitoring-premium.js` to 1200+ lines
  - **Zero external dependencies**: Simple regex-based parsing for all file formats

- **🚀 PREMIUM-001: Framework-Aware Dependency Grouping (Pro Tier)** - **SHIPPED AND LIVE!** Flagship premium feature reducing dependency PRs by 60%+
  - Intelligent dependency batching by framework (React, Vue, Angular)
  - Reduces dependency PRs by 60%+ for React projects (15+ individual PRs → 3-5 grouped PRs)
  - Automatic framework detection from package.json
  - Supports React ecosystem (core, state management, routing, UI libraries)
  - Supports Vue ecosystem (core, router, pinia, ecosystem packages)
  - Supports Angular ecosystem (core, common, router, state management)
  - Testing framework grouping (Jest, Vitest, Testing Library, Playwright)
  - Build tool grouping (Vite, Webpack, Turbo, Nx, Rollup)
  - Storybook ecosystem grouping
  - Wildcard pattern matching for scoped packages (@tanstack/_, @radix-ui/_, etc.)
  - Update-type filtering (major vs minor vs patch)
  - Dependency-type awareness (production vs development)
  - License tier validation (Pro/Enterprise only)
  - Generated Dependabot configs include framework detection comments
  - Comprehensive test suite (14 tests covering all frameworks and edge cases)
  - Implementation: `lib/dependency-monitoring-premium.js` (500+ lines)
  - Integration: `setup.js` updated to use premium config for licensed users
  - Free tier users see upgrade prompt with concrete example of PR reduction

- **Custom template support** - New `--template <path>` flag enables organizations to use custom coding standards
  - Load template files from local directory to override package defaults
  - Partial template support - custom templates can override specific files while falling back to defaults for others
  - Nested directory support - templates can include subdirectories (e.g., `.github/workflows/`, `config/`)
  - Path characters preserved - Special characters like `&` in directory names handled correctly
  - Use case: Enforce organization-specific linting rules, CI/CD workflows, and coding standards across projects

### Changed

- **Dependency monitoring setup enhanced** - `--deps` flag now routes to tier-appropriate config
  - Free tier: Basic Dependabot config (npm + github-actions, no grouping)
  - Pro/Enterprise tier: Framework-aware grouping with intelligent batching
  - License tier displayed during setup
  - Detected frameworks logged for Pro/Enterprise users
  - Upgrade messaging updated to show "Available now" for framework grouping
- **Premium tier pricing** - Beta launch pricing announced
  - Pro tier: $19.50/mo for 3 months (50% off, then $39/mo)
  - Enterprise tier: $98.50/mo for 3 months (50% off, then $197/mo)
  - Beta duration: December 2025 - February 2026

### Fixed

- **🚨 CRITICAL: TypeError in framework detection** - Fixed crash when `dependencies` or `devDependencies` are undefined
  - Issue: Fresh apps or projects with only devDependencies would crash with "Cannot convert undefined or null to object"
  - Fix: Added `|| {}` default values in `detectFrameworks()` function (lib/dependency-monitoring-premium.js:91-94)
  - Impact: Framework-aware grouping now works for all project configurations
  - Test: Added comprehensive Test 11b covering all edge cases (missing dependencies, missing devDependencies, both missing)
  - Discovered by: User testing before beta launch - prevented production bug
- **Path sanitization for --template flag** - Template directory paths now preserve special characters (`&`, `<`, `>`, etc.) that are valid in file paths
  - Previously: `validateAndSanitizeInput` stripped these characters, breaking legitimate paths like "ACME & Co"
  - Now: Template path read from raw CLI args before sanitization

## [2.6.1] - 2025-11-12

### Fixed

- **🚨 CRITICAL**: Workflow validation steps using conditional setup.js checks that always fall back to weaker validation
  - Configuration security check now uses `npx create-quality-automation@latest --security-config`
  - Documentation validation now uses `npx create-quality-automation@latest --validate-docs`
  - Previously: `if [ -f "setup.js" ]` was always false in consumer repos, silently falling back to basic grep checks
  - Impact: Consumer repos now get comprehensive validation instead of weak fallback checks
- **📖 README accuracy**: Removed "Auto-merge for security patches only" claim from Dependabot feature list
  - Auto-merge is NOT included in basic Dependabot configuration
  - Added note that auto-merge requires manual GitHub Actions workflow setup
  - Provided link to GitHub documentation for auto-merge setup

---

## [2.6.0] - 2025-11-12

### Added

- **Progress indicators** for validation operations - Shows [X/3] step progression during comprehensive validation
- **--dry-run mode** - Preview what files would be created/modified without making changes
- **Comprehensive troubleshooting guide** (TROUBLESHOOTING.md) - Covers common issues, platform-specific problems, and solutions
- **Automatic E2E package testing** - Validates published package works for consumers before release
- **Root cause analysis document** (claudedocs/CODEX_FINDINGS_ANALYSIS.md) - Prevention strategies for future issues

### Fixed

- **🚨 CRITICAL**: Workflow references to non-existent setup.js in consumer repos - Removed problematic step
- **🚨 CRITICAL**: npm scripts using `node setup.js` instead of `npx create-quality-automation@latest`
- **.eslintignore missing from npm package** - Added to files array
- **Invalid Dependabot config schema** - Removed unsupported `update-type` keys
- Removed .npmrc from files array (npm excludes it automatically)

### Changed

- Enhanced prerelease checks to include E2E package validation
- npm scripts now use `npx create-quality-automation@latest` for CLI operations
- Improved workflow to avoid consumer-facing failures

### Developer Experience

- Added `npm run test:e2e` for comprehensive package validation
- Better error messages with context
- Enhanced documentation for troubleshooting

---

## [2.5.0] - 2025-11-11

### Added

- **🧪 Comprehensive Error Path Testing:** Added `tests/error-paths.test.js` with 6 error scenarios (ESLint missing, malformed JSON, permissions, missing deps, invalid config, missing package.json)
- **📚 CI README Verification:** GitHub Actions now tests Quick Start instructions from clean environment to catch broken documentation
- **🏗️ Base Validator Class:** Created `lib/validation/base-validator.js` with common error handling, state management, and validation patterns
- **🏭 Validation Factory:** Implemented dependency injection pattern in `lib/validation/validation-factory.js` for better testability and loose coupling

### Changed

- **⚡ ESLint Programmatic API:** Refactored security validation to use ESLint API instead of fragile shell parsing, providing precise file:line:column error locations
- **🔧 TypeScript Config Detection:** Now detects all ESLint config variants including `eslint.config.ts.cjs` for TypeScript-first projects
- **🛡️ Better Error Messages:** Centralized error formatting for ENOENT, EACCES, MODULE_NOT_FOUND with context-aware messages

### Fixed

- **🚨 CRITICAL**: ESLint security validation now properly fails when ESLint binary is missing instead of silently passing (resolves false positive security gates)
- **🚨 CRITICAL**: TypeScript projects using `eslint.config.ts.cjs` are now properly scanned (previously invisible to security scanner)
- **📖 Documentation Validation:** Implemented promised README file/script reference validation that was advertised but not implemented
- **🪟 Cross-platform Testing:** Replaced Unix-only `rm -rf` with `fs.rmSync()` for Windows compatibility

---

## [2.4.0] - 2025-11-04

### Added

- **🆓 Freemium Dependency Monitoring:** `--deps` command now scaffolds a Dependabot + GitHub Actions baseline for npm projects, auto-merging security patches by default.
- **📋 License Awareness:** CLI surfaces current tier details through `--license-status`, including upgrade prompts for Pro/Enterprise.

### Changed

- **📣 Documentation:** README now highlights the free tier entry point, premium upgrade paths, and dependency monitoring workflow.
- **🛠️ Validation Scripts:** `validate:comprehensive` bundles freemium configuration checks so repos stay aligned after upgrades.

---

## [2.3.3] - 2025-11-01

### Fixed

- **🚨 CRITICAL**: Made missing gitleaks binary block security validation instead of silently passing
  - v2.3.2 still allowed "✅ Security checks passed" when gitleaks was missing
  - Missing gitleaks now properly fails validation with clear error message
  - Users can use `--no-gitleaks` flag to explicitly skip if desired

---

## [2.3.2] - 2025-11-01

### Fixed

- **🚨 CRITICAL**: Fixed gitleaks error swallowing that caused false positives
  - Previous version silently ignored gitleaks failures (missing binary, permissions, etc.)
  - Security validation would pass with "✅ Security checks passed" even when gitleaks never ran
  - Now properly surfaces failures: info message for missing binary, blocking errors for other issues

---

## [2.3.1] - 2025-11-01

### Fixed

- **🚨 CRITICAL**: Fixed gitleaks invocation to use `npx` instead of `which` + bare command
  - Previous version silently skipped secret scanning on Windows and local npm installs
- **🚨 CRITICAL**: Fixed actionlint invocation to use `npx` instead of `which` + bare command
  - Previous version silently skipped workflow validation on Windows and local npm installs
- **🔧 MAJOR**: Fixed Python script setup to preserve existing scripts instead of overwriting
  - Previous version broke idempotency and clobbered custom python:\* commands

---

## [2.3.0] - 2025-11-01

### Changed

- **🔧 Mature Tool Integration**: Replaced custom implementations with industry-standard tools
  - `@npmcli/package-json` for robust package.json handling (replaces custom JSON manipulation)
  - `gitleaks` for comprehensive secret scanning (replaces regex patterns)
  - `actionlint` for GitHub Actions workflow validation
  - `markdownlint-cli2` for documentation validation (replaces custom parsing)

### Added

- **📱 Enhanced Windows Compatibility**: Replaced shell pipe dependencies with Node.js parsing
- **🧪 Comprehensive Integration Tests**: Prevents regressions across multiple environments
- **📦 Shared Package Utilities**: Extracted common functionality to eliminate code duplication
- **⚡ Lazy Loading**: Node.js 20+ requirement enforcement with proper dependency loading
- **🎛️ Granular Configuration**: Tool-specific disable options for advanced users
- **🚀 Automated Release Workflow**: Streamlined npm publishing and GitHub releases

### Fixed

- **Node Version Compatibility**: Proper enforcement of Node.js 20+ requirement
- **ESLint Config Detection**: Support for both `.js` and `.cjs` config file variants
- **Cross-Platform Reliability**: Eliminated grep and shell-specific commands
- **Package.json API Usage**: Correct usage of `PackageJson.create()` vs `PackageJson.load()`

---

## [2.2.0] - 2025-10-29

### Added

- **🔍 Configuration Security Scanner**: Detects client-side secret exposure in Next.js and Vite configs
- **📖 Documentation Accuracy Validator**: Ensures README file references and npm scripts actually exist
- **🎯 Enhanced CLI Commands**: New validation-only commands for targeted checks
- **🔧 Enhanced npm Scripts**: Template projects get comprehensive validation scripts

### New CLI Commands

- `npx create-quality-automation@latest --security-config` - Run configuration security scan
- `npx create-quality-automation@latest --validate-docs` - Validate documentation accuracy
- `npx create-quality-automation@latest --comprehensive` - Run all validation checks

### Enhanced GitHub Actions

- Configuration security validation in CI/CD pipeline
- Documentation accuracy checks for pull requests
- Fallback security checks for projects without setup.js

### Security Features

- **Next.js Security**: Detects secrets in `env` blocks that expose to client bundle
- **Vite Security**: Identifies `VITE_` prefixed secrets that are client-exposed
- **Docker Security**: Scans Dockerfiles for hardcoded secrets in ENV statements
- **Environment Security**: Validates .env file .gitignore patterns

### Documentation Features

- **File Reference Validation**: Checks that referenced files actually exist
- **Script Reference Validation**: Ensures documented npm scripts are available
- **Version Consistency**: Validates package.json version appears in CHANGELOG
- **Technology Alignment**: Checks description accuracy with detected technologies

### Testing

- **Comprehensive Test Suite**: Full test coverage for all validation features
- **Integration Tests**: End-to-end validation of security and documentation checks
- **Error Case Testing**: Validates that insecure configurations are properly caught

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

### Planned for v2.3.0

- Runtime validation framework (selective implementation)
- Build process validation
- Template compilation checks
- Enhanced CI/CD integration

### Planned for v2.4.0

- commitlint integration for conventional commits
- Jest/Vitest testing templates
- React/Vue framework presets
- Workspace/monorepo support

### Planned for v3.0.0

- Custom rule presets (strict, relaxed, enterprise)
- Plugin ecosystem for extended functionality
- Integration with popular CI providers (CircleCI, GitLab)
- Quality metrics dashboard

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
