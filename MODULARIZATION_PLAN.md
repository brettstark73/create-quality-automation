# Setup.js Modularization Plan

## Current State

- **File Size**: 1,655 lines of code
- **Responsibilities**: Argument parsing, templating, validation, telemetry, dependency monitoring, and git checks all interleaved
- **Main Issue**: High coupling makes regression risk and code paths hard to test or evolve

## Modularization Strategy

### Phase 1: Argument Parsing and Configuration (Immediate - High Impact)

**Target**: Extract argument parsing and configuration validation
**New Module**: `lib/cli/argument-parser.js`
**Lines to Extract**: ~150-200 lines
**Benefits**:

- Clear CLI interface definition
- Easier to test different argument combinations
- Reduces setup.js main function complexity

```javascript
// lib/cli/argument-parser.js
module.exports = {
  parseArguments,
  validateArguments,
  getHelpText,
  isValidCommand,
}
```

### Phase 2: Validation Orchestration (Immediate - High Impact)

**Target**: Extract validation workflow coordination
**New Module**: `lib/validation/validation-orchestrator.js`
**Lines to Extract**: ~200-300 lines
**Benefits**:

- Centralized validation flow control
- Easier to add/remove validation steps
- Better error handling and reporting

```javascript
// lib/validation/validation-orchestrator.js
module.exports = {
  runValidationPipeline,
  createValidationContext,
  handleValidationErrors,
  generateValidationReport,
}
```

### Phase 3: Template and File Operations (Medium Priority)

**Target**: Extract file manipulation and templating logic
**New Module**: `lib/templates/template-manager.js`
**Lines to Extract**: ~300-400 lines
**Benefits**:

- Cleaner separation of file I/O operations
- Reusable templating system
- Better error handling for file operations

```javascript
// lib/templates/template-manager.js
module.exports = {
  loadTemplate,
  renderTemplate,
  writeConfigFile,
  mergeConfigFiles,
  backupExistingFiles,
}
```

### Phase 4: Git and Package Operations (Medium Priority)

**Target**: Extract git operations and package.json manipulation
**New Modules**:

- `lib/git/git-operations.js`
- `lib/package/package-manager.js`
  **Lines to Extract**: ~200-250 lines
  **Benefits**:
- Isolated git operations for easier testing
- Package manager detection already partially extracted
- Better error handling for system operations

```javascript
// lib/git/git-operations.js
module.exports = {
  checkGitRepository,
  initializeGitRepository,
  addGitHooks,
  validateGitignore,
}

// lib/package/package-manager.js (extend existing)
module.exports = {
  detectPackageManager,
  installDependencies,
  updatePackageJson,
  validatePackageStructure,
}
```

### Phase 5: Main CLI Coordinator (Final - Low Priority)

**Target**: Slim down main setup.js to pure coordination
**Final setup.js**: ~100-200 lines
**Responsibilities**:

- Parse arguments
- Initialize context
- Orchestrate workflow
- Handle errors and cleanup

```javascript
// setup.js (final structure)
const { parseArguments } = require('./lib/cli/argument-parser')
const {
  runValidationPipeline,
} = require('./lib/validation/validation-orchestrator')
const { renderTemplate } = require('./lib/templates/template-manager')

async function main() {
  const config = parseArguments(process.argv)
  await runValidationPipeline(config)
  await renderTemplate(config)
  // Minimal coordination logic only
}
```

## Implementation Guidelines

### Testing Strategy

- **Before Extraction**: Create comprehensive integration tests for existing functionality
- **During Extraction**: Add unit tests for each new module
- **After Extraction**: Maintain integration tests to prevent regressions

### Migration Approach

- **Extract modules incrementally** - one phase at a time
- **Maintain backward compatibility** during transition
- **Use feature flags** for gradual rollout of new modules
- **Extensive testing** at each phase

### Module Interface Design

- **Typed interfaces** where possible (JSDoc or TypeScript)
- **Error boundaries** - modules should handle their own errors gracefully
- **Dependency injection** - avoid hard dependencies between modules
- **Configuration objects** - prefer config objects over multiple parameters

## Risk Mitigation

### Regression Prevention

- **Comprehensive test coverage** before any modularization
- **Integration test suite** that validates end-to-end functionality
- **Smoke tests** for critical workflows (setup, validation, file generation)

### Incremental Rollout

- **Feature flags** to toggle between old and new implementations
- **A/B testing** with subset of operations
- **Rollback plan** for each phase

### Quality Gates

- **Code coverage requirements** for new modules (>80%)
- **Performance benchmarks** to prevent regression
- **Memory usage monitoring** during large operations

## Success Metrics

### Code Quality

- **Cyclomatic complexity** reduction from high to moderate
- **Function length** average <50 lines
- **Module coupling** - low interdependence between modules

### Testing

- **Unit test coverage** >80% for new modules
- **Integration test coverage** maintained at current levels
- **Test execution time** <2x current duration

### Maintainability

- **New feature implementation time** reduction by 30%
- **Bug fix isolation** - issues contained to specific modules
- **Code review time** reduction due to smaller, focused changes

## Timeline Estimation

### Phase 1 (Argument Parsing): 2-3 days

- Extract argument parsing logic
- Create comprehensive unit tests
- Update integration tests

### Phase 2 (Validation Orchestration): 3-4 days

- Extract validation pipeline
- Implement error handling improvements
- Test all validation scenarios

### Phase 3 (Template Operations): 4-5 days

- Extract file operations
- Implement template system improvements
- Test file manipulation edge cases

### Phase 4 (Git/Package Operations): 3-4 days

- Extract git operations
- Extend package manager utilities
- Test system operation scenarios

### Phase 5 (Final Cleanup): 2-3 days

- Finalize main coordinator
- Remove dead code
- Performance optimization

**Total Estimated Time**: 14-19 days

## Immediate Next Steps

1. **Create comprehensive test suite** for existing setup.js functionality
2. **Begin with Phase 1** (argument parsing) as it has the highest impact/risk ratio
3. **Set up feature flags** for gradual rollout
4. **Create performance benchmarks** to detect regressions

## Dependencies and Prerequisites

- **Existing test suite expansion** to cover critical workflows
- **CI/CD pipeline updates** to run extended test suites
- **Documentation updates** for new module interfaces
- **Developer onboarding materials** for new architecture

This modularization plan transforms setup.js from a monolithic file into a well-structured, testable, and maintainable system while preserving all existing functionality.
