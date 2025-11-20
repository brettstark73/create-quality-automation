# PREMIUM-001: Framework-Aware Dependency Grouping

**Epic**: Flagship Pro feature - intelligent dependency batching by framework
**Priority**: P0 Critical (Blocks Premium Launch)
**Effort**: XL (40+ hours)
**Strategy**: Systematic with parallel execution
**Business Value**: Differentiates from Dependabot, reduces alert fatigue 60%+, justifies $39/mo Pro tier

## Executive Summary

Implement framework-aware dependency grouping that intelligently batches npm updates by framework (React, Vue, Angular, testing libraries) instead of creating individual PRs for each dependency. This reduces dependency management overhead from hours to minutes per week.

## Current State Analysis

### Extension Points Identified

**lib/dependency-monitoring-basic.js** (lines 1-132):

- ✅ Has `generateBasicDependabotConfig()` function (lines 22-74)
- ✅ Returns YAML-convertible config object
- ✅ Already generates for npm + github-actions ecosystems
- ✅ Has `writeBasicDependabotConfig()` for file output (lines 79-93)
- ✅ Simple YAML converter utility (lines 98-125)

**Architectural Pattern**:

```javascript
// Current: Basic config generation
function generateBasicDependabotConfig(options) {
  return {
    version: 2,
    updates: [
      { 'package-ecosystem': 'npm', directory: '/', schedule: {...} }
    ]
  }
}

// Target: Framework-aware config generation (Premium)
function generatePremiumDependabotConfig(options, license) {
  if (license.tier === 'free') {
    return generateBasicDependabotConfig(options)
  }

  const frameworks = detectFrameworks(options.projectPath)
  const groups = generateDependencyGroups(frameworks)

  return {
    version: 2,
    updates: [
      {
        'package-ecosystem': 'npm',
        directory: '/',
        schedule: {...},
        groups: groups  // <-- Premium feature
      }
    ]
  }
}
```

**Integration Point**:

- `setup.js` line 567: Calls `generateBasicDependabotConfig()`
- `setup.js` line 574: Calls `writeBasicDependabotConfig()`

### Framework Detection Strategy

**Analyze package.json dependencies** (already loaded in setup.js:670-697):

```javascript
// Detectable frameworks from package.json
const frameworkSignatures = {
  react: ['react', 'react-dom'],
  nextjs: ['next'],
  vue: ['vue', '@vue/'],
  angular: ['@angular/core', '@angular/cli'],
  svelte: ['svelte'],
  testing: ['jest', 'vitest', '@testing-library/'],
  storybook: ['@storybook/'],
  build: ['webpack', 'vite', 'turbo', 'nx'],
}
```

## Architecture Design

### Component Structure

```
lib/
├── dependency-monitoring-basic.js      (existing - Free tier)
└── dependency-monitoring-premium.js    (NEW - Pro/Enterprise tier)
    ├── Framework Detection
    │   └── detectFrameworks(packageJson)
    ├── Dependency Grouping
    │   ├── generateReactGroups()
    │   ├── generateVueGroups()
    │   ├── generateAngularGroups()
    │   ├── generateTestingGroups()
    │   └── generateBuildToolGroups()
    ├── Config Generation
    │   └── generatePremiumDependabotConfig(options, license)
    └── Breaking Change Detection
        └── analyzeBreakingChanges(dependencies)
```

### Data Structures

**Framework Detection Output**:

```javascript
{
  primary: 'react',              // Main framework
  testing: ['jest', 'playwright'],
  build: ['vite'],
  ui: ['storybook'],
  frameworks: {
    react: {
      detected: true,
      packages: ['react', 'react-dom', 'react-router-dom'],
      version: '^18.0.0'
    }
  }
}
```

**Dependency Groups Configuration**:

```javascript
{
  'react-core': {
    patterns: ['react', 'react-dom', 'react-router*'],
    'update-types': ['minor', 'patch']
  },
  'react-ecosystem': {
    patterns: ['@tanstack/*', 'zustand', 'jotai'],
    'update-types': ['patch']
  },
  'testing-frameworks': {
    patterns: ['jest', '@testing-library/*', 'vitest'],
    'update-types': ['minor', 'patch']
  },
  'build-tools': {
    patterns: ['vite', 'webpack', 'turbo'],
    'update-types': ['patch']
  }
}
```

