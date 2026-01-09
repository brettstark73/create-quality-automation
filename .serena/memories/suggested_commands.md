# Suggested Commands

## Development Workflow

### Testing

```bash
npm test                    # Run all tests (40+ test files)
npm run test:unit           # Fast unit tests only (no Python/monorepo)
npm run test:slow           # Integration tests (Python, monorepo, real-world)
npm run test:coverage       # Coverage report (requires 75% lines, 70% functions)
npm run test:fast           # Alias for test:unit
npm run test:comprehensive  # Full suite: patterns + all tests + commands + e2e
npm run test:all            # patterns + tests + commands + e2e
npm run test:e2e            # End-to-end package test
```

### Run Single Test File

```bash
node tests/licensing.test.js
node tests/workflow-tiers.test.js
QAA_DEVELOPER=true node tests/setup.test.js  # Bypass license checks
```

### Linting & Formatting

```bash
npm run lint                # ESLint + Stylelint
npm run lint:fix            # Auto-fix linting issues
npm run format              # Format with Prettier
npm run format:check        # Check formatting without fixing
```

### Validation

```bash
npm run validate:all        # Full validation (comprehensive + security audit)
npm run validate:comprehensive  # Setup validation + markdownlint disabled
npm run validate:docs       # Docs validation only
npm run prerelease          # Pre-release checks (required before publish)
```

### Security

```bash
npm run security:audit      # npm audit (high severity only)
npm run security:secrets    # Check for hardcoded secrets
npm run security:config     # Generate security config
```

### CLI Testing

```bash
npx . --dry-run             # Test setup without changes
npx . --check-maturity      # Show project maturity detection
npx . --validate            # Run validation checks
npx . --workflow-minimal    # Test minimal CI setup (default)
npx . --workflow-standard   # Test standard CI setup
npx . --workflow-comprehensive  # Test comprehensive CI setup
npx . --analyze-ci          # Analyze GitHub Actions costs (Pro)
```

### Release

```bash
npm run prerelease          # Required before publishing
npm run release:patch       # Bump patch version + push tags
npm run release:minor       # Bump minor version + push tags
npm run release:major       # Bump major version + push tags
```

## Darwin-Specific Notes

- System commands: standard Unix tools (ls, cd, grep, find, git work normally)
- No special Darwin adjustments needed for development
