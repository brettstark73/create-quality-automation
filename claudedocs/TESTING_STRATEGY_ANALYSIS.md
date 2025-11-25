# Cross-Project Testing Strategy Analysis

**Date:** 2025-11-25
**Status:** Planning Phase - Implementation Pending
**Scope:** create-quality-automation, letterflow, keyflash, saas-starter-template, project-starter-guide

---

## Executive Summary

**Problem:** Inconsistent testing strategies causing 10+ hour pre-push delays in some projects while others have optimized flows.

**Solution:** Tiered testing strategy adapted to project type with consistent implementation patterns.

---

## Project Classification & Testing Needs

### 1. **create-quality-automation** (CLI Tool Generator)

**Type:** Developer tooling / npm package
**Special Characteristics:**

- Generates code for OTHER projects
- Must test generated output actually works
- Integration tests are CRITICAL (not optional)

**Current Test Breakdown:**

- 41 total test files
- 30 integration/E2E tests (73%) - Create real projects, run npm install
- 11 true unit tests (27%) - Logic validation only

**Current Pre-Push:** 10+ hours (BROKEN)

- ✅ Pattern validation (~5s)
- ✅ Lint (~30s)
- ✅ Format check (~20s)
- ❌ Command execution tests (~5-10min) - Creates 4 real projects
- ❌ All 37+ tests (~10 hours!) - Sequential execution

**Recommended Strategy:** SPECIALIZED - Split by speed

```bash
Pre-Push (< 2 min):
  - Pattern validation
  - Lint (ESLint + Stylelint)
  - Format check
  - Unit tests only (11 files, fast)

CI/CD (5-10 min):
  - All unit tests
  - All integration tests (parallel)
  - Command execution tests
  - Security audits
```

**Rationale:** CLI tool generators NEED integration tests, but they don't need to block developer workflow. CI catches issues fast enough.

---

### 2. **letterflow** (Web Application)

**Type:** Production web app (Next.js)
**Special Characteristics:**

- Crypto operations (slow tests)
- Browser/E2E tests (Playwright)
- Real API integration tests
- Security-critical (payment processing)

**Current Test Breakdown:**

- test:fast - Unit tests only
- test:medium - Fast + smoke (excludes crypto/browser)
- test:slow - Crypto + real integration tests
- test:comprehensive - Everything + E2E

**Current Pre-Push:** OPTIMIZED (~15s)

- ✅ Lint
- ✅ Format check
- ✅ test:medium (fast + smoke, no crypto/browser)

**Smart Strategy Available (Not Active):**

- Risk-based test selection
- 2s (docs only) → 35s (high risk + security audit)
- Considers: files changed, lines changed, branch, time of day

**Recommended Strategy:** KEEP CURRENT or ACTIVATE SMART

```bash
Option A (Current - Simple):
  Pre-Push: test:medium (~15s consistently)
  CI: test:comprehensive

Option B (Smart - Adaptive):
  Pre-Push: Risk-based 2s-35s
  CI: test:comprehensive
```

**Rationale:** Web apps benefit from smart testing - documentation changes don't need crypto tests. Current setup already good.

---

### 3. **keyflash** (TBD - Need Analysis)

**Type:** Unknown - Need to investigate
**Action Required:** Analyze project structure and current testing setup

---

### 4. **saas-starter-template** (Template Project)

**Type:** Boilerplate/starter template
**Special Characteristics:**

- No production code
- Template for OTHER projects
- Testing validates template quality

**Recommended Strategy:** MINIMAL

```bash
Pre-Push (< 30s):
  - Lint
  - Format check
  - Template validation (if exists)

CI/CD:
  - Full validation
  - Template generation test
  - Sample project bootstrap
```

**Rationale:** Templates don't have runtime behavior to test extensively. Focus on quality and completeness.

---

### 5. **project-starter-guide** (Documentation)

**Type:** Documentation/guide repository
**Special Characteristics:**

- Markdown files
- No executable code
- Link validation
- Spelling/grammar checks

**Recommended Strategy:** DOCS-FOCUSED

```bash
Pre-Push (< 10s):
  - Markdown linting
  - Link validation (broken links)
  - Spelling check

CI/CD:
  - Full link validation
  - Build test (if generated site)
  - Accessibility checks
```

**Rationale:** Documentation projects need different quality gates - readability and accuracy over unit tests.

---

## Universal Testing Principles

### Three-Tier Validation Gates

**Tier 1: Pre-Commit** (< 5 seconds)

- **Purpose:** Catch obvious style issues before git history
- **Scope:** Staged files only
- **Tools:** lint-staged
- **Actions:**
  - ESLint on staged .js/.ts files
  - Prettier on staged files
  - Stylelint on staged .css files

**Tier 2: Pre-Push** (< 2 minutes)

- **Purpose:** Fast feedback before remote push
- **Scope:** Project-specific smart selection
- **Actions:**
  - Pattern validation
  - Full lint (all files)
  - Format check (all files)
  - Fast tests (unit tests, smoke tests)
  - **NEVER:** Integration tests, E2E tests, npm installs

**Tier 3: CI/CD** (5-15 minutes)