## Implementation Plan

### 📋 Phase 1: Foundation & Framework Detection (8 hours)

**Story 1.1: Create Premium Dependency Monitoring Module**

- [ ] Task 1.1.1: Create `lib/dependency-monitoring-premium.js`
- [ ] Task 1.1.2: Import licensing system (`lib/licensing.js`)
- [ ] Task 1.1.3: Add license tier validation (Pro/Enterprise only)
- [ ] Task 1.1.4: Export `generatePremiumDependabotConfig()` function

**Story 1.2: Implement Framework Detection Engine**

- [ ] Task 1.2.1: Create `detectFrameworks(packageJson)` function
- [ ] Task 1.2.2: Define framework signature patterns (React, Vue, Angular, etc.)
- [ ] Task 1.2.3: Scan devDependencies + dependencies for matches
- [ ] Task 1.2.4: Return structured framework detection result
- [ ] Task 1.2.5: Add unit tests for framework detection

**Story 1.3: Framework Version Analysis**

- [ ] Task 1.3.1: Extract framework versions from package.json
- [ ] Task 1.3.2: Identify framework major versions (React 18 vs 17)
- [ ] Task 1.3.3: Log detected frameworks in setup output

**Acceptance Criteria**:

- ✅ `detectFrameworks()` correctly identifies React, Vue, Angular projects
- ✅ Handles monorepos with multiple frameworks
- ✅ Works with both dependencies and devDependencies
- ✅ Unit tests pass with 90%+ coverage

**Parallel Execution**: Can run concurrently with Phase 2 design

---

### 🎨 Phase 2: Dependency Grouping Logic (12 hours)

**Story 2.1: React Dependency Groups**

- [ ] Task 2.1.1: Define React core group (react, react-dom, react-router)
- [ ] Task 2.1.2: Define React ecosystem group (@tanstack/\*, zustand, etc.)
- [ ] Task 2.1.3: Define React meta-frameworks (Next.js, Remix, Gatsby)
- [ ] Task 2.1.4: Implement `generateReactGroups()` function
- [ ] Task 2.1.5: Add version-aware grouping (React 18+ features)

**Story 2.2: Vue Dependency Groups**

- [ ] Task 2.2.1: Define Vue core group (vue, vue-router, pinia)
- [ ] Task 2.2.2: Define Vue ecosystem (@vue/\*, vueuse)
- [ ] Task 2.2.3: Define Nuxt.js dependencies
- [ ] Task 2.2.4: Implement `generateVueGroups()` function

**Story 2.3: Angular Dependency Groups**

- [ ] Task 2.3.1: Define Angular core (@angular/core, @angular/common)
- [ ] Task 2.3.2: Define Angular ecosystem (@angular/material, @ngrx/\*)
- [ ] Task 2.3.3: Implement `generateAngularGroups()` function

**Story 2.4: Testing & Build Tool Groups**

- [ ] Task 2.4.1: Define testing groups (Jest, Vitest, Playwright, Testing Library)
- [ ] Task 2.4.2: Define build tool groups (Vite, Webpack, Turbo, Nx)
- [ ] Task 2.4.3: Define Storybook ecosystem
- [ ] Task 2.4.4: Implement `generateTestingGroups()` and `generateBuildToolGroups()`

**Story 2.5: Intelligent Batching Algorithm**

- [ ] Task 2.5.1: Implement semantic versioning awareness (major vs minor vs patch)
- [ ] Task 2.5.2: Separate breaking changes (major) from safe updates (minor/patch)
- [ ] Task 2.5.3: Add exclusion patterns for known problematic updates
- [ ] Task 2.5.4: Implement dependency conflict detection
- [ ] Task 2.5.5: Add comprehensive unit tests for batching logic

**Acceptance Criteria**:

