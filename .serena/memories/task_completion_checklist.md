# Task Completion Checklist

## After Making Code Changes

### 1. Linting & Formatting

```bash
npm run lint                # Check for linting issues
npm run lint:fix            # Auto-fix linting issues
npm run format              # Format code with Prettier
npm run format:check        # Verify formatting
```

### 2. Testing

```bash
npm run test:patterns       # Validate command patterns (CRITICAL for config/defaults.js)
npm run test:unit           # Fast unit tests
npm test                    # Full test suite
npm run test:commands       # Command execution tests (if relevant)
```

### 3. Coverage Check (Optional)

```bash
npm run test:coverage       # Generate coverage report
# Requirements: 75% lines, 70% functions, 65% branches
```

### 4. Validation (If Changing Core Features)

```bash
npm run validate:all        # Full validation suite
```

### 5. Pre-Release (Before Publishing)

```bash
npm run prerelease          # REQUIRED: docs:check + all tests + e2e
```

## Pre-Push Automation

The pre-push hook runs automatically:

- `npm run lint`
- `npm run format:check`
- `npm run test:patterns`
- `npm run test:commands`
- `npm test`

## Critical Files to Validate

- **config/defaults.js** - MUST run `npm run test:patterns` after changes
- **lib/licensing.js** - Run `node tests/licensing.test.js`
- **setup.js** - Run full test suite
- **templates/quality.yml** - Run `node tests/workflow-tiers.test.js`

## Quality Gates

- All tests must pass
- Coverage thresholds must be met (75% lines, 70% functions)
- No linting errors
- Formatting must be clean
- Documentation must be up-to-date
