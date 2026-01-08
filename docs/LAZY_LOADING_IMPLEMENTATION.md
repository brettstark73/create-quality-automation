# Lazy Loading Implementation Plan

**Performance Optimization:** Reduce startup time for simple commands by 45%

## Problem Statement

Currently, `setup.js` loads all heavy modules at startup (lines 146-196), even for simple commands like `--help` that exit immediately.

**Modules loaded unnecessarily for --help:**

- `lib/licensing.js` (40KB, 1,316 lines)
- `lib/smart-strategy-generator.js` (12KB, 381 lines)
- `lib/quality-tools-generator.js` (16KB, 496 lines)
- `lib/dependency-monitoring-premium.js` (44KB, 1,492 lines)
- `lib/prelaunch-validator.js` (24KB, 829 lines)

**Total waste: ~136KB loaded but never used for simple commands**

## Current Performance

```bash
$ time node setup.js --help
real    0m0.073s  # 73ms total
user    0m0.060s
sys     0m0.010s
```

## Target Performance

```bash
$ time node setup.js --help
real    0m0.030s  # 30ms total (45% faster)
user    0m0.020s
sys     0m0.005s
```

## Implementation Strategy

### Phase 1: Create Lazy Loader Infrastructure ✅ DONE

**File:** `lib/lazy-loader.js` (already created)

Provides caching lazy loaders:

- `getLicensing()`
- `getSmartStrategy()`
- `getQualityTools()`
- `getPrelaunchValidator()`
- `getDependencyMonitoringPremium()`

### Phase 2: Refactor setup.js Imports

**Current (lines 146-196):**

```javascript
const {
  getLicenseInfo,
  hasFeature,
  showUpgradeMessage,
} = require('./lib/licensing')

const {
  detectProjectType,
  generateSmartStrategy,
} = require('./lib/smart-strategy-generator')
```

**New approach:**

```javascript
const {
  getLicensing,
  getSmartStrategy,
  getQualityTools,
  getPrelaunchValidator,
} = require('./lib/lazy-loader')

// Only load when needed
function getLicenseInfo() {
  return getLicensing().getLicenseInfo()
}

function hasFeature(feature) {
  return getLicensing().hasFeature(feature)
}
```

**OR simpler wrapper pattern:**

```javascript
const lazy = require('./lib/lazy-loader')

// Use throughout code
const license = lazy.getLicensing().getLicenseInfo()
const hasLH = lazy.getLicensing().hasFeature('lighthouseCI')
```

### Phase 3: Update Call Sites

**Find all usage:**

```bash
grep -n "getLicenseInfo\|hasFeature\|showUpgradeMessage" setup.js
```

**Replace patterns:**

1. **License checks** (lines 914-919, 1099, 1117, 2218, 2275)

```javascript
// Before
const hasLighthouse = hasFeature('lighthouseCI')

// After
const { hasFeature } = getLicensing()
const hasLighthouse = hasFeature('lighthouseCI')
```

2. **Smart strategy** (lines 2224-2232)

```javascript
// Before
const projectType = detectProjectType(process.cwd())
const { script } = generateSmartStrategy({ ... })

// After
const { detectProjectType, generateSmartStrategy } = getSmartStrategy()
const projectType = detectProjectType(process.cwd())
const { script } = generateSmartStrategy({ ... })
```

3. **Quality tools** (lines 900-950)

```javascript
// Before
writeLighthouseConfig(...)
writeSizeLimitConfig(...)

// After
const { writeLighthouseConfig, writeSizeLimitConfig } = getQualityTools()
writeLighthouseConfig(...)
writeSizeLimitConfig(...)
```

### Phase 4: Testing

**Unit tests:**

```javascript
// tests/lazy-loader.test.js
const { LazyModuleCache, getLicensing } = require('../lib/lazy-loader')

// Test caching
const cache1 = getLicensing()
const cache2 = getLicensing()
assert.strictEqual(cache1, cache2) // Same object

// Test module functionality
const { hasFeature } = getLicensing()
assert.strictEqual(typeof hasFeature, 'function')
```

**Integration tests:**

```bash
# Test all commands still work
npx . --help
npx . --version
npx . --license-status
npx . --validate
npx . --dry-run
```

**Performance verification:**

