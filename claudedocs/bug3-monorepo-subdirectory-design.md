# Bug #3: Monorepo Subdirectory Detection - Design Document

## Problem Statement

**Current Behavior**: Detection only scans `process.cwd()` for manifest files
**Impact**: Python/Rust/Ruby projects in subdirectories (e.g., `services/api/pyproject.toml`) are invisible
**Result**: Dependabot entries hardcode `directory: '/'` which fails for subdirectory manifests

## Proposed Solution

### Phase 1: Scan Common Subdirectories (Minimal Implementation)

Scan known monorepo patterns:

- `apps/*`
- `services/*`
- `packages/*`
- `projects/*`

For each subdirectory, check for manifest files:

- Python: `pyproject.toml`, `requirements.txt`, `setup.py`
- Rust: `Cargo.toml`
- Ruby: `Gemfile`
- JavaScript: `package.json`

### Phase 2: Per-Directory Dependabot Entries

Instead of:

```yaml
- package-ecosystem: pip
  directory: / # WRONG - no pyproject.toml at root
```

Generate:

```yaml
- package-ecosystem: pip
  directory: /services/api # CORRECT - pyproject.toml found here
```

### Implementation Plan

1. **New Function**: `scanSubdirectoriesForManifests(projectPath, maxDepth = 3)`
   - Returns: `{ ecosystem: [{ directory, frameworkInfo }] }`
   - Example: `{ pip: [{ directory: '/services/api', frameworkInfo: {...} }] }`

2. **Update**: `detectAllEcosystems(projectPath)`
   - Call `scanSubdirectoriesForManifests` if no root-level manifests found
   - OR always scan subdirectories and merge results

3. **Update**: `generatePremiumDependabotConfig`
   - Accept `ecosystemsWithDirectories` instead of flat `ecosystems`
   - Generate one Dependabot entry per `(ecosystem, directory)` pair

4. **Backward Compatibility**:
   - If all manifests are at root → same behavior as before
   - If subdirectory manifests found → emit per-directory entries

## Test Cases

```javascript
// Monorepo structure:
/package.json (npm)
/services/api/pyproject.toml (python)
/services/payment/Cargo.toml (rust)

// Expected Dependabot entries:
- package-ecosystem: npm
  directory: /

- package-ecosystem: pip
  directory: /services/api

- package-ecosystem: cargo
  directory: /services/payment
```

## Complexity Assessment

- **High complexity**: Full recursive scanning with cycle detection
- **Medium complexity**: Fixed depth (3 levels), known patterns only
- **Low complexity**: Accept `--directory` flag, manual per-service invocation

**Recommendation**: Medium complexity (scan known patterns, max depth 3)

## Estimated Impact

- **Lines changed**: ~200 lines
- **New functions**: 2-3
- **Breaking changes**: None (backward compatible)
- **Test files**: 1 new test suite

## Decision

**Status**: DEFERRED for v3.1.1 or v3.2.0 patch release

**Rationale**:

1. Requires significant architectural changes
2. Needs thorough testing for edge cases
3. Should not block current parser bug fixes (v3.1.0)
4. Users can work around with manual per-directory invocation

**Workaround for Users**:

```bash
# Run CLI in each service directory
cd services/api && npx create-quality-automation --deps
cd ../payment && npx create-quality-automation --deps
```

## References

- User bug report: High priority monorepo support
- Dependabot docs: https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file#directory
