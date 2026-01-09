# Code Style and Conventions

## Language & Module System

- **JavaScript (Node.js)** - CommonJS modules (`require`, `module.exports`)
- **TypeScript** - Type checking only (`tsc --noEmit`), no transpilation
- **Config files** - `.cjs` for ESLint configs to ensure CommonJS in ESM-default projects

## Naming Conventions

- **Functions**: camelCase (`parseArguments`, `runMainSetup`)
- **Classes**: PascalCase (rare in this codebase)
- **Constants**: SCREAMING_SNAKE_CASE for true constants (`QAA_DEVELOPER`)
- **Files**: kebab-case (`project-maturity.js`, `smart-strategy-generator.js`)
- **Directories**: kebab-case (`lib/`, `tests/`, `config/`)

## Code Organization

- **Main entry**: `setup.js` - CLI entry point with argument parsing and orchestration
- **Libraries**: `lib/` - Reusable modules (licensing, maturity detection, generators)
- **Commands**: `lib/commands/` - Command handlers (validate, deps, analyze-ci)
- **Validation**: `lib/validation/` - Validators (security, docs, config)
- **Interactive**: `lib/interactive/` - TTY prompt system
- **Templates**: `templates/` - Config file templates
- **Config**: `config/` - Language-specific configs (Python, Shell, etc.)
- **Tests**: `tests/` - 40+ test files with real filesystem operations

## Formatting & Linting

- **Prettier** - Enforced formatting (`.prettierrc`)
- **ESLint** - Flat config (`eslint.config.cjs` + `eslint.config.ts.cjs`)
- **Stylelint** - CSS/SCSS linting (`.stylelintrc.json`)
- **EditorConfig** - Cross-editor consistency (`.editorconfig`)

## Testing Patterns

- **Framework**: Native Node.js assertions (no Jest/Mocha/Vitest)
- **Temp directories**: Tests create real git repos in temp dirs
- **Cleanup**: Tests clean up temp dirs after completion
- **Developer mode**: `QAA_DEVELOPER=true` bypasses license checks
- **Example**:
  ```javascript
  const testDir = createTempGitRepo()
  execSync('node setup.js --deps', { cwd: testDir })
  assert(fs.existsSync(path.join(testDir, '.github/dependabot.yml')))
  ```

## Documentation

- **README.md** - User-facing documentation
- **CLAUDE.md** - AI assistant guidance for this codebase
- **CHANGELOG.md** - Version history
- **CONTRIBUTING.md** - Contribution guidelines
- **Comments** - Minimal inline comments, prefer self-documenting code

## Git Conventions

- **Hooks**: Pre-commit (lint-staged), pre-push (validation)
- **Commit messages**: Conventional commits preferred
- **Branches**: Standard Git flow
