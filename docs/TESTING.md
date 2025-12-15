# Testing Strategy

## Overview

QA Architect uses plain Node-based test runners (no Jest) with a heavy focus on integration tests that validate real CLI workflows end to end.

## Running Tests

```bash
npm test                 # Run all tests (sequential Node scripts)
npm run test:coverage    # Run with coverage report via c8
```

## Test Structure

```
tests/
├── setup.test.js           # Main CLI integration tests
├── cli-deps-integration.test.js    # Dependency CLI tests
├── real-world-packages.test.js     # Real package validation
└── premium-dependency-monitoring.test.js  # Pro feature tests
```

## Coverage Requirements

- **Overall**: 75%+ lines, statements, functions, branches
- **New files**: 75%+ coverage before merging
- **Critical files**: `setup.js` requires 80%+

## Testing Patterns

### Integration Tests

Test real CLI workflows with temp directories:

```javascript
const testDir = createTempGitRepo()
const result = execSync('node setup.js --deps', { cwd: testDir })
assert(fs.existsSync(path.join(testDir, '.github/dependabot.yml')))
```

### Real-World Data

Use real packages from the ecosystem, not toy examples:

```javascript
const TOP_PYTHON_PACKAGES = [
  'django-cors-headers',
  'scikit-learn',
  'pytest-cov',
]
```

## Pre-Release Validation

Always run before release:

```bash
npm run prerelease  # Runs docs:check + all tests
```