- **Purpose:** Comprehensive validation before merge/deploy
- **Scope:** Everything, parallel execution
- **Actions:**
  - All tests (unit, integration, E2E)
  - Security audits
  - Performance tests
  - Build verification
  - Deploy previews

---

## Test Classification System

### Fast Tests (< 5 seconds total)

**Characteristics:**

- Pure logic, no I/O
- No network requests
- No file system operations
- No subprocess execution

**Examples:**

- Utility function tests
- Validation logic
- Data transformations
- Pure calculations

**When to Run:** Pre-push, pre-commit (via lint-staged)

---

### Medium Tests (5-30 seconds total)

**Characteristics:**

- Light I/O (temp files)
- Mocked external dependencies
- In-memory operations
- Smoke tests

**Examples:**

- API route handlers (mocked)
- Component rendering
- Configuration parsing
- Template generation

**When to Run:** Pre-push (project-dependent)

---

### Slow Tests (30s - 5 minutes)

**Characteristics:**

- Real I/O operations
- Actual subprocess execution
- Real network requests
- Browser automation
- Crypto operations

**Examples:**

- E2E tests (Playwright)
- Real npm installs
- Crypto operations
- Database migrations
- Real API integration

**When to Run:** CI/CD ONLY, never pre-push

---

## Implementation Plan

### Phase 1: Analysis (Current)

- ✅ Analyze letterflow (complete)
- ✅ Analyze create-quality-automation (complete)
- ⏳ Analyze keyflash (pending)
- ⏳ Analyze saas-starter-template (pending)
- ⏳ Analyze project-starter-guide (pending)

### Phase 2: Design (Next)

- Create project-specific test split scripts
- Define test:fast, test:medium, test:slow for each
- Design smart strategy for applicable projects
- Document migration process

### Phase 3: Implementation

**Per Project:**

1. Split tests into fast/medium/slow categories
2. Update package.json scripts
3. Update .husky/pre-push hook
4. Test the new flow
5. Document in project CLAUDE.md

**Order:**

1. create-quality-automation (highest pain)
2. letterflow (activate smart strategy if desired)
3. keyflash (after analysis)
4. saas-starter-template (if needed)
5. project-starter-guide (if needed)

### Phase 4: Validation

- Test each project's new flow
- Measure pre-push times
- Verify CI still catches issues
- Adjust thresholds as needed

### Phase 5: Documentation

- Update global CLAUDE.md with testing principles
- Update per-project CLAUDE.md with specific strategy
- Create testing decision flowchart
- Share learnings across projects

---

## Decision Matrix

### When to Use Which Strategy

| Project Type         | Pre-Push Strategy     | Why                                           |
| -------------------- | --------------------- | --------------------------------------------- |
| CLI Tool Generator   | Fast tests only       | Integration tests too slow, CI catches issues |
| Web App (Simple)     | Medium tests          | Balance speed + coverage                      |
| Web App (Complex)    | Smart/Risk-based      | Optimize based on changes                     |
| Template/Boilerplate | Lint + format only    | No runtime to test                            |
| Documentation        | Markdown lint + links | Different quality gates                       |
| Library/Package      | Fast + smoke tests    | Need quick validation                         |

---

## Key Metrics

### Target Pre-Push Times

| Project Type | Target  | Maximum |
| ------------ | ------- | ------- |
| CLI Tool     | < 1 min | 2 min   |
| Web App      | < 30s   | 1 min   |
| Template     | < 15s   | 30s     |
| Docs         | < 10s   | 15s     |

### CI/CD Times (Acceptable)

| Project Type | Target   | Maximum |
| ------------ | -------- | ------- |
| CLI Tool     | 5-10 min | 15 min  |
| Web App      | 3-8 min  | 12 min  |
| Template     | 2-5 min  | 8 min   |
| Docs         | 1-3 min  | 5 min   |

---

## Next Steps

1. **Analyze remaining projects** (keyflash, saas-starter-template, project-starter-guide)
2. **Get approval on strategy** from user
3. **Implement create-quality-automation** first (highest pain point)
4. **Test and validate** new flow
5. **Roll out to other projects** based on learnings

---

## Questions for User

1. **keyflash:** What type of project is this? What tests does it have?
2. **Priority:** Which project should we fix first besides create-quality-automation?
3. **Smart Strategy:** Should letterflow activate the smart strategy or keep fixed medium?
4. **Templates:** Do saas-starter-template and project-starter-guide need test optimization?

---

## Appendix: Letterflow Smart Strategy

**Risk Scoring (0-10):**

- High-risk files (auth, payment, crypto): +4
- API files: +2
- Config files: +2
- > 10 files changed: +2
- > 200 lines changed: +2
- Main/master branch: +3
- Hotfix branch: +4

**Test Selection:**

- Risk ≥ 7: Comprehensive + security audit
- Risk 4-6: Medium (fast + smoke)
- Risk 2-3: Fast only
- Risk 0-1: Lint + format only

**Time Adjustment:**

- Work hours (9-5 M-F): Speed bonus (favor faster tests)
- Off hours: Favor comprehensive

---

**This document is a living analysis. Update as we implement and learn.**
