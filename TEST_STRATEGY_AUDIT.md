# Testing Strategy Audit - Command Execution Gap

> **Copy this file to any project to audit for the "structure vs behavior" testing gap**

## The Problem in 30 Seconds

Your tests verify that configurations exist, but don't verify they actually work.

**Example:**

```javascript
// ❌ This passes even if the command is broken
test('has lint script', () => {
  const pkg = require('./package.json')
  expect(pkg.scripts.lint).toBeDefined()
})

// ✅ This catches broken commands
test('lint script works', () => {
  execSync('npm run lint')
})
```

---

## Quick Self-Audit (5 Minutes)

### Step 1: Does your project generate configs/commands for others?

```bash
# Check if you generate package.json scripts
grep -r "scripts.*lint\|scripts.*build\|scripts.*test" lib/ config/ src/ 2>/dev/null

# Check if you generate config files
find . -name "*.template.*" -o -name "*config*.js" | grep -v node_modules
```

**If YES** → Continue to Step 2
**If NO** → This audit doesn't apply

---

### Step 2: Do your tests execute those generated commands?

```bash
# Search for command execution in tests
grep -r "execSync.*npm run\|exec.*npm\|spawn.*npm" tests/ spec/ __tests__/ 2>/dev/null

# Search for child_process usage
grep -r "require.*child_process\|from.*child_process" tests/ spec/ __tests__/ 2>/dev/null
```

**If EMPTY RESULTS** → ⚠️ You have the gap
**If FOUND** → Check if they test _generated_ configs (Step 3)

---

### Step 3: Do you test commands in isolation?

Look for this pattern in your test output:

```javascript
// ❌ BAD: Testing in the current project
test('lint works', () => {
  execSync('npm run lint') // Uses this project's config
})

// ✅ GOOD: Testing in a generated project
test('generated lint works', () => {
  const tempDir = createTempProject()
  runYourGenerator(tempDir)
  execSync('npm run lint', { cwd: tempDir }) // Uses generated config
})
```

**If you don't create temp projects** → ⚠️ You have the gap

---

## Severity Assessment

### 🔴 CRITICAL - Fix Immediately

- [ ] You generate commands for other projects
- [ ] Zero tests execute those commands
- [ ] Tool is public/has users

**Impact:** Every user could have broken configs

---

### 🟡 HIGH - Fix This Sprint

- [ ] You generate commands for other projects
- [ ] Tests execute commands, but in current project only
- [ ] No isolation testing

**Impact:** Breaking changes go undetected

---

### 🟢 MEDIUM - Improve Soon

- [ ] You test commands in isolation
- [ ] But only test happy path
- [ ] No error case testing

**Impact:** Edge cases fail in production

---

## The Fix (Copy/Paste Template)

### Minimum Viable Test

```javascript
// tests/command-execution.test.js
'use strict'
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

/**
 * CRITICAL: Test that generated commands ACTUALLY WORK
 * This test would have caught the ESLint --ext bug
 */

function setupTestProject() {
  // 1. Create isolated temp directory
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-gen-'))

  // 2. Initialize git (if your tool requires it)
  execSync('git init', { cwd: dir, stdio: 'ignore' })

  // 3. Create minimal package.json
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2)
  )

  return dir
}

function runCommand(dir, command, description) {
  try {
    console.log(`  Testing: ${description}`)
    execSync(command, {
      cwd: dir,
      encoding: 'utf8',
      stdio: 'pipe',
    })
    console.log(`  ✅ ${description} PASSED`)
    return true
  } catch (error) {
    console.error(`  ❌ ${description} FAILED`)
    console.error(`     Command: ${command}`)
    console.error(`     Exit code: ${error.status}`)
    console.error(`     Output: ${error.stderr}`)
    throw error
  }
}

// === CUSTOMIZE THIS SECTION FOR YOUR PROJECT ===

test('generated commands work in isolation', () => {
  const testDir = setupTestProject()

  try {
    // 1. Run your generator/setup tool
    execSync(`node ${__dirname}/../your-setup-script.js`, {
      cwd: testDir,
      stdio: 'inherit',
    })

    // 2. Install dependencies (generated configs need actual packages)
    execSync('npm install', { cwd: testDir, stdio: 'inherit' })

    // 3. Create test files (so commands have something to work on)
    fs.writeFileSync(
      path.join(testDir, 'test.js'),
      'const x = 1;\nconsole.log(x);\n'
    )

    // 4. Test each generated command
    runCommand(testDir, 'npm run lint', 'Lint command')
    runCommand(testDir, 'npm run format:check', 'Format check command')
    runCommand(testDir, 'npm run test', 'Test command')

    // 5. Test direct tool invocation (catches CLI flag issues)
    runCommand(testDir, 'npx eslint test.js', 'Direct ESLint')

    console.log('\n✅ All generated commands work!')
  } finally {
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})

// === END CUSTOMIZATION ===
```