```bash
# Measure startup improvement
hyperfine "node setup.js --help" "node setup-old.js --help"
```

### Phase 5: Edge Cases

**Commands that need early loading:**

1. `--license-status` - Needs licensing immediately (line 667)
2. `--activate-license` - Needs licensing immediately (line 804)
3. `--telemetry-status` - Needs telemetry immediately (line 670)

**Solution:** Load on-demand just before these commands:

```javascript
if (isLicenseStatusMode) {
  const { getLicenseInfo } = getLicensing() // Load here
  const license = getLicenseInfo()
  // ... display status
  process.exit(0)
}
```

## Implementation Checklist

- [x] Create `lib/lazy-loader.js` with caching infrastructure
- [ ] Identify all call sites for heavy modules in setup.js
- [ ] Refactor licensing module usage (40+ call sites)
- [ ] Refactor smart-strategy module usage (5+ call sites)
- [ ] Refactor quality-tools module usage (20+ call sites)
- [ ] Refactor prelaunch-validator module usage (10+ call sites)
- [ ] Create unit tests for lazy loader
- [ ] Run full test suite (all 40+ tests must pass)
- [ ] Measure performance improvement
- [ ] Update documentation

## Risks & Mitigation

| Risk                               | Impact | Mitigation                            |
| ---------------------------------- | ------ | ------------------------------------- |
| Breaking existing tests            | High   | Run full test suite after each change |
| Module initialization side effects | Medium | Review each module for side effects   |
| Forgot to update call site         | Medium | Use grep to find all usages           |
| Performance regression             | Low    | Measure before/after with benchmarks  |

## Estimated Effort

- **Research & Planning:** 1 hour ✅ DONE
- **Implementation:** 2-3 hours
- **Testing:** 1 hour
- **Documentation:** 30 minutes
- **Total:** 4-5 hours

## Expected Impact

**Startup time improvements:**

| Command            | Before | After   | Savings    |
| ------------------ | ------ | ------- | ---------- |
| `--help`           | 73ms   | 30-40ms | 45% faster |
| `--version`        | 73ms   | 30-40ms | 45% faster |
| `--license-status` | 73ms   | 50-60ms | 20% faster |
| `--dry-run`        | 150ms  | 120ms   | 20% faster |
| Full setup         | 100ms  | 100ms   | No change  |

**Why full setup doesn't improve:**
All modules are eventually loaded during full setup, so lazy loading just defers the cost rather than eliminating it. The benefit is only for commands that exit early.

## Alternative: Deferred Require Pattern

Instead of a central lazy loader, could use inline deferred requires:

```javascript
// In setup.js, remove top-level requires
// Lines 146-196 deleted

// Add requires only where needed
function runMainSetup() {
  // Load heavy modules only when entering setup flow
  const { getLicenseInfo, hasFeature } = require('./lib/licensing')
  const { detectProjectType } = require('./lib/smart-strategy-generator')

  // ... rest of setup
}
```

**Pros:**

- Simpler implementation
- No wrapper functions needed
- Clear module boundaries

**Cons:**

- Multiple require() calls (slight overhead)
- Less testable (harder to mock)
- Scattered require() statements

## Recommendation

**Use the LazyModuleCache approach** (Phase 1-5 above) because:

1. ✅ Centralized caching prevents duplicate loads
2. ✅ Easier to test and mock
3. ✅ Clear performance characteristics
4. ✅ Better for future optimizations (could add metrics)
5. ✅ Follows established patterns (React.lazy, webpack code-splitting)

## Next Steps

1. Review this plan with team
2. Get approval for 4-5 hour time investment
3. Create feature branch: `perf/lazy-loading-modules`
4. Implement Phase 2-5
5. Run full test suite
6. Measure performance improvement
7. Create PR with before/after benchmarks

## Future Optimizations

After lazy loading is implemented, could consider:

1. **Lazy load command handlers** - Similar pattern for `lib/commands/*`
2. **Dynamic imports** - Use async `import()` for even lazier loading
3. **Bundle splitting** - Separate CLI from library code
4. **Tree shaking** - Eliminate unused exports from modules

---

**Status:** Planning complete, ready for implementation
**Owner:** TBD
**Priority:** P2 (Nice to have, not blocking)
**Estimated Impact:** 45% faster startup for simple commands