- ✅ React projects get 3-5 groups instead of 20+ individual PRs
- ✅ Major version updates isolated from minor/patch batches
- ✅ Framework-specific patterns cover 80%+ of common dependencies
- ✅ Batching algorithm handles edge cases (conflicting versions, peer deps)

**Parallel Execution**: Story 2.1-2.4 can run concurrently (different developers)

---

### ⚙️ Phase 3: Dependabot Configuration Generation (10 hours)

**Story 3.1: Premium Config Generation**

- [ ] Task 3.1.1: Implement `generatePremiumDependabotConfig(options, license)`
- [ ] Task 3.1.2: Check license tier (Pro/Enterprise required)
- [ ] Task 3.1.3: Call `detectFrameworks()` to get project frameworks
- [ ] Task 3.1.4: Generate groups based on detected frameworks
- [ ] Task 3.1.5: Merge groups into Dependabot config structure

**Story 3.2: Dependabot Groups Configuration**

- [ ] Task 3.2.1: Generate `groups` field in Dependabot config (v2 schema)
- [ ] Task 3.2.2: Add `patterns` for each group (wildcard support)
- [ ] Task 3.2.3: Add `update-types` (major/minor/patch filtering)
- [ ] Task 3.2.4: Add `dependency-type` (production vs development)
- [ ] Task 3.2.5: Validate against Dependabot schema (GitHub docs)

**Story 3.3: Custom Schedules (Premium)**

- [ ] Task 3.3.1: Add daily schedule for security updates
- [ ] Task 3.3.2: Add weekly schedule for framework updates
- [ ] Task 3.3.3: Add monthly schedule for major versions
- [ ] Task 3.3.4: Make schedules configurable via options

**Story 3.4: Integration with Setup Flow**

- [ ] Task 3.4.1: Modify `setup.js` line 567 to check license tier
- [ ] Task 3.4.2: Call `generatePremiumDependabotConfig()` for Pro/Enterprise
- [ ] Task 3.4.3: Call `generateBasicDependabotConfig()` for Free tier
- [ ] Task 3.4.4: Add upgrade prompt for Free tier users
- [ ] Task 3.4.5: Update setup output to show groups created

**Story 3.5: YAML Output Enhancement**

- [ ] Task 3.5.1: Extend `convertToYaml()` to handle groups field
- [ ] Task 3.5.2: Add comments in generated YAML explaining groups
- [ ] Task 3.5.3: Add Pro tier badge in generated config header

**Acceptance Criteria**:

- ✅ Generated Dependabot config validates with GitHub schema
- ✅ Groups configuration reduces PRs by 60%+ in test projects
- ✅ Free tier shows upgrade prompt with group preview
- ✅ Generated YAML is human-readable with helpful comments

---

### 🧪 Phase 4: Testing & Validation (8 hours)

**Story 4.1: Unit Tests**

- [ ] Task 4.1.1: Test `detectFrameworks()` with React/Vue/Angular package.json
- [ ] Task 4.1.2: Test `generateReactGroups()` output structure
- [ ] Task 4.1.3: Test batching algorithm with semantic versioning
- [ ] Task 4.1.4: Test license tier validation (Free vs Pro)
- [ ] Task 4.1.5: Test YAML generation with groups field
- [ ] Task 4.1.6: Achieve 90%+ code coverage

**Story 4.2: Integration Tests**

- [ ] Task 4.2.1: Create test fixtures (React, Vue, Angular projects)
- [ ] Task 4.2.2: Run setup with Pro license key simulation
- [ ] Task 4.2.3: Validate generated Dependabot config structure
- [ ] Task 4.2.4: Verify groups reduce PR count in simulation
- [ ] Task 4.2.5: Test edge cases (monorepos, mixed frameworks)

**Story 4.3: E2E Validation**

- [ ] Task 4.3.1: Test against real React project (create-react-app)
- [ ] Task 4.3.2: Test against real Vue project (Vue CLI)
- [ ] Task 4.3.3: Test against real Next.js project
- [ ] Task 4.3.4: Validate GitHub accepts generated config (syntax check)
- [ ] Task 4.3.5: Monitor Dependabot behavior with grouped config

**Story 4.4: Performance Testing**