---

## Integration with Existing Tests

### Option A: Add to existing test suite

```javascript
// At the end of your main test file
describe('Command Execution Tests', () => {
  // Paste the template above here
})
```

### Option B: Separate test file

```bash
# Create new test file
touch tests/command-execution.test.js

# Add to package.json test script
"test": "existing-tests && node tests/command-execution.test.js"
```

### Option C: E2E enhancement

```bash
# Add to your E2E script (test-e2e.sh, etc)
echo "Testing generated commands..."
cd test-project
npm run lint || exit 1
npm run test || exit 1
npm run build || exit 1
```

---

## Red Flags to Watch For

### 🚩 Test Smells

```javascript
// Tests that don't catch broken commands:

// 1. Structure-only testing
expect(pkg.scripts.lint).toBe('eslint . --ext .js') // Wrong flag goes unnoticed

// 2. Mocked execution
jest.spyOn(child_process, 'execSync').mockReturnValue('') // Never actually runs

// 3. Same-project testing
execSync('npm run lint') // Tests YOUR config, not generated config

// 4. No actual files
execSync('npm run lint', { cwd: emptyDir }) // Command succeeds on empty dir
```

### ✅ Good Testing Patterns

```javascript
// Tests that catch broken commands:

// 1. Isolated environment
const tempDir = fs.mkdtempSync(...)
runGenerator(tempDir)
execSync('npm run lint', { cwd: tempDir })  // Actually runs in isolation

// 2. Real files to process
fs.writeFileSync(path.join(tempDir, 'test.js'), 'const x = 1;')
execSync('npm run lint', { cwd: tempDir })  // Command processes real files

// 3. Error validation
expect(() => {
  execSync('npm run lint', { cwd: dirWithErrors })
}).toThrow()  // Verifies command detects issues

// 4. Command output verification
const output = execSync('npm run lint', { cwd: tempDir, encoding: 'utf8' })
expect(output).toContain('✓ No errors')  // Verifies correct behavior
```

---

## Version Compatibility Bonus Check

If your project specifies dependency versions, test with those exact versions:

```javascript
// config/defaults.js (or similar)
const VERSIONS = {
  eslint: '^9.12.0',
  prettier: '^3.3.3',
}

// tests/version-compatibility.test.js
test('works with specified versions', () => {
  const testDir = setupTestProject()

  // Install EXACT versions you recommend
  const pkg = {
    name: 'test',
    version: '1.0.0',
    devDependencies: {
      eslint: '9.12.0', // NOT ^9.12.0
      prettier: '3.3.3', // NOT ^3.3.3
    },
  }

  fs.writeFileSync(
    path.join(testDir, 'package.json'),
    JSON.stringify(pkg, null, 2)
  )

  runGenerator(testDir)
  execSync('npm install', { cwd: testDir })
  execSync('npm run lint', { cwd: testDir })
})
```

---

## Checklist for Future

- [ ] New commands added → Add execution test
- [ ] CLI flags changed → Run execution test
- [ ] Dependency versions updated → Test with new versions
- [ ] Before each release → Run full command execution suite
- [ ] CI/CD must run execution tests, not just unit tests

---

## Real-World Impact

**Case Study: create-qa-architect**

- **Before:** 12,258 lines of tests, all passing ✅
- **Problem:** ESLint `--ext` flag deprecated in v9
- **What tests checked:** "Does lint script exist?" ✅
- **What tests missed:** "Does lint script work?" ❌
- **Result:** Every user got broken CI/CD pipelines

**The fix:** One 30-line test that runs `npm run lint` in isolation would have caught it.

---

## Quick Win

Add this one-liner to your E2E test **today**:

```bash
# In your test-e2e.sh or similar
npm run lint && npm run test && npm run build
```

If this fails, you have broken commands. If it passes, add it to CI.

---

## Questions to Ask Your Team

1. "Do we generate configs/commands for other projects?"
2. "Do any tests execute those generated commands?"
3. "Do we test in an isolated temp directory?"
4. "Would a CLI flag typo be caught before release?"

If any answer is "no" or "unsure," you need this fix.

---

## Copy/Paste Checklist

```markdown
## Testing Strategy Audit

- [ ] Identified if we generate configs (Step 1)
- [ ] Checked if tests execute commands (Step 2)
- [ ] Verified tests use isolation (Step 3)
- [ ] Copied command-execution.test.js template
- [ ] Customized template for our tool
- [ ] Added to test suite
- [ ] Added to CI/CD
- [ ] Verified tests catch broken commands
- [ ] Documented testing requirements for team
```

---

## Further Reading

- Original issue: AUDIT_QUALITY_GAPS.md (same repo)
- Testing philosophy: Test behavior, not structure
- Integration testing: Always test the consumer's perspective

---

**TL;DR:** If you generate commands, test them by running them in isolation. One `execSync('npm run lint')` test beats 1000 lines of structure checks.
