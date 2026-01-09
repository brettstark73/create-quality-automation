# Architecture Overview

## Data Flow

1. **Parse args** → `parseArguments()` handles CLI flags
2. **Route command** → validation-only, deps, license, or full setup
3. **Detect project** → TypeScript, Python, Shell scripts, Stylelint targets
4. **Load templates** → merge custom templates with defaults
5. **Generate configs** → ESLint, Prettier, Husky hooks, workflows
6. **Apply enhancements** → production quality fixes

## Key Modules

### Core Setup (`setup.js`)

- **Lines 390-500**: Main entry, interactive mode handling
- **Lines 985-2143**: Core setup flow (`runMainSetup`)
- Argument parsing, orchestration, file generation

### License System (`lib/licensing.js`)

- Tier system: FREE/PRO/TEAM/ENTERPRISE
- Feature gating: `hasFeature('smartTestStrategy')`
- Usage caps: 1 private repo, 50 runs/month (FREE)
- License info: `getLicenseInfo()`

### Project Maturity (`lib/project-maturity.js`)

- Detects project stage: minimal → early → established → production-ready
- Adapts quality checks based on maturity
- Used to determine workflow tier defaults

### Workflow Tiers (`setup.js` + template placeholders)

- **Minimal (default)**: Single Node 22, weekly security, path filters (~$0-5/mo)
- **Standard**: Matrix on main only, weekly security, path filters (~$5-20/mo)
- **Comprehensive**: Matrix every commit, inline security (~$100-350/mo)
- Implementation:
  - `detectExistingWorkflowMode()` - Reads `# WORKFLOW_MODE:` marker
  - `injectWorkflowMode()` - Replaces placeholders in quality.yml
  - Placeholders: `PATH_FILTERS_PLACEHOLDER`, `SECURITY_SCHEDULE_PLACEHOLDER`, `MATRIX_PLACEHOLDER`, `TESTS_CONDITION_PLACEHOLDER`

### Smart Test Strategy (`lib/smart-strategy-generator.js`)

- Risk-based test selection (Pro feature)
- Analyzes git history to determine test priority
- Reduces pre-push validation time

### Dependency Monitoring (`lib/dependency-monitoring-*.js`)

- Generates Dependabot config
- Multi-language support (npm, pip, etc.)
- Security update scheduling

### Commands (`lib/commands/`)

- `validate` - Run validation checks
- `deps` - Generate dependency monitoring config
- `analyze-ci` - Analyze GitHub Actions costs (Pro)

### Validation (`lib/validation/`)

- Security validators
- Documentation validators
- Config validators
- Parallel validation execution

### Interactive Mode (`lib/interactive/`)

- TTY prompt system
- User input handling
- Progressive disclosure

### Template Loader (`lib/template-loader.js`)

- Loads config templates
- Merges custom templates with defaults
- Handles template substitution

## Configuration Files

- **config/defaults.js** - Default scripts, dependencies, lint-staged config
- **templates/** - Config file templates (ESLint, Prettier, Husky, workflows)
- **config/** - Language-specific configs (Python, Shell, etc.)

## Testing Architecture

- **40+ test files** in `tests/`
- Real filesystem operations with temp directories
- `QAA_DEVELOPER=true` bypasses license checks
- Coverage requirements: 75% lines, 70% functions, 65% branches