- [ ] Task 4.4.1: Test framework detection with large package.json (100+ deps)
- [ ] Task 4.4.2: Benchmark grouping algorithm performance
- [ ] Task 4.4.3: Ensure <500ms overhead for premium config generation

**Acceptance Criteria**:

- ✅ All unit tests pass (90%+ coverage)
- ✅ Integration tests validate real-world scenarios
- ✅ E2E tests confirm GitHub Dependabot accepts config
- ✅ Performance benchmarks meet <500ms target

---

### 📚 Phase 5: Documentation & Release (2 hours)

**Story 5.1: Documentation Updates**

- [ ] Task 5.1.1: Update README.md - change "Coming soon" to "Available now"
- [ ] Task 5.1.2: Add framework grouping examples to README
- [ ] Task 5.1.3: Document group patterns for each framework
- [ ] Task 5.1.4: Add troubleshooting guide for common issues
- [ ] Task 5.1.5: Update CHANGELOG.md with PREMIUM-001 details

**Story 5.2: Example Configurations**

- [ ] Task 5.2.1: Create example: React project grouping
- [ ] Task 5.2.2: Create example: Vue project grouping
- [ ] Task 5.2.3: Create example: Monorepo with mixed frameworks
- [ ] Task 5.2.4: Add examples to docs/ directory

**Story 5.3: Marketing Materials**

- [ ] Task 5.3.1: Update landing page with framework grouping feature
- [ ] Task 5.3.2: Create comparison table: Free vs Pro
- [ ] Task 5.3.3: Add testimonials section (collect from beta users)
- [ ] Task 5.3.4: Deploy landing page updates

**Acceptance Criteria**:

- ✅ README accurately reflects "Available now" status
- ✅ Documentation complete with examples
- ✅ Marketing materials ready for launch

---

## Technical Specifications

### Dependabot Groups Schema (GitHub v2)

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: '09:00'
    groups:
      react-core:
        patterns:
          - react
          - react-dom
          - react-router*
        update-types:
          - minor
          - patch
      react-ecosystem:
        patterns:
          - '@tanstack/*'
          - zustand
          - jotai
        update-types:
          - patch
      testing-frameworks:
        patterns:
          - jest
          - '@testing-library/*'
          - vitest
        update-types:
          - minor
          - patch
```

### Framework Detection Patterns

**React**:

```javascript
{
  core: ['react', 'react-dom'],
  routing: ['react-router', 'react-router-dom', '@tanstack/react-router'],
  state: ['zustand', 'jotai', 'redux', '@reduxjs/toolkit'],
  query: ['@tanstack/react-query', 'swr'],
  forms: ['react-hook-form', 'formik'],
  ui: ['@mui/material', '@chakra-ui/react', '@radix-ui/react-*'],
  metaFrameworks: ['next', 'remix', 'gatsby']
}
```

**Vue**:

```javascript
{
  core: ['vue'],
  routing: ['vue-router'],
  state: ['pinia', 'vuex'],
  ecosystem: ['@vue/*', 'vueuse'],
  ui: ['vuetify', 'element-plus', '@vueuse/core'],
  metaFrameworks: ['nuxt']
}
```

**Angular**:

```javascript
{
  core: ['@angular/core', '@angular/common', '@angular/platform-browser'],
  routing: ['@angular/router'],
  forms: ['@angular/forms'],
  http: ['@angular/common/http'],
  state: ['@ngrx/*', '@ngxs/*'],
  ui: ['@angular/material', '@ng-bootstrap/ng-bootstrap'],
  cli: ['@angular/cli', '@angular-devkit/*']
}
```

## Quality Gates

### Phase Completion Criteria

**Phase 1 Exit Criteria**:

- [ ] Framework detection identifies React, Vue, Angular with 95%+ accuracy
- [ ] Unit tests cover all detection logic
- [ ] Code review approved by architect persona

**Phase 2 Exit Criteria**:

- [ ] Grouping algorithm reduces PRs by 60%+ in simulation
- [ ] All framework patterns defined and tested
- [ ] Breaking change detection working correctly

**Phase 3 Exit Criteria**:

- [ ] Generated Dependabot config validates against GitHub schema
- [ ] Integration with setup.js complete
- [ ] License tier validation working

**Phase 4 Exit Criteria**:

- [ ] 90%+ code coverage achieved
- [ ] E2E tests pass with real GitHub repositories
- [ ] Performance benchmarks met

**Phase 5 Exit Criteria**:

- [ ] Documentation complete and accurate
- [ ] Marketing materials ready
- [ ] README updated with "Available now"

## Risk Mitigation

### Technical Risks

**Risk 1: Dependabot Schema Changes**

- Mitigation: Pin to Dependabot v2 schema, monitor GitHub changelog
- Fallback: Maintain compatibility layer for schema updates

**Risk 2: Framework Pattern Maintenance**

- Mitigation: Make patterns configurable, allow user overrides
- Fallback: Regular updates based on ecosystem changes

**Risk 3: License Validation Bypass**

- Mitigation: Server-side license validation (future enhancement)
- Fallback: Client-side validation sufficient for v1

### Business Risks

**Risk 1: Grouping Doesn't Reduce PRs as Expected**

- Mitigation: A/B test with real projects before launch
- Fallback: Refine patterns based on user feedback

**Risk 2: Free Users Don't Upgrade**

- Mitigation: Show concrete PR reduction in upgrade prompt
- Fallback: Add more premium features (PREMIUM-002, PREMIUM-003)

## Success Metrics

### Product Metrics

- **PR Reduction**: 60%+ reduction in dependency PRs for React projects
- **Adoption**: 50+ Pro subscribers within 60 days
- **Conversion**: 10%+ free → Pro conversion rate
- **NPS**: >50 among Pro users

### Technical Metrics

- **Performance**: <500ms overhead for premium config generation
- **Accuracy**: 95%+ framework detection accuracy
- **Quality**: 90%+ code coverage, 0 critical bugs
- **Compatibility**: Works with 100% of tested frameworks

## Timeline & Milestones

### Week 1: Foundation (Phase 1)

- Days 1-2: Create premium module, framework detection
- Days 3-4: Version analysis, unit tests
- Day 5: Code review, refactor

### Week 2: Grouping Logic (Phase 2)

- Days 1-2: React + Vue groups
- Days 3-4: Angular + testing/build groups
- Day 5: Batching algorithm, testing

### Week 3: Integration (Phase 3)

- Days 1-2: Config generation, Dependabot schema
- Days 3-4: Setup.js integration, custom schedules
- Day 5: YAML enhancement, upgrade prompts

### Week 4: Testing & Launch (Phase 4-5)

- Days 1-2: Unit + integration tests
- Days 3-4: E2E validation, performance testing
- Day 5: Documentation, marketing, release

## Next Steps

1. **Immediate** (Today):
   - [ ] Create `lib/dependency-monitoring-premium.js` file
   - [ ] Set up development branch: `feature/premium-001-framework-grouping`
   - [ ] Start Phase 1: Framework detection implementation

2. **This Week**:
   - [ ] Complete Phase 1: Foundation & Framework Detection
   - [ ] Begin Phase 2: React dependency groups
   - [ ] Daily standups to track progress

3. **Next Week**:
   - [ ] Complete Phase 2: All framework groups
   - [ ] Begin Phase 3: Dependabot integration
   - [ ] Mid-sprint review and adjustment

4. **Week 3-4**:
   - [ ] Complete Phase 3: Full integration
   - [ ] Complete Phase 4: Testing
   - [ ] Complete Phase 5: Documentation and release

## Related Work

- **PREMIUM-002**: Multi-language monitoring (can reuse detection patterns)
- **TELEMETRY-001**: Track which frameworks users have (informs grouping)
- **PREMIUM-003**: Advanced security workflows (build on grouping foundation)

---

**Status**: 🟢 Ready to implement
**Assigned**: Backend architect + System architect personas
**MCP Servers**: Sequential (multi-step planning), Context7 (Dependabot patterns), Serena (cross-session persistence)
**Estimated Completion**: 4 weeks (40 hours)
